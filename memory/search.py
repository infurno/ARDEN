"""
Hybrid Search Engine - Vector + BM25 combined search

Combines:
- Vector similarity search (0.7 weight) using FastEmbed embeddings
- BM25 keyword search (0.3 weight) using SQLite FTS5

All data stored in SQLite. Fully local, zero API calls.
"""

import json
import logging
import os
import sqlite3
import struct
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

from .embedder import cosine_similarity, embed_text

logger = logging.getLogger("arden.memory.search")

# Weights for hybrid scoring
VECTOR_WEIGHT = 0.7
BM25_WEIGHT = 0.3

# Database path
ARDEN_ROOT = Path(__file__).parent.parent
DB_PATH = ARDEN_ROOT / "data" / "memory.db"


def _serialize_vector(vec: np.ndarray) -> bytes:
    """Serialize a numpy float32 vector to bytes for SQLite storage."""
    return struct.pack(f"{len(vec)}f", *vec.tolist())


def _deserialize_vector(data: bytes) -> np.ndarray:
    """Deserialize bytes back to a numpy float32 vector."""
    n = len(data) // 4  # 4 bytes per float32
    return np.array(struct.unpack(f"{n}f", data), dtype=np.float32)


class HybridSearchEngine:
    """
    Hybrid search engine combining vector similarity and BM25 keyword search.
    
    Usage:
        engine = HybridSearchEngine()
        engine.initialize()
        engine.index_document("source.md", "chunk text", {"key": "value"})
        results = engine.search("query text", top_k=10)
    """
    
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = Path(db_path) if db_path else DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = None
    
    def initialize(self):
        """Create database tables if they don't exist."""
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        
        # Documents table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT NOT NULL,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER DEFAULT 0,
                metadata TEXT DEFAULT '{}',
                embedding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # BM25 full-text search index (FTS5)
        self.conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
                chunk_text,
                source_file,
                content=documents,
                content_rowid=id,
                tokenize='porter unicode61'
            )
        """)
        
        # Triggers to keep FTS in sync
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
                INSERT INTO documents_fts(rowid, chunk_text, source_file)
                VALUES (new.id, new.chunk_text, new.source_file);
            END
        """)
        
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
                INSERT INTO documents_fts(documents_fts, rowid, chunk_text, source_file)
                VALUES ('delete', old.id, old.chunk_text, old.source_file);
            END
        """)
        
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
                INSERT INTO documents_fts(documents_fts, rowid, chunk_text, source_file)
                VALUES ('delete', old.id, old.chunk_text, old.source_file);
                INSERT INTO documents_fts(rowid, chunk_text, source_file)
                VALUES (new.id, new.chunk_text, new.source_file);
            END
        """)
        
        # Index for source file lookups
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_documents_source 
            ON documents(source_file)
        """)
        
        self.conn.commit()
        logger.info("Search engine initialized", extra={"db_path": str(self.db_path)})
    
    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def index_document(
        self, 
        source_file: str, 
        chunk_text: str, 
        metadata: Optional[Dict] = None,
        chunk_index: int = 0
    ) -> int:
        """
        Index a document chunk with its embedding.
        
        Args:
            source_file: Path to the source file
            chunk_text: The text content of this chunk
            metadata: Optional metadata dict
            chunk_index: Position of this chunk in the source file
            
        Returns:
            The document ID
        """
        # Generate embedding
        embedding = embed_text(chunk_text)
        embedding_bytes = _serialize_vector(embedding)
        
        metadata_json = json.dumps(metadata or {})
        
        cursor = self.conn.execute(
            """INSERT INTO documents (source_file, chunk_text, chunk_index, metadata, embedding)
               VALUES (?, ?, ?, ?, ?)""",
            (source_file, chunk_text, chunk_index, metadata_json, embedding_bytes)
        )
        
        self.conn.commit()
        doc_id = cursor.lastrowid
        
        logger.debug(f"Indexed document chunk", extra={
            "doc_id": doc_id,
            "source": source_file,
            "chunk_index": chunk_index,
            "text_length": len(chunk_text)
        })
        
        return doc_id
    
    def index_documents_batch(
        self,
        documents: List[Tuple[str, str, Optional[Dict], int]]
    ) -> List[int]:
        """
        Batch index multiple document chunks.
        
        Args:
            documents: List of (source_file, chunk_text, metadata, chunk_index) tuples
            
        Returns:
            List of document IDs
        """
        if not documents:
            return []
        
        # Batch embed all texts
        from .embedder import embed_texts
        texts = [doc[1] for doc in documents]
        embeddings = embed_texts(texts)
        
        doc_ids = []
        for (source_file, chunk_text, metadata, chunk_index), embedding in zip(documents, embeddings):
            embedding_bytes = _serialize_vector(embedding)
            metadata_json = json.dumps(metadata or {})
            
            cursor = self.conn.execute(
                """INSERT INTO documents (source_file, chunk_text, chunk_index, metadata, embedding)
                   VALUES (?, ?, ?, ?, ?)""",
                (source_file, chunk_text, chunk_index, metadata_json, embedding_bytes)
            )
            doc_ids.append(cursor.lastrowid)
        
        self.conn.commit()
        logger.info(f"Batch indexed {len(doc_ids)} document chunks")
        return doc_ids
    
    def remove_source(self, source_file: str):
        """Remove all chunks for a source file (for re-indexing)."""
        self.conn.execute("DELETE FROM documents WHERE source_file = ?", (source_file,))
        self.conn.commit()
        logger.info(f"Removed all chunks for source: {source_file}")
    
    def search(
        self, 
        query: str, 
        top_k: int = 10,
        source_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Hybrid search combining vector similarity and BM25.
        
        Score = 0.7 * vector_similarity + 0.3 * bm25_score (normalized)
        
        Args:
            query: Search query text
            top_k: Number of results to return
            source_filter: Optional source file filter (e.g., "MEMORY.md")
            
        Returns:
            List of result dicts with keys: id, source_file, chunk_text, 
            metadata, score, vector_score, bm25_score
        """
        # 1. Vector search
        vector_results = self._vector_search(query, top_k=top_k * 2, source_filter=source_filter)
        
        # 2. BM25 search
        bm25_results = self._bm25_search(query, top_k=top_k * 2, source_filter=source_filter)
        
        # 3. Combine scores
        combined = self._combine_results(vector_results, bm25_results, top_k)
        
        return combined
    
    def _vector_search(
        self, 
        query: str, 
        top_k: int = 20,
        source_filter: Optional[str] = None
    ) -> List[Dict]:
        """Search by vector similarity."""
        query_embedding = embed_text(query)
        
        # Fetch all documents (with optional filter) and compute similarity
        if source_filter:
            rows = self.conn.execute(
                "SELECT id, source_file, chunk_text, metadata, embedding FROM documents WHERE source_file = ?",
                (source_filter,)
            ).fetchall()
        else:
            rows = self.conn.execute(
                "SELECT id, source_file, chunk_text, metadata, embedding FROM documents"
            ).fetchall()
        
        results = []
        for row in rows:
            doc_id, source_file, chunk_text, metadata_json, embedding_bytes = row
            if embedding_bytes is None:
                continue
            
            doc_embedding = _deserialize_vector(embedding_bytes)
            similarity = cosine_similarity(query_embedding, doc_embedding)
            
            results.append({
                "id": doc_id,
                "source_file": source_file,
                "chunk_text": chunk_text,
                "metadata": json.loads(metadata_json) if metadata_json else {},
                "vector_score": similarity
            })
        
        # Sort by similarity descending
        results.sort(key=lambda x: x["vector_score"], reverse=True)
        return results[:top_k]
    
    def _bm25_search(
        self, 
        query: str, 
        top_k: int = 20,
        source_filter: Optional[str] = None
    ) -> List[Dict]:
        """Search by BM25 keyword relevance using FTS5."""
        try:
            # FTS5 query -- escape special characters
            fts_query = query.replace('"', '""')
            
            if source_filter:
                rows = self.conn.execute(
                    """SELECT d.id, d.source_file, d.chunk_text, d.metadata,
                              bm25(documents_fts) as rank
                       FROM documents_fts f
                       JOIN documents d ON d.id = f.rowid
                       WHERE documents_fts MATCH ? AND d.source_file = ?
                       ORDER BY rank
                       LIMIT ?""",
                    (fts_query, source_filter, top_k)
                ).fetchall()
            else:
                rows = self.conn.execute(
                    """SELECT d.id, d.source_file, d.chunk_text, d.metadata,
                              bm25(documents_fts) as rank
                       FROM documents_fts f
                       JOIN documents d ON d.id = f.rowid
                       WHERE documents_fts MATCH ?
                       ORDER BY rank
                       LIMIT ?""",
                    (fts_query, top_k)
                ).fetchall()
            
            results = []
            for row in rows:
                doc_id, source_file, chunk_text, metadata_json, rank = row
                # BM25 returns negative scores (lower = better), normalize to 0-1
                # Typical range is -25 to 0, so we normalize
                bm25_score = max(0, min(1, (-rank) / 25.0))
                
                results.append({
                    "id": doc_id,
                    "source_file": source_file,
                    "chunk_text": chunk_text,
                    "metadata": json.loads(metadata_json) if metadata_json else {},
                    "bm25_score": bm25_score
                })
            
            return results
        except sqlite3.OperationalError as e:
            # FTS query might fail on special characters
            logger.warning(f"BM25 search failed: {e}")
            return []
    
    def _combine_results(
        self,
        vector_results: List[Dict],
        bm25_results: List[Dict],
        top_k: int
    ) -> List[Dict]:
        """Combine vector and BM25 results with weighted scoring."""
        combined = {}
        
        # Normalize vector scores to 0-1 range
        if vector_results:
            max_vec = max(r["vector_score"] for r in vector_results)
            min_vec = min(r["vector_score"] for r in vector_results)
            vec_range = max_vec - min_vec if max_vec != min_vec else 1
        
        for result in vector_results:
            doc_id = result["id"]
            # Normalize vector score
            if vector_results:
                norm_score = (result["vector_score"] - min_vec) / vec_range if vec_range > 0 else result["vector_score"]
            else:
                norm_score = result["vector_score"]
            
            combined[doc_id] = {
                **result,
                "vector_score": norm_score,
                "bm25_score": 0.0,
                "score": VECTOR_WEIGHT * norm_score
            }
        
        for result in bm25_results:
            doc_id = result["id"]
            if doc_id in combined:
                combined[doc_id]["bm25_score"] = result["bm25_score"]
                combined[doc_id]["score"] = (
                    VECTOR_WEIGHT * combined[doc_id]["vector_score"] + 
                    BM25_WEIGHT * result["bm25_score"]
                )
            else:
                combined[doc_id] = {
                    **result,
                    "vector_score": 0.0,
                    "score": BM25_WEIGHT * result["bm25_score"]
                }
        
        # Sort by combined score
        sorted_results = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
        return sorted_results[:top_k]
    
    def get_stats(self) -> Dict:
        """Get index statistics."""
        total_docs = self.conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        sources = self.conn.execute(
            "SELECT source_file, COUNT(*) FROM documents GROUP BY source_file"
        ).fetchall()
        
        return {
            "total_documents": total_docs,
            "sources": {s: c for s, c in sources},
            "db_path": str(self.db_path),
            "db_size_mb": round(self.db_path.stat().st_size / (1024 * 1024), 2) if self.db_path.exists() else 0
        }
