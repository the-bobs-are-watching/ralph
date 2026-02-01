# Ralph

Electron app for managing autonomous Claude agent loops.

## Quick Start

```bash
npm install
npm run dev
```

## How It Works

Ralph manages `.ralph/` folders in your projects with minimal config:

```
.ralph/
├── prd.json              # Features to implement
└── progress/
    └── features.txt      # Append-only progress log
```

Context comes from your existing project files (`CLAUDE.md`, `AGENTS.md`) - no duplication.

## PRD Format

```json
{
  "project": "my-project",
  "description": "What this project does",
  "features": [
    {
      "id": "F-001",
      "title": "Feature title",
      "description": "What it should do",
      "steps": ["Step 1", "Step 2"],
      "priority": 1,
      "passes": false
    }
  ]
}
```

## Loop Workflow

Each iteration, Claude:
1. Reads `CLAUDE.md`/`AGENTS.md` for context
2. Reads `.ralph/prd.json` for features
3. Picks highest-priority feature where `passes=false`
4. Implements it, runs tests, commits
5. Sets `passes=true`, appends to progress log
6. Outputs `<promise>COMPLETE</promise>` when all done

## Execution Modes

- **Docker sandbox** (default) - Isolated, safe for unattended runs
- **Direct CLI** - Faster, for supervised runs

## Commands

```bash
npm run dev        # Dev mode with hot reload
npm run build      # Build for production
npm run start      # Run built app
```
