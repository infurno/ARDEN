/**
 * Memory Search Service (Node.js bridge)
 * 
 * Bridges the Node.js API to the Python hybrid search engine.
 * Communicates via HTTP to the memory server running on port 3002.
 * 
 * Falls back gracefully if the memory server is not running.
 */

const http = require('http');
const logger = require('../utils/logger');

const MEMORY_HOST = process.env.ARDEN_MEMORY_HOST || '127.0.0.1';
const MEMORY_PORT = process.env.ARDEN_MEMORY_PORT || 3002;
const TIMEOUT_MS = 10000; // 10 second timeout

let serverAvailable = null; // null = unknown, true/false = tested

/**
 * Make an HTTP request to the memory server
 */
function memoryRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: MEMORY_HOST,
      port: MEMORY_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT_MS,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            serverAvailable = true;
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      serverAvailable = false;
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Memory server request timed out'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Check if the memory server is healthy
 */
async function isAvailable() {
  try {
    await memoryRequest('GET', '/health');
    serverAvailable = true;
    return true;
  } catch {
    serverAvailable = false;
    return false;
  }
}

/**
 * Hybrid search across indexed documents
 * 
 * @param {string} query - Search query text
 * @param {number} topK - Number of results (default 10)
 * @param {string|null} sourceFilter - Optional source file filter
 * @returns {Array} Search results or empty array if unavailable
 */
async function search(query, topK = 10, sourceFilter = null) {
  try {
    const result = await memoryRequest('POST', '/search', {
      query,
      top_k: topK,
      source_filter: sourceFilter,
    });

    logger.system.info('Memory search completed', {
      query: query.slice(0, 50),
      results: result.count,
    });

    return result.results || [];
  } catch (error) {
    if (serverAvailable !== false) {
      logger.system.warn('Memory search unavailable', { error: error.message });
    }
    return [];
  }
}

/**
 * Search and format results for inclusion in AI prompts
 * 
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 * @returns {string} Formatted context string or empty string
 */
async function searchForContext(query, topK = 5) {
  const results = await search(query, topK);

  if (results.length === 0) return '';

  let context = '\n=== RELEVANT MEMORY (from hybrid search) ===\n';
  for (const result of results) {
    const score = result.score ? result.score.toFixed(3) : '?';
    context += `\n[${result.source_file} | score: ${score}]\n`;
    context += result.chunk_text.slice(0, 500) + '\n';
  }
  context += '=== END RELEVANT MEMORY ===\n';

  return context;
}

/**
 * Trigger re-indexing of a specific file
 */
async function indexFile(filepath) {
  try {
    const result = await memoryRequest('POST', '/index', { filepath });
    logger.system.info('File indexed', { filepath, chunks: result.indexed_chunks });
    return result;
  } catch (error) {
    logger.system.warn('File indexing failed', { filepath, error: error.message });
    return null;
  }
}

/**
 * Trigger full re-ingestion of all content
 */
async function ingestAll() {
  try {
    const result = await memoryRequest('POST', '/ingest');
    logger.system.info('Full ingestion completed', result.results);
    return result.results;
  } catch (error) {
    logger.system.warn('Full ingestion failed', { error: error.message });
    return null;
  }
}

/**
 * Get index statistics
 */
async function getStats() {
  try {
    return await memoryRequest('GET', '/stats');
  } catch (error) {
    return { error: error.message, available: false };
  }
}

module.exports = {
  isAvailable,
  search,
  searchForContext,
  indexFile,
  ingestAll,
  getStats,
};
