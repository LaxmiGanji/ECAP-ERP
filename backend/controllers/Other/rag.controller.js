const RAGDocument = require("../../models/Other/ragDocument.model");
const { generateEmbedding, cosineSimilarity, pineconeService } = require("../../services/pinecone.service");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * 1. Query Library RAG (Natural Language Retrieval + Generation)
 * POST /api/library/rag/query
 */
const queryLibraryRAG = async (req, res) => {
  try {
    const { query, documentType, branch, subject, topK = 5 } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ success: false, message: "Query text is required." });
    }

    const queryClean = query.trim();

    // 1. Generate query embedding
    const queryVector = await generateEmbedding(queryClean);

    // 2. Fetch documents from DB based on optional filters
    const filter = {};
    if (documentType && documentType !== "all") {
      filter.documentType = documentType;
    }
    if (branch && branch !== "All") {
      filter.branch = { $regex: new RegExp(branch, "i") };
    }
    if (subject && subject !== "All") {
      filter.subject = { $regex: new RegExp(subject, "i") };
    }

    const allDocs = await RAGDocument.find(filter);

    if (allDocs.length === 0) {
      return res.json({
        success: true,
        answer: "No relevant library catalog books, research papers, or previous year question papers found for your query. Try broadening your search or choosing a different category.",
        sources: [],
        vectorMatchesCount: 0,
      });
    }

    // 3. Try Pinecone Vector Search first
    let vectorMatches = await pineconeService.queryPinecone(queryVector, topK, filter);
    let matchedDocs = [];

    if (vectorMatches && vectorMatches.length > 0) {
      const matchIds = vectorMatches.map((m) => m.id);
      const pineconeDocs = await RAGDocument.find({ _id: { $in: matchIds } });
      matchedDocs = pineconeDocs.map((doc) => {
        const pMatch = vectorMatches.find((m) => m.id === doc._id.toString());
        return {
          doc,
          score: pMatch ? pMatch.score : 0.8,
        };
      });
    }

    // Fallback/Hybrid Local Cosine Vector Ranking
    if (matchedDocs.length === 0) {
      const scoredDocs = allDocs.map((doc) => {
        let score = 0;
        if (doc.embedding && doc.embedding.length > 0) {
          score = cosineSimilarity(queryVector, doc.embedding);
        }

        // Add text keyword boost
        const docText = `${doc.title} ${doc.summary} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
        const queryWords = queryClean.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        let keywordHits = 0;
        queryWords.forEach((word) => {
          if (docText.includes(word)) keywordHits += 1;
        });

        const keywordBoost = (keywordHits / Math.max(queryWords.length, 1)) * 0.4;
        const finalScore = Math.min(score * 0.6 + keywordBoost, 0.99);

        return { doc, score: finalScore };
      });

      // Sort descending by similarity score
      scoredDocs.sort((a, b) => b.score - a.score);
      matchedDocs = scoredDocs.slice(0, Number(topK));
    }

    // Filter matches with meaningful relevance
    const relevantDocs = matchedDocs.filter((m) => m.score > 0.05).slice(0, Number(topK));
    const topContextDocs = relevantDocs.length > 0 ? relevantDocs : matchedDocs.slice(0, 3);

    // 4. Construct Context for RAG LLM Synthesis
    const contextSnippet = topContextDocs
      .map((item, index) => {
        const d = item.doc;
        return `[Source ${index + 1}]:
Type: ${d.documentType.toUpperCase()}
Title: ${d.title}
Author/Publisher: ${d.author || d.publisher || "N/A"}
Rack Number / Location: ${d.rackNumber || "Digital Vault"}
Book Code / Ref: ${d.bookCode || "N/A"}
Branch & Subject: ${d.branch} - ${d.subject} (Sem ${d.semester || "All"})
Year/Exam: ${d.publishedYear || d.examType || "N/A"}
Available Copies: ${d.availableCount}/${d.quantity}
Summary/Abstract: ${d.summary || d.content.substring(0, 300)}
Full Details: ${d.content}
File/Download URL: ${d.fileUrl || d.downloadUrl || "N/A"}
--------------------------------------------------`;
      })
      .join("\n\n");

    // Format Sources for Client UI Response
    const sources = topContextDocs.map((item) => ({
      id: item.doc._id,
      title: item.doc.title,
      documentType: item.doc.documentType,
      author: item.doc.author,
      journal: item.doc.journal,
      rackNumber: item.doc.rackNumber,
      bookCode: item.doc.bookCode,
      branch: item.doc.branch,
      subject: item.doc.subject,
      semester: item.doc.semester,
      year: item.doc.publishedYear,
      examType: item.doc.examType,
      availableCount: item.doc.availableCount,
      fileUrl: item.doc.fileUrl || item.doc.downloadUrl,
      score: Math.round(item.score * 100),
      summary: item.doc.summary,
    }));

    // 5. LLM Answer Generation
    let answerText = "";

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are the ECAP Intelligent Library Assistant, an expert AI RAG system.
Answer the user's question accurately using ONLY the provided retrieve contexts below.
If the information is available in the sources, cite the exact source title, rack number, book code, or download link clearly.
If the answer is a research paper question, summarize key findings, methodologies, and authors.
If the answer is a previous year question paper (PYQ), list the questions, exam year, topics covered, and provide direct guidance.
If the answer is a library catalog query, mention book location (Rack number), availability, and author.

User Query: "${queryClean}"

Retrieved Context Chunks:
${contextSnippet}

Format your response in Markdown with clear headers, bullet points, source citations [Source 1], and practical guidance for the student.
`;

        const result = await model.generateContent(prompt);
        answerText = result.response.text();
      } catch (err) {
        console.error("Gemini RAG LLM Error:", err.message);
      }
    }

    // Fallback RAG Synthesis Engine (Structured & Cited Markdown)
    if (!answerText) {
      const topMatch = topContextDocs[0]?.doc;
      answerText = `### 📚 Intelligent Library Assistant (RAG Search Results)

Here are the retrieved results for: **"${queryClean}"**

${topContextDocs
  .map(
    (item, i) => `#### ${i + 1}. **${item.doc.title}** (${item.doc.documentType.toUpperCase().replace("_", " ")})
- **Author/Publisher**: ${item.doc.author || item.doc.publisher || "Library Repository"}
- **Branch/Subject**: ${item.doc.branch} | ${item.doc.subject} ${item.doc.semester ? `(Semester ${item.doc.semester})` : ""}
${item.doc.rackNumber ? `- **Location / Rack No**: 📍 **Rack ${item.doc.rackNumber}** (Book Code: \`${item.doc.bookCode}\`)` : ""}
${item.doc.documentType === "catalog" ? `- **Availability**: ${item.doc.availableCount} of ${item.doc.quantity} copies currently available.` : ""}
${item.doc.examType ? `- **Exam**: ${item.doc.examType} (${item.doc.publishedYear || "Previous Year"})` : ""}
- **Summary**: ${item.doc.summary || item.doc.content}
${item.doc.fileUrl ? `- 🔗 [Download Document / View Paper](${item.doc.fileUrl})` : ""}
`
  )
  .join("\n---\n")}

*Note: Data retrieved via Vector Similarity Search (${topContextDocs.length} matches).*`;
    }

    return res.json({
      success: true,
      query: queryClean,
      answer: answerText,
      sources,
      vectorMatchesCount: topContextDocs.length,
    });
  } catch (error) {
    console.error("Error in queryLibraryRAG:", error);
    return res.status(500).json({ success: false, message: "Internal server error during RAG query processing." });
  }
};

