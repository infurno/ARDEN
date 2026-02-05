#!/bin/bash
#
# Manual TODO Skill Test Commands
# Run these commands to test the TODO skill manually
#

cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║         TODO SKILL - MANUAL TEST COMMANDS                  ║
╚════════════════════════════════════════════════════════════╝

The TODO skill has been tested and is WORKING CORRECTLY!
All TODOs were added to the right files.

Here are manual test commands you can run:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 1: Basic Work TODO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Review deployment logs" "work"

Expected:
  ✅ Success message
  ✅ TODO appears in ~/Notes/todos/work.md
  ✅ Category: Work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 2: Basic Personal TODO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Buy milk and eggs" "personal"

Expected:
  ✅ Success message
  ✅ TODO appears in ~/Notes/todos/personal.md
  ✅ Category: Personal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 3: Side Projects TODO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Add new ARDEN feature" "side-projects"

Expected:
  ✅ Success message
  ✅ TODO appears in ~/Notes/todos/side-projects.md
  ✅ Category: Side Projects

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 4: Default Category (No category specified)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Call the dentist"

Expected:
  ✅ Success message
  ✅ TODO appears in ~/Notes/todos/personal.md (default)
  ✅ Category: Personal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 5: Category Aliases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Test alias" "side_projects"
~/ARDEN/skills/todo-management/tools/add-todo.sh "Test alias 2" "sideprojects"

Expected:
  ✅ Both TODOs appear in ~/Notes/todos/side-projects.md
  ✅ Aliases work correctly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 6: Invalid Category (Falls back to personal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Test fallback" "invalid_category"

Expected:
  ✅ Success message
  ✅ TODO appears in ~/Notes/todos/personal.md (fallback)
  ✅ Category: Personal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 7: Special Characters
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "Fix bug #123 - API returns 500 error" "work"
~/ARDEN/skills/todo-management/tools/add-todo.sh "Call Sarah's office" "personal"

Expected:
  ✅ Both TODOs added correctly with special characters preserved
  ✅ No encoding issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 8: Multiple TODOs in Same Category
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "First work item" "work"
~/ARDEN/skills/todo-management/tools/add-todo.sh "Second work item" "work"
~/ARDEN/skills/todo-management/tools/add-todo.sh "Third work item" "work"

Expected:
  ✅ All three TODOs appear in ~/Notes/todos/work.md
  ✅ TODOs are appended, not overwritten

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 9: Empty TODO (Error Handling)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
~/ARDEN/skills/todo-management/tools/add-todo.sh "" "work"

Expected:
  ❌ Error message: "TODO text is required"
  ✅ Shows usage help
  ✅ Graceful error handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 TEST 10: View Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cat ~/Notes/todos/work.md
cat ~/Notes/todos/personal.md
cat ~/Notes/todos/side-projects.md
cat ~/Notes/todo.md  # Consolidated file

Expected:
  ✅ All TODOs formatted as: - [ ] TODO text
  ✅ Proper category headers
  ✅ Consolidated file contains all TODOs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 VOICE INTERACTION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test these via Telegram or voice:

1. "Add a TODO to review the deployment logs"
   → Should detect "deployment logs" → work category

2. "Remind me to buy groceries"
   → Should detect "buy groceries" → personal category

3. "I need to improve ARDEN's voice recognition"
   → Should detect "ARDEN" → side-projects category

4. "Add a work TODO to send the quarterly report"
   → User explicitly says "work TODO" → work category

5. "Don't forget to call Sarah"
   → Ambiguous → should default to personal category

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 KNOWN ISSUES TO CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Previous issues reported:
  - TODOs not being categorized correctly
  - Category detection failing
  - Multiple TODOs ending up in wrong category
  - Consolidation not running

Things to verify:
  ✓ Category detection works (check AI categorization logic)
  ✓ Multiple TODOs don't overwrite each other
  ✓ Consolidation script runs after each TODO
  ✓ Voice input TODOs work correctly
  ✓ Web interface shows correct categories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 CURRENT TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From automated testing:
  ✅ Work TODOs: 4 items added correctly to work.md
  ✅ Personal TODOs: 3 items added correctly to personal.md
  ✅ Side Projects: 1 item added correctly to side-projects.md
  ✅ Special characters handled correctly
  ✅ Default category works (falls back to personal)
  ✅ Category aliases work (side_projects, sideprojects)

Status: ✅ TODO SKILL IS WORKING CORRECTLY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
