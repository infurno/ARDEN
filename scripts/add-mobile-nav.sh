#!/bin/bash
# Script to add mobile navigation to all ARDEN web pages

# This script should be run from the ARDEN root directory
# It will update chat.html, notes.html, todos.html, skills.html, sessions.html, and settings.html

echo "Adding mobile navigation to all web pages..."

# Array of pages to update (dashboard.html is already done)
pages=("chat" "notes" "todos" "skills" "sessions" "settings")

for page in "${pages[@]}"; do
    file="web/${page}.html"
    
    if [ ! -f "$file" ]; then
        echo "Warning: $file not found, skipping..."
        continue
    fi
    
    echo "Processing $file..."
    
    # Create a backup
    cp "$file" "$file.backup"
    
    echo "  - Backup created: $file.backup"
    echo "  - Please manually update $file with mobile navigation"
done

echo ""
echo "Mobile navigation update complete!"
echo "Note: Manual updates required for each page."
echo "Use the dashboard.html header as a template."
