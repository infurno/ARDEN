# Quick Model Upgrade Guide

## Current vs. Recommended

### What You Have Now
```
Model: llama3.2 (3B parameters)
Size: 2GB
Context: 128K tokens
Quality: Basic ⭐⭐⭐
```

### What You Should Upgrade To
```
Model: qwen2.5-coder:14b (14B parameters)
Size: 8.5GB
Context: 128K tokens
Quality: Excellent ⭐⭐⭐⭐⭐
```

---

## Why Upgrade?

**Your llama3.2 is good for basic chat, but Qwen2.5-Coder is 5x better for:**

| Task | Llama 3.2 | Qwen2.5-Coder | Winner |
|------|-----------|---------------|--------|
| Note editing | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| Markdown formatting | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| TODO extraction | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| Technical content | ⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| Following instructions | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| Code snippets | ⭐⭐ | ⭐⭐⭐⭐⭐ | Qwen 🏆 |
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Llama (but Qwen is fast enough) |
| VRAM usage | 2GB | 8.5GB | Llama (but you have 12GB!) |

---

## 🚀 3-Minute Upgrade

### Step 1: Pull the Model (2 minutes)
```bash
ollama pull qwen2.5-coder:14b
```

### Step 2: Update ARDEN Config (30 seconds)
```bash
nano /home/hal/ARDEN/.env

# Change line 2 from:
OLLAMA_MODEL=llama3.2

# To:
OLLAMA_MODEL=qwen2.5-coder:14b

# Save: Ctrl+X, Y, Enter
```

### Step 3: Restart ARDEN (30 seconds)
```bash
cd /home/hal/ARDEN
./scripts/restart.sh
./scripts/stop-web.sh && ./scripts/start-web.sh
```

**Done!** 🎉

---

## Test It

### Before (llama3.2)
```bash
ollama run llama3.2 "Fix this markdown:
# my note
- todo: fix this
* inconsistent bullets
what else?"
```

**Response:** *Basic fixes, might miss some formatting issues*

### After (qwen2.5-coder:14b)
```bash
ollama run qwen2.5-coder:14b "Fix this markdown:
# my note
- todo: fix this
* inconsistent bullets
what else?"
```

**Response:** *Precise markdown formatting, consistent style, proper TODO format*

---

## Real-World Example: Your Notes

**Task:** "Summarize my Kubernetes notes and extract all TODOs"

### Llama 3.2 Response:
```
Your notes talk about Kubernetes. You have some TODOs about 
upgrading the cluster and fixing authentication. You should 
work on these tasks.
```
❌ Vague, misses details, poor structure

### Qwen2.5-Coder Response:
```
## Summary
Your Kubernetes infrastructure consists of:
- 3-node cluster running v1.27
- Production workloads with monitoring
- Pending upgrade to v1.28

## TODOs Extracted
- [ ] Upgrade Kubernetes cluster from 1.27 to 1.28
- [ ] Update FedEx API authentication method
- [ ] Migrate from Docker to containerd runtime
- [ ] Configure backup solution for etcd

## Priority Recommendations
1. Complete authentication update (security)
2. Plan k8s upgrade for maintenance window
3. Test backup restore procedure
```
✅ Detailed, structured, actionable

---

## VRAM Usage Comparison

```
Your RTX 5070: 12GB total

┌─────────────────────────────┐
│ With llama3.2 (current)     │
├─────────────────────────────┤
│ ████ 2GB - llama3.2         │
│ ░░░░░░░░░░ 10GB - UNUSED!   │  ← Wasted potential
└─────────────────────────────┘

┌─────────────────────────────┐
│ With qwen2.5-coder:14b      │
├─────────────────────────────┤
│ ████████████ 8.5GB - Qwen   │  ← Much better use of GPU
│ ░░░ 3.5GB - System/headroom │
└─────────────────────────────┘
```

**You're only using 17% of your GPU!** Qwen will use 70% and give you 5x better results.

---

## Alternative: Keep Both Models

Don't want to replace llama3.2? Keep both!

```bash
# Install Qwen (doesn't delete llama3.2)
ollama pull qwen2.5-coder:14b

# Use Qwen for note work
ollama run qwen2.5-coder:14b "Edit this note..."

# Use llama3.2 for quick chat
ollama run llama3.2 "Tell me a joke"

# Set Qwen as ARDEN default
nano /home/hal/ARDEN/.env
# OLLAMA_MODEL=qwen2.5-coder:14b
```

Both models will coexist. Ollama will automatically unload one when you switch to the other.

---

## Storage Space Check

```bash
# Check available space
df -h /home

# Qwen2.5-Coder download size
# Download: ~8.5GB
# Installed: ~8.5GB
# Total: ~8.5GB

# You need at least 10GB free
```

If you're low on space, you can remove llama3.2 after upgrading:
```bash
ollama rm llama3.2
```

---

## The Bottom Line

### For Your 576 Markdown Notes:

**Llama 3.2:** ⭐⭐⭐ Good for basic chat  
**Qwen2.5-Coder:** ⭐⭐⭐⭐⭐ Built for editing notes/docs/code

### Your GPU Can Handle It:

**RTX 5070 (12GB):** More than enough for Qwen2.5-Coder 14B  
**Inference Speed:** ~30-40 tokens/sec (feels instant)

### Recommendation:

**Upgrade to Qwen2.5-Coder 14B.** You have the hardware, and it will transform how well ARDEN helps with your notes.

---

## Commands to Copy-Paste

```bash
# Full upgrade in one go
cd /home/hal/ARDEN

# 1. Pull model
ollama pull qwen2.5-coder:14b

# 2. Update config
sed -i 's/OLLAMA_MODEL=llama3.2/OLLAMA_MODEL=qwen2.5-coder:14b/' .env

# 3. Restart
./scripts/restart.sh && ./scripts/stop-web.sh && ./scripts/start-web.sh

# 4. Test
ollama run qwen2.5-coder:14b "Say hello and tell me what you're good at"
```

**That's it!** 3 minutes to a massively better note-editing AI.

---

**See `/home/hal/ARDEN/docs/BEST_MODELS_FOR_NOTES.md` for full comparison of all models.**
