#!/usr/bin/env python3
"""
Task Analysis Tool for ARDEN Daily Planning Skill
Analyzes TODOs, calculates priorities, and generates insights
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
NOTES_DIR = Path.home() / "Notes"
TODOS_DIR = NOTES_DIR / "todos"

# Priority keywords for auto-detection
URGENCY_KEYWORDS = {
    'high': ['urgent', 'asap', 'today', 'deadline', 'critical', 'emergency', 'blocking', 'blocked'],
    'medium': ['tomorrow', 'this week', 'soon', 'important'],
    'low': ['later', 'eventually', 'whenever', 'someday']
}

EFFORT_INDICATORS = {
    'high': ['2 hours', '3 hours', '4 hours', 'full day', 'research', 'implement', 'build'],
    'medium': ['1 hour', 'review', 'analyze', 'update', 'create'],
    'low': ['15 min', '30 min', 'quick', 'email', 'call', 'check']
}

CATEGORY_WEIGHTS = {
    'work': 1.2,
    'personal': 1.0,
    'side-projects': 0.9
}


def parse_todos():
    """Parse all TODO files and return list of tasks"""
    tasks = []
    
    if not TODOS_DIR.exists():
        return tasks
    
    todo_files = {
        'work': TODOS_DIR / 'work.md',
        'personal': TODOS_DIR / 'personal.md',
        'side-projects': TODOS_DIR / 'side-projects.md'
    }
    
    for category, filepath in todo_files.items():
        if filepath.exists():
            with open(filepath, 'r') as f:
                lines = f.readlines()
            
            for i, line in enumerate(lines, 1):
                # Match checkbox pattern: - [ ] or - [x] or - [X]
                match = re.match(r'^- \[([ xX])\] (.+)$', line.strip())
                if match:
                    status = 'completed' if match.group(1).lower() == 'x' else 'pending'
                    text = match.group(2).strip()
                    
                    tasks.append({
                        'text': text,
                        'category': category,
                        'status': status,
                        'line': i,
                        'file': str(filepath)
                    })
    
    return tasks


def calculate_priority(task):
    """Calculate priority score using Eisenhower Matrix + Impact scoring"""
    text = task['text'].lower()
    category = task['category']
    
    # Base scores
    impact = 3  # Medium impact default
    urgency = 2  # Low urgency default
    effort = 3   # Medium effort default
    
    # Detect urgency from keywords
    if any(kw in text for kw in URGENCY_KEYWORDS['high']):
        urgency = 5
    elif any(kw in text for kw in URGENCY_KEYWORDS['medium']):
        urgency = 3
    elif any(kw in text for kw in URGENCY_KEYWORDS['low']):
        urgency = 1
    
    # Detect effort from indicators
    if any(kw in text for kw in EFFORT_INDICATORS['high']):
        effort = 5
    elif any(kw in text for kw in EFFORT_INDICATORS['medium']):
        effort = 3
    elif any(kw in text for kw in EFFORT_INDICATORS['low']):
        effort = 1
    
    # Adjust impact based on category and content
    impact_boost = 0
    if 'revenue' in text or 'client' in text or 'production' in text:
        impact_boost = 2
    elif 'meeting' in text or 'email' in text:
        impact_boost = -1
    
    impact = max(1, min(5, impact + impact_boost))
    
    # Calculate priority score
    # Formula: (Impact × 3) + (Urgency × 2) + (Effort × -1)
    base_score = (impact * 3) + (urgency * 2) + (effort * -1)
    
    # Apply category weight
    weight = CATEGORY_WEIGHTS.get(category, 1.0)
    priority_score = int(base_score * weight)
    
    # Determine Eisenhower quadrant
    if urgency >= 4 and impact >= 4:
        quadrant = 'Q1'  # Do First
    elif urgency < 4 and impact >= 4:
        quadrant = 'Q2'  # Schedule
    elif urgency >= 4 and impact < 4:
        quadrant = 'Q3'  # Delegate
    else:
        quadrant = 'Q4'  # Eliminate
    
    return {
        'score': priority_score,
        'impact': impact,
        'urgency': urgency,
        'effort': effort,
        'quadrant': quadrant
    }


def prioritize_tasks(tasks, limit=10):
    """Sort and prioritize pending tasks"""
    # Filter only pending tasks
    pending = [t for t in tasks if t['status'] == 'pending']
    
    # Calculate priority for each
    for task in pending:
        task['priority'] = calculate_priority(task)
    
    # Sort by priority score (descending), then by effort (ascending)
    pending.sort(key=lambda x: (-x['priority']['score'], x['priority']['effort']))
    
    return pending[:limit]


def generate_briefing(tasks):
    """Generate morning briefing from tasks"""
    pending = [t for t in tasks if t['status'] == 'pending']
    completed = [t for t in tasks if t['status'] == 'completed']
    
    # Calculate stats by category
    stats = {}
    for category in ['work', 'personal', 'side-projects']:
        cat_pending = [t for t in pending if t['category'] == category]
        cat_completed = [t for t in completed if t['category'] == category]
        stats[category] = {
            'pending': len(cat_pending),
            'completed': len(cat_completed),
            'total': len(cat_pending) + len(cat_completed)
        }
    
    # Get top priorities
    top_tasks = prioritize_tasks(tasks, limit=5)
    
    briefing = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'stats': {
            'total_pending': len(pending),
            'total_completed': len(completed),
            'by_category': stats
        },
        'top_priorities': [
            {
                'text': t['text'],
                'category': t['category'],
                'priority_score': t['priority']['score'],
                'quadrant': t['priority']['quadrant'],
                'impact': t['priority']['impact'],
                'urgency': t['priority']['urgency'],
                'effort': t['priority']['effort']
            }
            for t in top_tasks
        ]
    }
    
    return briefing


def generate_evening_review(tasks):
    """Generate evening review"""
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Separate completed and pending
    completed_today = [t for t in tasks if t['status'] == 'completed']
    pending = [t for t in tasks if t['status'] == 'pending']
    
    # Calculate priority for pending tasks first
    for task in pending:
        task['priority'] = calculate_priority(task)
    
    # Analyze why tasks weren't completed (basic analysis)
    carry_forward = []
    for task in pending:
        reason = "Not started"
        if 'urgent' in task['text'].lower() or 'today' in task['text'].lower():
            reason = "Time ran out"
        elif task.get('priority', {}).get('effort', 3) >= 4:
            reason = "Larger task than expected"
        
        carry_forward.append({
            'task': task,
            'reason': reason
        })
    
    review = {
        'date': today,
        'completed_count': len(completed_today),
        'pending_count': len(pending),
        'completed_tasks': completed_today,
        'carry_forward': carry_forward
    }
    
    return review


def generate_time_blocks(tasks):
    """Suggest time blocks for tasks"""
    pending = [t for t in tasks if t['status'] == 'pending']
    
    # Sort by priority
    prioritized = prioritize_tasks(tasks, limit=10)
    
    # Estimate time requirements
    blocks = []
    for task in prioritized:
        effort = task['priority']['effort']
        if effort == 1:
            duration = '15-30 min'
        elif effort == 2:
            duration = '30-60 min'
        elif effort == 3:
            duration = '60-90 min'
        else:
            duration = '90-120 min'
        
        blocks.append({
            'task': task['text'],
            'category': task['category'],
            'quadrant': task['priority']['quadrant'],
            'priority_score': task['priority']['score'],
            'suggested_duration': duration,
            'best_time': 'Morning' if task['priority']['impact'] >= 4 else 'Afternoon'
        })
    
    return blocks


def print_briefing(briefing):
    """Print formatted briefing"""
    print("📅 DAILY BRIEFING")
    print(f"Date: {briefing['date']}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    
    # Stats
    stats = briefing['stats']
    print(f"📊 TODO Summary:")
    print(f"  • Total pending: {stats['total_pending']}")
    print(f"  • Total completed: {stats['total_completed']}")
    print()
    
    for category, cat_stats in stats['by_category'].items():
        if cat_stats['total'] > 0:
            print(f"  • {category.title()}: {cat_stats['pending']} pending (of {cat_stats['total']})")
    print()
    
    # Top priorities
    print("🎯 TOP PRIORITIES:")
    for i, task in enumerate(briefing['top_priorities'], 1):
        quadrant_emoji = {
            'Q1': '🔥',
            'Q2': '📅',
            'Q3': '↗️',
            'Q4': '🗑️'
        }.get(task['quadrant'], '•')
        
        print(f"{i}. {quadrant_emoji} {task['text']}")
        print(f"   Category: {task['category']} | Score: {task['priority_score']} | Quadrant: {task['quadrant']}")
        print(f"   Impact: {task['impact']}/5 | Urgency: {task['urgency']}/5 | Effort: {task['effort']}/5")
        print()
    
    print("💡 Focus on Q1 (Do First) and Q2 (Schedule) tasks for maximum impact!")


def main():
    parser = argparse.ArgumentParser(description='Analyze TODOs and generate planning insights')
    parser.add_argument('--action', choices=['prioritize', 'briefing', 'review', 'timeblock'],
                       default='briefing', help='Action to perform')
    parser.add_argument('--date', default='today', help='Date filter (today, yesterday, YYYY-MM-DD)')
    parser.add_argument('--limit', type=int, default=10, help='Maximum number of tasks to return')
    parser.add_argument('--format', choices=['text', 'json'], default='text', help='Output format')
    parser.add_argument('--category', choices=['work', 'personal', 'side-projects'],
                       help='Filter by category')
    
    args = parser.parse_args()
    
    # Parse all TODOs
    tasks = parse_todos()
    
    # Filter by category if specified
    if args.category:
        tasks = [t for t in tasks if t['category'] == args.category]
    
    # Perform action
    result = None
    if args.action == 'prioritize':
        result = prioritize_tasks(tasks, args.limit)
    elif args.action == 'briefing':
        result = generate_briefing(tasks)
    elif args.action == 'review':
        result = generate_evening_review(tasks)
    elif args.action == 'timeblock':
        result = generate_time_blocks(tasks)
    
    # Output result
    if result is None:
        print("Error: Could not generate result", file=sys.stderr)
        sys.exit(1)
    
    if args.format == 'json':
        print(json.dumps(result, indent=2))
    else:
        if args.action == 'briefing':
            print_briefing(result)
        elif args.action == 'prioritize':
            print(f"🎯 TOP {len(result)} PRIORITIES:\n")
            for i, task in enumerate(result, 1):
                p = task.get('priority', {})
                print(f"{i}. [{task.get('category', 'unknown')}] {task.get('text', '')}")
                quadrant = p.get('quadrant', '?')
                print(f"   Score: {p.get('score', 0)} | Q{quadrant} | I:{p.get('impact', 0)} U:{p.get('urgency', 0)} E:{p.get('effort', 0)}")
                print()
        elif args.action == 'review':
            print(f"🌅 EVENING REVIEW\n")
            print(f"Completed today: {result.get('completed_count', 0)}")
            print(f"Carrying forward: {result.get('pending_count', 0)}\n")
            print("Tasks to continue tomorrow:")
            for item in result.get('carry_forward', []):
                task = item.get('task', {})
                print(f"  • {task.get('text', '')}")
                print(f"    Reason: {item.get('reason', '')}")
        elif args.action == 'timeblock':
            print(f"⏰ SUGGESTED TIME BLOCKS\n")
            for block in result:
                print(f"🕐 {block.get('suggested_duration', '')}: {block.get('task', '')}")
                print(f"   [{block.get('category', '')}] Best time: {block.get('best_time', '')}")
                print(f"   Priority: {block.get('priority_score', 0)} | Quadrant: {block.get('quadrant', '')}")
                print()


if __name__ == '__main__':
    main()
