"""
Document Ingestion - Parse and chunk markdown files for indexing

Handles:
- Identity files (SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md)
- Daily session logs (daily/*.md)
- Skill definitions (skills/*/SKILL.md)
- Optional: Notes from ~/Notes
"""

import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from .search import HybridSearchEngine

logger = logging.getLogger("arden.memory.ingest")

ARDEN_ROOT = Path(__file__).parent.parent

# Files to always index
IDENTITY_FILES = [
    "SOUL.md",
    "USER.md", 
    "MEMORY.md",
    "AGENTS.md",
    "HEARTBEAT.md",
]

# Chunk settings
MAX_CHUNK_SIZE = 1000  # characters
CHUNK_OVERLAP = 100    # characters overlap between chunks


def chunk_by_sections(content: str, source_file: str) -> List[Tuple[str, Dict]]:
    """
    Split markdown content into chunks by section headers.
    
    Each ## or ### section becomes its own chunk. If a section is too long,
    it's split into smaller chunks with overlap.
    
    Returns:
        List of (chunk_text, metadata) tuples
    """
    chunks = []
    
    # Split by ## headers
    sections = re.split(r'(?=^## )', content, flags=re.MULTILINE)
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        # Extract section header
        header_match = re.match(r'^(#{1,4})\s+(.+)', section)
        header = header_match.group(2).strip() if header_match else ""
        
        metadata = {
            "source": source_file,
            "section": header,
        }
        
        if len(section) <= MAX_CHUNK_SIZE:
            chunks.append((section, metadata))
        else:
            # Split long sections into smaller chunks
            sub_chunks = _split_text(section, MAX_CHUNK_SIZE, CHUNK_OVERLAP)
            for i, sub_chunk in enumerate(sub_chunks):
                meta = {**metadata, "sub_chunk": i}
                chunks.append((sub_chunk, meta))
    
    return chunks


def _split_text(text: str, max_size: int, overlap: int) -> List[str]:
    """Split text into overlapping chunks, preferring paragraph boundaries."""
    if len(text) <= max_size:
        return [text]
    
    chunks = []
    paragraphs = text.split('\n\n')
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk)
                # Start new chunk with overlap from end of previous
                if overlap > 0 and len(current_chunk) > overlap:
                    current_chunk = current_chunk[-overlap:] + "\n\n" + para
                else:
                    current_chunk = para
            else:
                # Single paragraph exceeds max size, force split
                while len(para) > max_size:
                    chunks.append(para[:max_size])
                    para = para[max_size - overlap:]
                current_chunk = para
    
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks


def ingest_file(engine: HybridSearchEngine, filepath: str, force: bool = False) -> int:
    """
    Ingest a single markdown file into the search index.
    
    Args:
        engine: The search engine instance
        filepath: Path to the markdown file
        force: If True, re-index even if file hasn't changed
        
    Returns:
        Number of chunks indexed
    """
    filepath = str(filepath)
    
    try:
        content = Path(filepath).read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}")
        return 0
    except Exception as e:
        logger.error(f"Failed to read {filepath}: {e}")
        return 0
    
    # Determine relative source name
    try:
        source_name = str(Path(filepath).relative_to(ARDEN_ROOT))
    except ValueError:
        source_name = filepath
    
    # Remove old chunks for this source
    engine.remove_source(source_name)
    
    # Chunk the content
    chunks = chunk_by_sections(content, source_name)
    
    if not chunks:
        logger.info(f"No chunks generated for {source_name}")
        return 0
    
    # Batch index
    documents = [
        (source_name, chunk_text, metadata, i)
        for i, (chunk_text, metadata) in enumerate(chunks)
    ]
    
    doc_ids = engine.index_documents_batch(documents)
    logger.info(f"Indexed {len(doc_ids)} chunks from {source_name}")
    return len(doc_ids)


def ingest_identity_files(engine: HybridSearchEngine) -> int:
    """Index all identity files (SOUL.md, USER.md, etc.)."""
    total = 0
    for filename in IDENTITY_FILES:
        filepath = ARDEN_ROOT / filename
        if filepath.exists():
            total += ingest_file(engine, str(filepath))
        else:
            logger.info(f"Identity file not found: {filename}")
    
    logger.info(f"Indexed {total} chunks from identity files")
    return total


def ingest_daily_logs(engine: HybridSearchEngine, days: int = 30) -> int:
    """Index recent daily logs."""
    daily_dir = ARDEN_ROOT / "daily"
    if not daily_dir.exists():
        logger.info("Daily directory not found")
        return 0
    
    # Get all daily log files, sort by name (date)
    log_files = sorted(daily_dir.glob("*.md"), reverse=True)
    
    total = 0
    for filepath in log_files[:days]:
        total += ingest_file(engine, str(filepath))
    
    logger.info(f"Indexed {total} chunks from {min(len(log_files), days)} daily logs")
    return total


def ingest_skill_files(engine: HybridSearchEngine) -> int:
    """Index all SKILL.md files from the skills directory."""
    skills_dir = ARDEN_ROOT / "skills"
    if not skills_dir.exists():
        return 0
    
    total = 0
    for skill_md in skills_dir.glob("*/SKILL.md"):
        total += ingest_file(engine, str(skill_md))
    
    logger.info(f"Indexed {total} chunks from skill files")
    return total


def ingest_all(engine: HybridSearchEngine) -> Dict[str, int]:
    """
    Full ingestion of all indexable content.
    
    Returns:
        Dict with counts per category
    """
    results = {
        "identity_files": ingest_identity_files(engine),
        "daily_logs": ingest_daily_logs(engine),
        "skill_files": ingest_skill_files(engine),
    }
    
    total = sum(results.values())
    results["total"] = total
    
    logger.info(f"Full ingestion complete: {total} total chunks", extra=results)
    return results