/**
 * 2. Ingest New RAG Document (Upload & Embed)
 * POST /api/library/rag/ingest
 */
const ingestDocument = async (req, res) => {
  try {
    const {
      title,
      documentType,
      content,
      summary,
      author,
      journal,
      publisher,
      publishedYear,
      branch,
      subject,
      semester,
      examType,
      rackNumber,
      bookCode,
      quantity,
      fileUrl,
      downloadUrl,
      tags,
    } = req.body;

    if (!title || !documentType || !content) {
      return res.status(400).json({ success: false, message: "Title, documentType, and content are required fields." });
    }

    // Combine text representation for embedding vector
    const fullTextToEmbed = `${title} ${summary || ""} ${content} ${author || ""} ${branch || ""} ${subject || ""} ${(tags || []).join(" ")}`;

    // Generate Vector Embedding
    const vector = await generateEmbedding(fullTextToEmbed);

    const docPayload = {
      title: title.trim(),
      documentType,
      content: content.trim(),
      summary: (summary || content.substring(0, 300)).trim(),
      author: author || "Unknown Author",
      journal: journal || "",
      publisher: publisher || "",
      publishedYear: publishedYear ? Number(publishedYear) : new Date().getFullYear(),
      branch: branch || "Computer Science Engineering",
      subject: subject || "Core",
      semester: semester ? Number(semester) : 1,
      examType: examType || "Semester Exam",
      rackNumber: rackNumber || "",
      bookCode: bookCode || `RAG-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: quantity ? Number(quantity) : 1,
      availableCount: quantity ? Number(quantity) : 1,
      fileUrl: fileUrl || downloadUrl || "",
      downloadUrl: downloadUrl || fileUrl || "",
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [],
      embedding: vector,
    };

    const newDoc = await RAGDocument.create(docPayload);

    // Upsert into Pinecone DB
    const pineconeResult = await pineconeService.upsertVector(newDoc._id, vector, {
      title: newDoc.title,
      documentType: newDoc.documentType,
      branch: newDoc.branch,
      subject: newDoc.subject,
    });

    if (pineconeResult && pineconeResult.mode === "PineconeCloud") {
      newDoc.pineconeId = newDoc._id.toString();
      await newDoc.save();
    }

    return res.status(201).json({
      success: true,
      message: `${documentType.toUpperCase().replace("_", " ")} successfully ingested and indexed into Vector DB.`,
      document: newDoc,
    });
  } catch (error) {
    console.error("Error in ingestDocument:", error);
    return res.status(500).json({ success: false, message: "Failed to ingest document into vector index." });
  }
};

/**
 * 3. Fetch RAG Documents with Search & Filter
 * GET /api/library/rag/documents
 */
const getDocuments = async (req, res) => {
  try {
    const { documentType, branch, subject, search } = req.query;

    const query = {};
    if (documentType && documentType !== "all") {
      query.documentType = documentType;
    }
    if (branch && branch !== "All") {
      query.branch = new RegExp(branch, "i");
    }
    if (subject && subject !== "All") {
      query.subject = new RegExp(subject, "i");
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { author: new RegExp(search, "i") },
        { summary: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") },
        { bookCode: new RegExp(search, "i") },
      ];
    }

    let documents = await RAGDocument.find(query).select("-embedding").sort({ createdAt: -1 });

    // Also include any books from main Library collection if documentType is 'all' or 'catalog'
    if (!documentType || documentType === "all" || documentType === "catalog") {
      try {
        const Library = require("../../models/Other/library.model.js");
        const libraryQuery = {};
        if (search) {
          libraryQuery.$or = [
            { bookName: new RegExp(search, "i") },
            { author: new RegExp(search, "i") },
            { genre: new RegExp(search, "i") },
            { rackNumber: new RegExp(search, "i") },
          ];
        }
        const libBooks = await Library.find(libraryQuery);
        
        // Merge any Library book not already present in RAGDocument list
        const existingCodes = new Set(documents.map(d => d.bookCode));
        const existingTitles = new Set(documents.map(d => d.title.toLowerCase()));

        for (const book of libBooks) {
          if (!existingCodes.has(String(book.bookCode)) && !existingTitles.has(book.bookName.toLowerCase())) {
            documents.push({
              _id: book._id,
              title: book.bookName,
              documentType: "catalog",
              content: `${book.bookName} Author: ${book.author} Genre: ${book.genre || "General"} Rack: ${book.rackNumber || "General"} Publisher: ${book.publisher || ""} Code: ${book.bookCode}`,
              summary: `Library Book: ${book.bookName} by ${book.author}. Genre: ${book.genre || "General"}. Location: Rack ${book.rackNumber || "General"}. Book Code: ${book.bookCode}.`,
              author: book.author,
              publisher: book.publisher || "",
              publishedYear: book.publishedYear,
              rackNumber: book.rackNumber || "",
              bookCode: String(book.bookCode),
              quantity: book.quantity || 1,
              availableCount: Math.max((book.quantity || 1) - (book.issuedCount || 0), 0),
              branch: "General",
              subject: book.genre || "General",
              tags: [book.genre, book.author].filter(Boolean),
            });
          }
        }
      } catch (libErr) {
        console.warn("Notice fetching Library collection in getDocuments:", libErr.message);
      }
    }

    // Also include any materials from main Material collection (PYQs / Papers)
    if (!documentType || documentType === "all" || documentType === "pyq" || documentType === "research_paper") {
      try {
        const Material = require("../../models/Other/material.model.js");
        const materialQuery = {};
        if (search) {
          materialQuery.$or = [
            { title: new RegExp(search, "i") },
            { subject: new RegExp(search, "i") },
            { faculty: new RegExp(search, "i") },
            { branch: new RegExp(search, "i") },
          ];
        }
        const dbMaterials = await Material.find(materialQuery);
        const existingTitles = new Set(documents.map(d => d.title.toLowerCase()));

        for (const mat of dbMaterials) {
          if (!existingTitles.has(mat.title.toLowerCase())) {
            const isPyq = mat.title.toLowerCase().includes("question paper") || mat.title.toLowerCase().includes("pyq") || mat.title.toLowerCase().includes("exam");
            const inferredType = isPyq ? "pyq" : "research_paper";
            
            if (!documentType || documentType === "all" || documentType === inferredType) {
              documents.push({
                _id: mat._id,
                title: mat.title,
                documentType: inferredType,
                content: `Study Material / Question Paper: ${mat.title} Subject: ${mat.subject} Branch: ${mat.branch} Semester: ${mat.semester} Faculty: ${mat.faculty}`,
                summary: `Study Material / Question Paper: ${mat.title} for ${mat.subject} (${mat.branch} Sem ${mat.semester}). Uploaded by ${mat.faculty}.`,
                author: mat.faculty,
                branch: mat.branch,
                subject: mat.subject,
                semester: mat.semester,
                fileUrl: mat.link,
                downloadUrl: mat.link,
                tags: [mat.subject, mat.branch, mat.faculty].filter(Boolean),
              });
            }
          }
        }
      } catch (matErr) {
        console.warn("Notice fetching Material collection in getDocuments:", matErr.message);
      }
    }

    return res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Error in getDocuments:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve documents." });
  }
};

/**
 * 4. Live Web Search / Scraper for Online Books (Open Library + Google Books API)
 * GET /api/library/rag/web-search?query=...
 */
const searchOnlineBooks = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const searchTerm = query.trim();
    const axios = require("axios");
    let books = [];

    // 1. Try Open Library API
    try {
      const openLibRes = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=12`, {
        timeout: 6000,
      });

      if (openLibRes.data?.docs && openLibRes.data.docs.length > 0) {
        books = openLibRes.data.docs.map((item) => {
          const author = Array.isArray(item.author_name) ? item.author_name[0] : item.author_name || "Unknown Author";
          const coverId = item.cover_i;
          const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
          const firstYear = item.first_publish_year || item.publish_year?.[0] || "N/A";
          const subjects = Array.isArray(item.subject) ? item.subject.slice(0, 4) : [];
          const readUrl = item.key ? `https://openlibrary.org${item.key}` : `https://openlibrary.org/search?q=${encodeURIComponent(item.title)}`;

          return {
            id: item.key || `ol-${Math.random()}`,
            title: item.title,
            author,
            publishedYear: firstYear,
            coverUrl,
            subjects,
            readUrl,
            source: "Open Library",
            summary: `Online Book: ${item.title} by ${author}. Published: ${firstYear}. Topics: ${subjects.join(", ") || searchTerm}.`,
          };
        });
      }
    } catch (olErr) {
      console.warn("Open Library search notice:", olErr.message);
    }

    // 2. Google Books API fallback if Open Library returned few results
    if (books.length < 5) {
      try {
        const gBooksRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=12`, {
          timeout: 6000,
        });

        if (gBooksRes.data?.items && gBooksRes.data.items.length > 0) {
          const gBooks = gBooksRes.data.items.map((b) => {
            const info = b.volumeInfo || {};
            const title = info.title || "Untitled Book";
            const author = info.authors ? info.authors.join(", ") : "Unknown Author";
            const publishedYear = info.publishedDate ? info.publishedDate.substring(0, 4) : "N/A";
            const coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "";
            const readUrl = info.previewLink || info.infoLink || `https://books.google.com/books?q=${encodeURIComponent(title)}`;
            const subjects = info.categories || [];
            const summary = info.description ? info.description.substring(0, 300) : `Online Book: ${title} by ${author}.`;

            return {
              id: b.id || `gb-${Math.random()}`,
              title,
              author,
              publishedYear,
              coverUrl,
              subjects,
              readUrl,
              source: "Google Books",
              summary,
            };
          });

          // Combine & deduplicate by title
          const titleSet = new Set(books.map((b) => b.title.toLowerCase()));
          gBooks.forEach((gb) => {
            if (!titleSet.has(gb.title.toLowerCase())) {
              books.push(gb);
              titleSet.add(gb.title.toLowerCase());
            }
          });
        }
      } catch (gbErr) {
        console.warn("Google Books search notice:", gbErr.message);
      }
    }

    return res.json({
      success: true,
      query: searchTerm,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("Error in searchOnlineBooks:", error);
    return res.status(500).json({ success: false, message: "Failed to scrape online books." });
  }
};

