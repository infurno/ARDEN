/**
 * Skill Registry
 * 
 * Auto-discovers skills by scanning skills/*/SKILL.md files.
 * Parses a standardized frontmatter block from each SKILL.md to build
 * a runtime registry with trigger patterns, tool paths, and metadata.
 * 
 * SKILL.md frontmatter format (YAML between --- delimiters):
 * 
 *   ---
 *   name: weather
 *   version: 1.0.0
 *   enabled: true
 *   triggers:
 *     - "weather in {location}"
 *     - "temperature in {location}"
 *   patterns:
 *     - "weather\\s+(?:in|for)\\s+(.+)"
 *     - "temperature\\s+in\\s+(.+)"
 *   tools:
 *     - get-weather.sh
 *     - get-forecast.sh
 *   entry: tools/get-weather.sh
 *   timeout: 15000
 *   agents: [assistant, analyst]
 *   ---
 * 
 * Skills without frontmatter are still discovered but won't have
 * pattern-based auto-detection; they remain callable by name.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ARDEN_ROOT, 'skills');

class SkillRegistry {
  constructor() {
    /** @type {Map<string, SkillDefinition>} */
    this.skills = new Map();
    /** @type {Array<{regex: RegExp, skillName: string, captureGroups: string[]}>} */
    this._compiledPatterns = [];
    this._loaded = false;
  }

  /**
   * Scan skills directory and load all SKILL.md files.
   * Called once at startup; can be called again to hot-reload.
   */
  load() {
    this.skills.clear();
    this._compiledPatterns = [];

    if (!fs.existsSync(SKILLS_DIR)) {
      logger.system.warn('[skill-registry] Skills directory not found', { path: SKILLS_DIR });
      this._loaded = true;
      return;
    }

    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(SKILLS_DIR, entry.name);
      const skillMd = path.join(skillDir, 'SKILL.md');

      if (!fs.existsSync(skillMd)) {
        logger.system.warn('[skill-registry] No SKILL.md found, skipping', { dir: entry.name });
        continue;
      }

      try {
        const raw = fs.readFileSync(skillMd, 'utf-8');
        const def = this._parseSkillMd(entry.name, skillDir, raw);
        this.skills.set(def.name, def);

        // Compile regex patterns for auto-detection
        if (def.enabled && def.patterns && def.patterns.length > 0) {
          for (const pat of def.patterns) {
            try {
              const regex = new RegExp(pat, 'i');
              this._compiledPatterns.push({
                regex,
                skillName: def.name,
                captureGroups: this._extractNamedGroups(pat),
              });
            } catch (e) {
              logger.system.warn('[skill-registry] Invalid pattern', { skill: def.name, pattern: pat, error: e.message });
            }
          }
        }

        logger.system.info('[skill-registry] Loaded skill', {
          name: def.name,
          version: def.version,
          enabled: def.enabled,
          patterns: (def.patterns || []).length,
        });
      } catch (e) {
        logger.system.error('[skill-registry] Failed to load skill', { dir: entry.name, error: e.message });
      }
    }

