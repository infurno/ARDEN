"""
Embedder - Local vector embedding using FastEmbed (ONNX)

Uses all-MiniLM-L6-v2 (384 dimensions) for fast, local embeddings.
No API calls required. Model is downloaded once and cached locally.
"""

import logging
from typing import List
import numpy as np

logger = logging.getLogger("arden.memory.embedder")

# Lazy-load the model to avoid slow imports
_model = None


def _get_model():
    """Lazily initialize the FastEmbed model."""
    global _model
    if _model is None:
        try:
            from fastembed import TextEmbedding
            logger.info("Loading FastEmbed model: all-MiniLM-L6-v2 (384-dim)")
            _model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
            logger.info("FastEmbed model loaded successfully")
        except ImportError:
            logger.error("fastembed not installed. Run: pip install fastembed")
            raise
    return _model


def embed_text(text: str) -> np.ndarray:
    """
    Embed a single text string into a 384-dimensional vector.
    
    Args:
        text: The text to embed
        
    Returns:
        numpy array of shape (384,)
    """
    model = _get_model()
    embeddings = list(model.embed([text]))
    return np.array(embeddings[0], dtype=np.float32)


def embed_texts(texts: List[str]) -> List[np.ndarray]:
    """
    Embed multiple texts into 384-dimensional vectors.
    
    Args:
        texts: List of texts to embed
        
    Returns:
        List of numpy arrays, each of shape (384,)
    """
    if not texts:
        return []
    
    model = _get_model()
    embeddings = list(model.embed(texts))
    return [np.array(e, dtype=np.float32) for e in embeddings]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))
