# Best Local Models for Note Editing & Management

## Your Setup
- **GPU:** NVIDIA RTX 5070 (12GB VRAM) ✅
- **Current Model:** llama3.2:latest (2GB)
- **Notes:** 576 markdown files (207MB)
- **Use Case:** Editing, summarizing, organizing, and working with notes

---

## 🏆 Top Recommendations

### 1. **Qwen2.5-Coder 14B** (BEST FOR NOTES) 🥇

**Model:** `qwen2.5-coder:14b`

**Why it's perfect for you:**
- ✅ Excellent at structured text (markdown, code, documentation)
- ✅ Strong reasoning and editing capabilities
- ✅ 128K context window (can handle LONG notes)
- ✅ Great at following instructions
- ✅ Fits comfortably in 12GB VRAM
- ✅ Fast inference on RTX 5070

**Install:**
```bash
ollama pull qwen2.5-coder:14b
```

**Size:** ~8.5GB VRAM
**Speed:** ~30-40 tokens/sec on RTX 5070
**Context:** 128K tokens (~400 pages)

**Best for:**
- ✅ Editing and refactoring notes
- ✅ Summarizing long documents
- ✅ Extracting TODOs and action items
- ✅ Restructuring and organizing notes
- ✅ Code snippets in notes
- ✅ Technical documentation

---

### 2. **Llama 3.1 8B Instruct** (BALANCED) 🥈

**Model:** `llama3.1:8b-instruct-q8_0`

**Why it's good:**
- ✅ More capable than llama3.2
- ✅ 128K context window
- ✅ Better instruction following
- ✅ Good general-purpose performance
- ✅ Fast and efficient

**Install:**
```bash
ollama pull llama3.1:8b-instruct-q8_0
```

**Size:** ~8.5GB VRAM
**Speed:** ~40-50 tokens/sec
**Context:** 128K tokens

**Best for:**
- ✅ General note editing
- ✅ Summarization
- ✅ Q&A about your notes
- ✅ Creative writing
- ✅ Brainstorming

---

### 3. **Mistral Small 22B** (POWER USER) 🥉

**Model:** `mistral-small:22b`

**Why it's powerful:**
- ✅ Excellent reasoning
- ✅ Strong at complex editing tasks
- ✅ Great with technical content
- ✅ Will max out your 12GB VRAM
- ✅ Very capable for analysis

**Install:**
```bash
ollama pull mistral-small:22b
```

**Size:** ~12GB VRAM (will use full GPU)
**Speed:** ~20-30 tokens/sec
**Context:** 32K tokens

**Best for:**
- ✅ Complex analysis
- ✅ Deep note restructuring
- ✅ Technical editing
- ✅ Research synthesis
- ⚠️ Slower than smaller models

---

### 4. **Gemma 2 9B Instruct** (EFFICIENT)

**Model:** `gemma2:9b-instruct-q8_0`

**Why consider it:**
- ✅ Excellent quality-to-size ratio
- ✅ Very good at following instructions
- ✅ Fast inference
- ✅ Good with structured text
- ✅ 8K context (smaller but efficient)

**Install:**
```bash
ollama pull gemma2:9b-instruct-q8_0
```

**Size:** ~9GB VRAM
**Speed:** ~35-45 tokens/sec
**Context:** 8K tokens

**Best for:**
- ✅ Quick edits
- ✅ Fast responses
- ✅ Shorter notes
- ✅ Daily note-taking assistance

---

## 📊 Model Comparison Table

| Model | Size | VRAM | Speed | Context | Best For | Overall |
|-------|------|------|-------|---------|----------|---------|
| **Qwen2.5-Coder 14B** | 8.5GB | 8.5GB | ⚡⚡⚡ | 128K | Notes/Code/Docs | 🥇 **BEST** |
| Llama 3.1 8B | 8.5GB | 8.5GB | ⚡⚡⚡⚡ | 128K | General Purpose | 🥈 Good |
| Mistral Small 22B | 12GB | 12GB | ⚡⚡ | 32K | Complex Tasks | 🥉 Powerful |
| Gemma 2 9B | 9GB | 9GB | ⚡⚡⚡⚡ | 8K | Fast Edits | ⭐ Efficient |
| Llama 3.2 3B (current) | 2GB | 2GB | ⚡⚡⚡⚡⚡ | 128K | Basic Tasks | ⚠️ Limited |

