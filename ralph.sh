#!/bin/bash
set -e

# Usage: ../ralph/ralph.sh [max_iterations] [prompt_name]
# Example: ../ralph/ralph.sh 10 backend

MAX_ITERATIONS=${1:-10}
PROMPT_NAME=${2:-backend}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompts/${PROMPT_NAME}.md"
ITERATION=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: Prompt file not found: $PROMPT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Starting Ralph loop (max $MAX_ITERATIONS iterations)${NC}"
echo -e "${GREEN}Using prompt: $PROMPT_FILE${NC}"

if [ ! -d .git ]; then
    git init
    git add -A
    git commit -m "Initial commit" || true
fi

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Iteration $ITERATION of $MAX_ITERATIONS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    START_TIME=$(date +%s)

    claude --dangerously-skip-permissions \
           --print \
           -p "$(cat "$PROMPT_FILE")"

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo -e "${GREEN}Iteration completed in ${DURATION}s${NC}"

    if [ -f ".ralph_complete" ]; then
        echo -e "${GREEN}Ralph signaled completion!${NC}"
        rm .ralph_complete
        break
    fi

    if [ -n "$(git status --porcelain)" ]; then
        git add -A
        git commit -m "Ralph iteration $ITERATION" || true
    fi

    sleep 2
done

echo -e "${GREEN}Ralph loop finished after $ITERATION iterations${NC}"
