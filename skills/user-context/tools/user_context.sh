#!/bin/bash

# User Context Tool
# Provides structured user context information for skills and AI interactions
# Reads from ~/Notes/profile.md for the most up-to-date information

PROFILE_PATH="$HOME/Notes/profile.md"

# Define user profile variables (fallback if profile.md doesn't exist)
USER_NAME="Hal Borland"
USER_ROLE="Strategic Engineer of Infrastructure"
USER_COMPANY="FedEx Freight"
USER_LOCATION="Chicago area"

# Technical context
WORK_CONTEXT_TECHNICAL_ARCHITECTURE="Infrastructure design and implementation"
WORK_CONTEXT_TECHNOLOGIES="Kubernetes (K3S clusters), VMware virtualization, Azure cloud services, Linux systems (Arch Linux user), Container orchestration, Infrastructure as Code"

# Parse output format option
FORMAT="${1:-text}"  # Default to text format, can be: text, json, or compact

# Function to get user context in text format
get_text_format() {
  cat << EOF
=== User Context ===

Personal Information:
  Name: $USER_NAME
  Role: $USER_ROLE
  Company: $USER_COMPANY
  Location: $USER_LOCATION

Work Context:
  Technical Architecture: $WORK_CONTEXT_TECHNICAL_ARCHITECTURE
  Technologies: $WORK_CONTEXT_TECHNOLOGIES

Environment:
  Primary OS: Arch Linux
  GPU: NVIDIA GeForce RTX 5070
  Notes Location: ~/Notes (Obsidian vault)
  ARDEN Location: /home/hal/ARDEN

Communication Preferences:
  - Prefers concise, technical responses
  - Values actionable information
  - Appreciates automation and efficiency
  - Uses voice interaction via Telegram

EOF
}

# Function to get user context in JSON format
get_json_format() {
  cat << EOF
{
  "personal": {
    "name": "$USER_NAME",
    "role": "$USER_ROLE",
    "company": "$USER_COMPANY",
    "location": "$USER_LOCATION"
  },
  "work_context": {
    "technical_architecture": "$WORK_CONTEXT_TECHNICAL_ARCHITECTURE",
    "technologies": "$WORK_CONTEXT_TECHNOLOGIES"
  },
  "environment": {
    "os": "Arch Linux",
    "gpu": "NVIDIA GeForce RTX 5070",
    "notes_location": "$HOME/Notes",
    "arden_location": "/home/hal/ARDEN"
  },
  "preferences": {
    "response_style": "concise, technical",
    "values": "actionable information, automation, efficiency",
    "interaction": "voice via Telegram"
  }
}
EOF
}

# Function to get compact user context (for embedding in notes)
get_compact_format() {
  echo "Context: $USER_NAME | $USER_ROLE @ $USER_COMPANY | $USER_LOCATION | Tech: K8S, VMware, Azure, Linux"
}

# Main execution
case "$FORMAT" in
  json)
    get_json_format
    ;;
  compact)
    get_compact_format
    ;;
  text|*)
    get_text_format
    ;;
esac