---

## 🎯 My Recommendation: **Qwen2.5-Coder 14B**

For working with your 576 markdown notes, **Qwen2.5-Coder 14B** is the best choice because:

### Why Qwen2.5-Coder?

1. **Markdown Mastery**
   - Trained specifically on code and structured text
   - Understands markdown syntax perfectly
   - Great at preserving formatting

2. **128K Context Window**
   - Can read multiple notes at once
   - Can handle your longest documents
   - Better context awareness

3. **Editing Excellence**
   - Follows editing instructions precisely
   - Can refactor and restructure
   - Maintains consistency

4. **Perfect VRAM Fit**
   - Uses ~8.5GB of your 12GB
   - Leaves headroom for system
   - Fast inference on RTX 5070

5. **Obsidian-Friendly**
   - Understands wikilinks: `[[note]]`
   - Handles frontmatter
   - Respects note structure

---

## 🚀 Setup Guide

### Step 1: Install Qwen2.5-Coder

```bash
# Pull the model
ollama pull qwen2.5-coder:14b

# Verify it's installed
ollama list

# Test it
ollama run qwen2.5-coder:14b "Summarize this: I have 576 markdown notes about infrastructure, FedEx work, and personal projects. I need help organizing them."
```

### Step 2: Update ARDEN Config

```bash
nano /home/hal/ARDEN/config/arden.json

# Find the AI provider section (around line 50-70)
# Change the model to:
"model": "qwen2.5-coder:14b"

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 3: Restart ARDEN

```bash
cd /home/hal/ARDEN
./scripts/restart.sh
./scripts/stop-web.sh && ./scripts/start-web.sh
```

### Step 4: Test It

```bash
# Via Ollama directly
ollama run qwen2.5-coder:14b "Read this markdown and fix any formatting issues:

# My Note
- TODO: incomplete task
* Different bullet style
  - Inconsistent indentation

What should I fix?"

# Via ARDEN web interface
# Go to http://192.168.4.57:3001
# Ask: "Help me organize my notes about Kubernetes"
```

---

## 📝 Example Note Editing Tasks

### Task 1: Summarize a Long Note

```bash
ollama run qwen2.5-coder:14b "Summarize this note in 3 bullet points:

[paste your note content]
"
```

### Task 2: Extract TODOs

```bash
ollama run qwen2.5-coder:14b "Extract all TODO items from this note and format as a checklist:

[paste note]
"
```

### Task 3: Restructure Note

```bash
ollama run qwen2.5-coder:14b "Restructure this note with proper headings and sections:

[paste messy note]
"
```

### Task 4: Generate Frontmatter

```bash
ollama run qwen2.5-coder:14b "Generate YAML frontmatter for this note:

[paste note]

Include: title, tags, created date, category"
```

---

## 🔧 Advanced: Multiple Models

You can keep multiple models and switch based on task:

### Install All Recommended Models

```bash
# Best for notes/code (primary)
ollama pull qwen2.5-coder:14b

# Good for general chat
ollama pull llama3.1:8b-instruct-q8_0

# Fast for quick tasks
ollama pull gemma2:9b-instruct-q8_0

# Check installed models
ollama list
```

### Use Different Models for Different Tasks

**In ARDEN, you can switch models via API:**

```bash
# Edit a note with Qwen
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "qwen2.5-coder:14b",
  "prompt": "Fix the formatting in this markdown..."
}'