    this._loaded = true;
    logger.system.info('[skill-registry] Registry loaded', { count: this.skills.size });
  }

  /**
   * Ensure the registry is loaded (lazy init).
   */
  ensureLoaded() {
    if (!this._loaded) this.load();
  }

  /**
   * Get a skill by name.
   * @param {string} name
   * @returns {SkillDefinition|undefined}
   */
  get(name) {
    this.ensureLoaded();
    return this.skills.get(name);
  }

  /**
   * Return all registered skills.
   * @returns {SkillDefinition[]}
   */
  list() {
    this.ensureLoaded();
    return Array.from(this.skills.values());
  }

  /**
   * Return only enabled skills.
   * @returns {SkillDefinition[]}
   */
  listEnabled() {
    return this.list().filter((s) => s.enabled);
  }

  /**
   * Match a user message against all skill patterns.
   * Returns the first match: { skill, captures }.
   * @param {string} message
   * @returns {{ skill: SkillDefinition, captures: string[] } | null}
   */
  match(message) {
    this.ensureLoaded();
    for (const { regex, skillName } of this._compiledPatterns) {
      const m = message.match(regex);
      if (m) {
        const skill = this.skills.get(skillName);
        if (skill && skill.enabled) {
          // captures[0] is full match, rest are capture groups
          return { skill, captures: m.slice(1) };
        }
      }
    }
    return null;
  }

  // ── Internal parsing ─────────────────────────────────────────

  /**
   * Parse a SKILL.md file. Extracts YAML frontmatter (between --- lines)
   * and falls back to inferring metadata from the markdown body.
   */
  _parseSkillMd(dirName, skillDir, raw) {
    const def = {
      name: dirName,
      dir: skillDir,
      version: '1.0.0',
      enabled: true,
      purpose: '',
      triggers: [],
      patterns: [],
      tools: [],
      entry: null,
      timeout: 15000,
      agents: [],
      raw: raw,
    };

    // Try to parse frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = this._parseSimpleYaml(fmMatch[1]);
      if (fm.name) def.name = fm.name;
      if (fm.version) def.version = fm.version;
      if (fm.enabled !== undefined) def.enabled = fm.enabled !== false && fm.enabled !== 'false';
      if (fm.triggers) def.triggers = Array.isArray(fm.triggers) ? fm.triggers : [fm.triggers];
      if (fm.patterns) def.patterns = Array.isArray(fm.patterns) ? fm.patterns : [fm.patterns];
      if (fm.tools) def.tools = Array.isArray(fm.tools) ? fm.tools : [fm.tools];
      if (fm.entry) def.entry = fm.entry;
      if (fm.timeout) def.timeout = parseInt(fm.timeout, 10) || 15000;
      if (fm.agents) def.agents = Array.isArray(fm.agents) ? fm.agents : [fm.agents];
    }

    // Extract purpose from markdown body
    const purposeMatch = raw.match(/## (?:Purpose|Overview)\n+(.+)/);
    if (purposeMatch) {
      def.purpose = purposeMatch[1].trim();
    }

    // Resolve entry point to absolute path
    if (def.entry) {
      def.entryPath = path.join(skillDir, def.entry);
    } else {
      // Auto-detect: look for first .sh or .js in tools/
      const toolsDir = path.join(skillDir, 'tools');
      if (fs.existsSync(toolsDir)) {
        const tools = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.sh') || f.endsWith('.js'));
        if (tools.length > 0) {
          def.entry = `tools/${tools[0]}`;
          def.entryPath = path.join(toolsDir, tools[0]);
        }
      }
    }

    return def;
  }

  /**
   * Parse simple YAML (no nested objects, just key: value and lists).
   * Good enough for frontmatter; avoids adding a YAML dependency.
   */
  _parseSimpleYaml(text) {
    const result = {};
    let currentKey = null;
    let currentList = null;

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // List item
      if (trimmed.startsWith('- ')) {
        const val = trimmed.slice(2).replace(/^["']|["']$/g, '').trim();
        if (currentKey && currentList) {
          currentList.push(val);
        }
        continue;
      }

      // Key: value
      const kvMatch = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)/);
      if (kvMatch) {
        // Save previous list
        if (currentKey && currentList) {
          result[currentKey] = currentList;
        }

        currentKey = kvMatch[1];
        const val = kvMatch[2].trim();

        if (!val) {
          // Value will be a list on next lines
          currentList = [];
        } else if (val.startsWith('[') && val.endsWith(']')) {
          // Inline array: [a, b, c]
          result[currentKey] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
          currentKey = null;
          currentList = null;
        } else {
          // Scalar
          result[currentKey] = val.replace(/^["']|["']$/g, '');
          currentKey = null;
          currentList = null;
        }
      }
    }

    // Save last list
    if (currentKey && currentList) {
      result[currentKey] = currentList;
    }

    return result;
  }

  /**
   * Extract named capture group names from a regex string (informational).
   */
  _extractNamedGroups(pattern) {
    const names = [];
    const re = /\(\?<(\w+)>/g;
    let m;
    while ((m = re.exec(pattern)) !== null) {
      names.push(m[1]);
    }
    return names;
  }
}

// Singleton
const registry = new SkillRegistry();

module.exports = registry;
