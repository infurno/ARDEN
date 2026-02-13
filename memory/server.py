"""
Memory Search HTTP Server

Lightweight Flask API that exposes the hybrid search engine to Node.js.
Runs as a standalone process or can be called via subprocess.

Endpoints:
    POST /search          - Hybrid search
    POST /index           - Index a single file
    POST /ingest          - Full re-ingestion
    GET  /stats           - Index statistics
    GET  /health          - Health check
"""

import json
import logging
import os
import sys
from pathlib import Path

from flask import Flask, jsonify, request

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from memory.search import HybridSearchEngine
from memory.ingest import ingest_all, ingest_file, ingest_identity_files, ingest_daily_logs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            Path(__file__).parent.parent / "logs" / "memory-server.log",
            mode="a"
        )
    ]
)
logger = logging.getLogger("arden.memory.server")

app = Flask(__name__)

# Global search engine instance
engine = None


def get_engine() -> HybridSearchEngine:
    """Get or initialize the search engine."""
    global engine
    if engine is None:
        engine = HybridSearchEngine()
        engine.initialize()
        logger.info("Search engine initialized")
    return engine


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "arden-memory"})


@app.route("/search", methods=["POST"])
def search():
    """
    Hybrid search endpoint.
    
    Request body:
        {
            "query": "search text",
            "top_k": 10,           // optional, default 10
            "source_filter": null   // optional, e.g. "MEMORY.md"
        }
    
    Response:
        {
            "results": [...],
            "query": "search text",
            "count": 10
        }
    """
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "Missing 'query' in request body"}), 400
    
    query = data["query"]
    top_k = data.get("top_k", 10)
    source_filter = data.get("source_filter")
    
    try:
        eng = get_engine()
        results = eng.search(query, top_k=top_k, source_filter=source_filter)
        
        return jsonify({
            "results": results,
            "query": query,
            "count": len(results)
        })
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/index", methods=["POST"])
def index_file_endpoint():
    """
    Index a single file.
    
    Request body:
        {
            "filepath": "/path/to/file.md",
            "force": false  // optional
        }
    """
    data = request.get_json()
    if not data or "filepath" not in data:
        return jsonify({"error": "Missing 'filepath' in request body"}), 400
    
    try:
        eng = get_engine()
        count = ingest_file(eng, data["filepath"], force=data.get("force", False))
        return jsonify({"indexed_chunks": count, "filepath": data["filepath"]})
    except Exception as e:
        logger.error(f"Index failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/ingest", methods=["POST"])
def ingest_all_endpoint():
    """
    Full re-ingestion of all indexable content.
    
    Request body (optional):
        {
            "categories": ["identity_files", "daily_logs", "skill_files"]
        }
    """
    try:
        eng = get_engine()
        results = ingest_all(eng)
        return jsonify({"status": "ok", "results": results})
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
def stats():
    """Get index statistics."""
    try:
        eng = get_engine()
        return jsonify(eng.get_stats())
    except Exception as e:
        logger.error(f"Stats failed: {e}")
        return jsonify({"error": str(e)}), 500


def main():
    """Run the memory search server."""
    port = int(os.environ.get("ARDEN_MEMORY_PORT", 3002))
    host = os.environ.get("ARDEN_MEMORY_HOST", "127.0.0.1")
    
    # Ensure logs directory exists
    log_dir = Path(__file__).parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    logger.info(f"Starting ARDEN Memory Server on {host}:{port}")
    
    # Initialize engine and run initial ingestion
    eng = get_engine()
    logger.info("Running initial ingestion...")
    results = ingest_all(eng)
    logger.info(f"Initial ingestion complete: {results}")
    
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