/**
 * 5. Delete RAG Document
 * DELETE /api/library/rag/document/:id
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RAGDocument.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }
    return res.json({ success: true, message: "Document removed from RAG database." });
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return res.status(500).json({ success: false, message: "Failed to delete document." });
  }
};

/**
 * 6. Seed RAG Data (Pre-load initial Catalogs, Research Papers, and PYQs)
 * POST /api/library/rag/seed
 */
const seedRAGData = async (req, res) => {
  try {
    const existingCount = await RAGDocument.countDocuments();
    if (existingCount > 0 && !req.body.force) {
      return res.json({
        success: true,
        message: `RAG Vector Database already contains ${existingCount} documents. Pass { force: true } to re-seed.`,
        count: existingCount,
      });
    }

    if (req.body.force) {
      await RAGDocument.deleteMany({});
    }

    const { seedData } = require("../../seeds/rag.seed");
    const Library = require("../../models/Other/library.model.js");
    const Material = require("../../models/Other/material.model.js");
    const docsToInsert = [];

    // 1. Seed pre-configured Catalogs, Research Papers, and PYQs (and save PYQs/Papers into MongoDB Material table)
    for (const item of seedData) {
      const fullText = `${item.title} ${item.summary || ""} ${item.content} ${item.author || ""} ${item.branch || ""} ${item.subject || ""}`;
      const vector = await generateEmbedding(fullText);

      docsToInsert.push({
        ...item,
        embedding: vector,
      });

      // Save into MongoDB Material table if it's a paper or PYQ so it actually exists in the database!
      if ((item.documentType === "pyq" || item.documentType === "research_paper") && item.fileUrl) {
        try {
          const matExists = await Material.findOne({ title: item.title });
          if (!matExists) {
            await Material.create({
              faculty: item.author || "Department Examination Cell",
              subject: item.subject || "General",
              title: item.title,
              link: item.fileUrl,
              branch: item.branch || "Computer Science Engineering",
              semester: item.semester || 1,
            });
          }
        } catch (matErr) {
          console.warn("Notice inserting seed material to DB:", matErr.message);
        }
      }
    }

    // 2. Auto-sync any existing materials from MongoDB Material collection into RAG vector index
    try {
      const existingMaterials = await Material.find();
      for (const mat of existingMaterials) {
        const existsInSeed = docsToInsert.some(d => d.title.toLowerCase() === mat.title.toLowerCase() || (d.fileUrl && d.fileUrl === mat.link));
        if (!existsInSeed) {
          const fullText = `Study Material / Question Paper: ${mat.title} Subject: ${mat.subject} Branch: ${mat.branch} Semester: ${mat.semester} Faculty: ${mat.faculty}`;
          const vector = await generateEmbedding(fullText);
          docsToInsert.push({
            title: mat.title,
            documentType: mat.title.toLowerCase().includes("question paper") || mat.title.toLowerCase().includes("pyq") || mat.title.toLowerCase().includes("exam") ? "pyq" : "research_paper",
            content: fullText,
            summary: `Study Material / Question Paper: ${mat.title} for ${mat.subject} (${mat.branch} Sem ${mat.semester}). Uploaded by ${mat.faculty}.`,
            author: mat.faculty,
            branch: mat.branch,
            subject: mat.subject,
            semester: mat.semester,
            fileUrl: mat.link,
            downloadUrl: mat.link,
            tags: [mat.subject, mat.branch, mat.faculty].filter(Boolean),
            embedding: vector,
          });
        }
      }
    } catch (matSyncErr) {
      console.warn("Notice syncing Material collection to RAG:", matSyncErr.message);
    }

    // 3. Auto-sync any existing books from main Library collection into RAG vector index
    try {
      const existingLibraryBooks = await Library.find();
      for (const book of existingLibraryBooks) {
        // Prevent duplicate title insert if already in seed
        const existsInSeed = docsToInsert.some(d => d.bookCode === String(book.bookCode) || d.title.toLowerCase() === book.bookName.toLowerCase());
        if (!existsInSeed) {
          const fullText = `${book.bookName} Author: ${book.author} Genre: ${book.genre || "General"} Rack: ${book.rackNumber || "General"} Publisher: ${book.publisher || ""} Code: ${book.bookCode}`;
          const vector = await generateEmbedding(fullText);
          docsToInsert.push({
            title: book.bookName,
            documentType: "catalog",
            content: fullText,
            summary: `Library Book: ${book.bookName} by ${book.author}. Genre: ${book.genre || "General"}. Location: Rack ${book.rackNumber || "General"}. Book Code: ${book.bookCode}.`,
            author: book.author,
            publisher: book.publisher || "",
            publishedYear: book.publishedYear,
            rackNumber: book.rackNumber || "",
            bookCode: String(book.bookCode),
            quantity: book.quantity || 1,
            availableCount: Math.max((book.quantity || 1) - (book.issuedCount || 0), 0),
            tags: [book.genre, book.author, ...(book.tags || [])].filter(Boolean),
            embedding: vector,
          });
        }
      }
    } catch (err) {
      console.warn("Notice syncing Library collection to RAG:", err.message);
    }

    const insertedDocs = await RAGDocument.insertMany(docsToInsert);

    // Upsert vectors to Pinecone
    for (const doc of insertedDocs) {
      await pineconeService.upsertVector(doc._id, doc.embedding, {
        title: doc.title,
        documentType: doc.documentType,
        branch: doc.branch,
      });
    }

    return res.json({
      success: true,
      message: `Successfully seeded ${insertedDocs.length} RAG documents into Pinecone vector index and database.`,
      count: insertedDocs.length,
    });
  } catch (error) {
    console.error("Error in seedRAGData:", error);
    return res.status(500).json({ success: false, message: "Failed to seed RAG vector data.", error: error.message });
  }
};

module.exports = {
  queryLibraryRAG,
  ingestDocument,
  getDocuments,
  searchOnlineBooks,
  deleteDocument,
  seedRAGData,
};
