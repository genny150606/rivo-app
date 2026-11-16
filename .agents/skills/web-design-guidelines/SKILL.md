---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source (Bundled Offline Copy)

Read the locally bundled rules in `references/command.md` before each review (synced from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` — no external fetch or global install required).

## Usage

When reviewing UI files or patterns:
1. Read `references/command.md` in full
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings in terse `file:line` format

If no files specified, ask the user which files to review.
