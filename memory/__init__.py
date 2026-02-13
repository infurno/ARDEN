"""
ARDEN Memory System - Hybrid Search Engine

Local-first hybrid search combining:
- Vector search (FastEmbed, 384-dim ONNX, all-MiniLM-L6-v2)
- BM25 keyword search (SQLite FTS5)
- Combined score: 0.7 * vector + 0.3 * BM25

Zero API calls. Fully local. SQLite-backed.
"""