# Chat with Llama
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b-instruct-q8_0",
  "prompt": "Tell me about your day..."
}'
```

---

## 💡 Pro Tips

### 1. Use Model-Specific Strengths

- **Qwen2.5-Coder:** Editing, refactoring, technical notes
- **Llama 3.1:** General chat, brainstorming, creative writing
- **Gemma 2:** Quick questions, fast responses

### 2. Optimize for Your Workflow

```bash
# Create aliases for quick model switching
echo 'alias qwen="ollama run qwen2.5-coder:14b"' >> ~/.bashrc
echo 'alias llama="ollama run llama3.1:8b-instruct-q8_0"' >> ~/.bashrc
source ~/.bashrc

# Now use:
qwen "Fix this note formatting..."
llama "Tell me a joke"
```

### 3. Batch Process Notes

```bash
# Process multiple notes
for file in ~/Notes/*.md; do
    echo "Processing $file..."
    ollama run qwen2.5-coder:14b "Extract TODOs from: $(cat "$file")"
done
```

### 4. Use Context Window Wisely

Qwen2.5-Coder can handle 128K tokens (~400 pages):

```bash
# Combine multiple notes
cat ~/Notes/project-*.md | ollama run qwen2.5-coder:14b "Summarize all these project notes"
```

---

## 🎓 Specialized Models for Specific Tasks

### For Research & Analysis
```bash
ollama pull mistral-small:22b
```
Best for: Deep analysis, research synthesis, complex reasoning

### For Creative Writing
```bash
ollama pull llama3.1:8b-instruct-q8_0
```
Best for: Story writing, brainstorming, creative content

### For Code in Notes
```bash
ollama pull qwen2.5-coder:14b  # Already recommended!
```
Best for: Code snippets, technical docs, infrastructure notes

### For Speed
```bash
ollama pull gemma2:9b-instruct-q8_0
```
Best for: Quick edits, fast responses, real-time assistance

---

## 🔍 Testing Models

### Quick Test Script

Create a test to compare models:

```bash
cat > /tmp/test-models.sh << 'EOF'
#!/bin/bash

TEST_NOTE="# Infrastructure Notes

## Kubernetes Cluster
- TODO: Upgrade to k8s 1.28
- Current version: 1.27
- 3 worker nodes

## FedEx Integration
- API endpoint: https://api.fedex.com
- Need to update authentication

Summarize this and extract TODOs."

echo "Testing Qwen2.5-Coder..."
time ollama run qwen2.5-coder:14b "$TEST_NOTE"

echo ""
echo "Testing Llama 3.1..."
time ollama run llama3.1:8b-instruct-q8_0 "$TEST_NOTE"

echo ""
echo "Testing current Llama 3.2..."
time ollama run llama3.2 "$TEST_NOTE"
EOF

chmod +x /tmp/test-models.sh
/tmp/test-models.sh
```

---

## 📦 Installation Steps (Complete)

### Full Setup for Qwen2.5-Coder

```bash
# 1. Pull the model
ollama pull qwen2.5-coder:14b

# 2. Test it works
ollama run qwen2.5-coder:14b "Say hello"

# 3. Update ARDEN config
cd /home/hal/ARDEN
cp config/arden.json config/arden.json.backup
nano config/arden.json
# Change model to: "qwen2.5-coder:14b"

# 4. Restart services
./scripts/restart.sh
./scripts/stop-web.sh && ./scripts/start-web.sh

# 5. Test via ARDEN
# Open http://192.168.4.57:3001
# Ask: "Help me organize my notes"
```

---

## 🎯 Final Recommendation

**Install Qwen2.5-Coder 14B now:**

```bash
ollama pull qwen2.5-coder:14b
```

Then update your ARDEN config to use it. This will give you:

✅ **Better note editing** than llama3.2  
✅ **128K context** for long notes  
✅ **Markdown expertise** for Obsidian  
✅ **Fast performance** on RTX 5070  
✅ **Technical knowledge** for infrastructure notes  

You can always keep llama3.2 for quick tasks, but Qwen2.5-Coder will be your workhorse for note management.

---

**TL;DR:** Use **`qwen2.5-coder:14b`** - it's specifically designed for working with structured text like markdown, has a huge context window, and will run great on your RTX 5070.
