#!/usr/bin/env python3
"""Fix the ai_worker function indentation"""
import re

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the ai_worker function
in_function = False
function_start = None
for i, line in enumerate(lines):
    if '    def ai_worker():' in line:
        function_start = i
        in_function = True
        break

if not function_start:
    print("Could not find ai_worker function")
    exit(1)

# Find the end of the function (next def at same or lower indentation)
function_end = None
for i in range(function_start + 1, len(lines)):
    # Check if we hit the next function or end
    if lines[i].startswith('    # Run in background thread'):
        function_end = i
        break

if not function_end:
    print("Could not find end of ai_worker function")
    exit(1)

# Now fix the function
# Replace the function start
lines[function_start] = '    def ai_worker():\n'
lines[function_start + 1] = '        with app.app_context():\n'

# Indent all lines between start+2 and end by 4 spaces (except blank lines)
for i in range(function_start + 2, function_end):
    line = lines[i]
    if line.strip():  # Not a blank line
        # Add 4 spaces to the beginning
        lines[i] = '    ' + line

# Write back
with open('app.py', 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(lines)

print(f"Fixed indentation from line {function_start} to {function_end}")
