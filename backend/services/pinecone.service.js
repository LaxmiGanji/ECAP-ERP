const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// High-dimensional vector fallback utility (768 dimensions for compatibility with Gemini text-embedding-004)
const VECTOR_DIMENSION = 768;

/**
 * Generate a deterministic or fallback 768-dimensional normalized embedding vector from text
 */
const generateFallbackEmbedding = (text = "") => {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = cleanText.split(/\s+/).filter(Boolean);
  const vector = new Array(VECTOR_DIMENSION).fill(0);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let wordHash = 0;
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      wordHash = (wordHash * 31 + charCode) % VECTOR_DIMENSION;
    }
    vector[wordHash] += 1;

    // Character n-gram sub-features for partial word matching
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const subIdx = (charCode * 37 + j * 19) % VECTOR_DIMENSION;
      vector[subIdx] += 0.2;
    }
  }

  // L2 Normalize vector
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSq) || 1;
  return vector.map((val) => val / magnitude);
};

/**
 * Generate Embedding using Gemini text-embedding-004 or fallback
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    return generateFallbackEmbedding("");
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await embeddingModel.embedContent(text);
      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        return result.embedding.values;
      }
    } catch (error) {
      console.warn("Gemini Embedding API notice (using internal vectorizer):", error.message);
    }
  }

  return generateFallbackEmbedding(text);
};

/**
 * Compute Cosine Similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

/**
 * Pinecone API Integration Wrapper
 */
class PineconeService {
  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY || "";
    this.environment = process.env.PINECONE_ENVIRONMENT || "gcp-starter";
    this.indexName = process.env.PINECONE_INDEX || "ecap-library-rag";
    this.host = process.env.PINECONE_HOST || "";
    this.isPineconeConfigured = Boolean(this.apiKey && (this.host || this.indexName));
  }

  /**
   * Upsert vector embedding into Pinecone REST API or Cloud Index
   */
  async upsertVector(id, vector, metadata = {}) {
    if (!this.isPineconeConfigured) {
      // Graceful local fallback when Pinecone credentials are not provided
      return { success: true, mode: "LocalVectorStore", id };
    }

    try {
      const endpoint = this.host
        ? `${this.host}/vectors/upsert`
        : `https://${this.indexName}-${this.environment}.svc.pinecone.io/vectors/upsert`;

      const response = await axios.post(
        endpoint,
        {
          vectors: [
            {
              id: id.toString(),
              values: vector,
              metadata,
            },
          ],
        },
        {
          headers: {
            "Api-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );

      return { success: true, mode: "PineconeCloud", data: response.data };
    } catch (error) {
      console.warn("Pinecone API upsert notice (fallback to MongoDB store):", error.message);
      return { success: true, mode: "LocalVectorStoreFallback", id };
    }
  }

  /**
   * Query top K vectors from Pinecone Cloud index
   */
  async queryPinecone(vector, topK = 5, filter = {}) {
    if (!this.isPineconeConfigured) {
      return null;
    }

    try {
      const endpoint = this.host
        ? `${this.host}/query`
        : `https://${this.indexName}-${this.environment}.svc.pinecone.io/query`;

      const response = await axios.post(
        endpoint,
        {
          vector,
          topK,
          includeMetadata: true,
          includeValues: false,
          filter,
        },
        {
          headers: {
            "Api-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );

      return response.data?.matches || null;
    } catch (error) {
      console.warn("Pinecone Query error (using MongoDB local vector retrieval):", error.message);
      return null;
    }
  }
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  pineconeService: new PineconeService(),
};
