# Ralph

Autonomous development agent that runs Claude Code in a loop using Docker Desktop sandboxes.

Based on [Geoffrey Huntley's Ralph technique](https://www.aihero.dev/getting-started-with-ralph).

## Prerequisites

- **Docker Desktop 4.50+** with beta features enabled
- Run `docker sandbox run claude` once to authenticate

## Quick Start

```bash
# 1. Authenticate (first time only)
docker sandbox run claude

# 2. Create your PRD in the project
cd ~/project/backend
claude  # Use Shift+Tab for plan mode, save as PRD.md

# 3. Create empty progress file
touch progress.txt

# 4. Run Ralph
/path/to/ralph/ralph.sh 10 backend
```

## Usage

```bash
./ralph.sh [max_iterations] [prompt_name]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `max_iterations` | 10 | Maximum Claude invocations |
| `prompt_name` | backend | Prompt to use (`backend` or `frontend`) |

## How It Works

1. Ralph reads `PRD.md` (requirements) and `progress.txt` (work log)
2. Finds the next unchecked item in PRD.md
3. Implements it, runs tests
4. Checks off the item in PRD.md
5. Appends to progress.txt
6. Commits changes
7. Repeats until done or max iterations

## Project Setup

```
your-project/
├── PRD.md           # Requirements with checkboxes
├── progress.txt     # Work log (created empty, Ralph appends)
├── CLAUDE.md        # Project conventions
└── src/
```

## PRD Format

```markdown
# Project Name

## Overview
What you're building.

## Features
- [ ] Feature 1: description
- [ ] Feature 2: description
- [ ] Feature 3: description

## API Endpoints
- [ ] POST /api/users - Create user
- [ ] GET /api/users/:id - Get user
```

Ralph checks off items as it completes them.

## Files

```
ralph/
├── ralph.sh             # Main script
└── prompts/
    ├── backend.md       # Backend agent instructions
    └── frontend.md      # Frontend agent instructions
```

## Stopping

- `Ctrl+C` to stop the loop
- Ralph stops automatically when all PRD items are checked

## Sources

- [Getting Started With Ralph](https://www.aihero.dev/getting-started-with-ralph)
- [Docker Sandboxes Docs](https://docs.docker.com/ai/sandboxes/)
