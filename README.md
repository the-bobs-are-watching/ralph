# Ralph

Electron app for running Claude in autonomous loops on your projects.

## Prerequisites

- **Node.js 18+**
- **Docker Desktop 4.50+** with beta features enabled (for sandboxed runs)
- Run `docker sandbox run claude` once to authenticate

## Quick Start

```bash
# Install and run
npm install
npm run dev
```

## How to Use

### 1. Add a Project

Click **+ Add Project** and select a folder. Ralph creates:

```
your-project/
├── .ralph/
│   ├── prd.json                 # Features to implement
│   └── progress/
│       └── features.txt         # Work log (Claude appends here)
├── CLAUDE.md                    # Your project context (Claude reads this)
└── src/
```

### 2. Define Features

In the **PRD** tab, add features you want Claude to implement:

- **Title**: Short name
- **Description**: What it should do
- **Steps**: Implementation steps (optional)
- **Priority**: Lower = done first

### 3. Run the Loop

Click the **▶ Run** button. Each iteration, Claude will:

1. Read your `CLAUDE.md` for project context
2. Read recent git history
3. Pick the highest-priority incomplete feature
4. Implement it and write tests
5. Run tests and linting (must pass)
6. Commit with descriptive message
7. Mark the feature as complete
8. Log progress with learnings

The loop stops when all features are done or max iterations reached.

### 4. Monitor Progress

- **Output** tab: Live Claude output
- **Progress** tab: Append-only work log
- **Context** tab: View/edit your project's `CLAUDE.md`

## Settings

| Setting | Description |
|---------|-------------|
| **Max iterations** | Stop after N iterations (cost control) |
| **Use Docker sandbox** | On = isolated/safe, Off = faster but less safe |

## PRD Format

```json
{
  "project": "my-app",
  "description": "What this project does",
  "features": [
    {
      "id": "F-001",
      "title": "Add user authentication",
      "description": "Login/logout with JWT tokens",
      "steps": ["Create auth context", "Add login form"],
      "priority": 1,
      "passes": false
    }
  ]
}
```

- `passes: false` = not done
- `passes: true` = complete (Claude sets this after tests pass)

## Tips

- **Write good CLAUDE.md**: Include stack, conventions, commands. Claude reads this every iteration.
- **Small features**: Break work into small pieces. One feature = one iteration.
- **Let tests verify**: Claude won't mark complete unless tests pass.
- **Watch the first run**: Use Docker off for faster iteration while supervising.

## Development

```bash
npm run dev        # Dev mode with hot reload
npm run build      # Build for production
npm run start      # Run built app
```
