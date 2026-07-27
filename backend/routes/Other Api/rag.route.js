const express = require("express");
const router = express.Router();
const {
  queryLibraryRAG,
  ingestDocument,
  getDocuments,
  searchOnlineBooks,
  deleteDocument,
  seedRAGData,
} = require("../../controllers/Other/rag.controller");

// RAG Routes
router.post("/query", queryLibraryRAG);
router.post("/ingest", ingestDocument);
router.get("/documents", getDocuments);
router.get("/web-search", searchOnlineBooks);
router.delete("/document/:id", deleteDocument);
router.post("/seed", seedRAGData);

module.exports = router;
