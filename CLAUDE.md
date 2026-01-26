# Ralph - Claude Code Instructions

Autonomous agent loop using Docker Desktop sandboxes.

## Architecture

- `ralph.sh` - Loop script that invokes Claude via Docker sandbox
- `prompts/` - Agent instructions for each mode (backend/frontend)

## How It Works

Uses Docker Desktop's sandbox feature:
```bash
docker sandbox run claude --permission-mode acceptEdits -p "..."
```

Benefits:
- Working directory mounts at same path inside container
- Git config auto-injected
- Credentials stored in Docker volume
- Isolated execution environment

## Iteration Loop

Each iteration:
1. Invokes `docker sandbox run claude` with prompt
2. Claude reads specs, picks one task, implements it
3. Output displayed with verbose logging
4. Changes committed with "Ralph iteration N"
5. Sleeps 2s between iterations

## Commands

```bash
# Authenticate (first time)
docker sandbox run claude

# Run backend loop
./ralph.sh 10 backend

# Run frontend loop
./ralph.sh 5 frontend
```

## Adding New Prompts

1. Create `prompts/newmode.md` with agent instructions
2. Run with `./ralph.sh 10 newmode`
