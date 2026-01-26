#!/bin/bash
set -e

# Usage: ./ralph.sh [max_iterations] [prompt_name]
# Example: ./ralph.sh 10 backend

MAX_ITERATIONS=${1:-10}
PROMPT_NAME=${2:-backend}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompts/${PROMPT_NAME}.md"
ITERATION=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: Prompt file not found: $PROMPT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Ralph Loop - $PROMPT_NAME${NC}"
echo -e "${GREEN}  Max iterations: $MAX_ITERATIONS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ ! -d .git ]; then
    git init
    git add -A
    git commit -m "Initial commit" || true
fi

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))

    echo ""
    echo -e "${YELLOW}┌──────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│  Iteration $ITERATION of $MAX_ITERATIONS${NC}"
    echo -e "${YELLOW}└──────────────────────────────────────────────┘${NC}"

    # Show current progress if file exists
    if [ -f "progress.txt" ]; then
        echo -e "${DIM}Current progress:${NC}"
        grep -E "^\s*-\s*\[[ x]\]" progress.txt 2>/dev/null | head -5 | sed 's/^/  /'
        echo ""
    fi

    START_TIME=$(date +%s)

    echo -e "${CYAN}▶ Claude is working...${NC}"
    echo ""

    docker sandbox run claude \
           --permission-mode acceptEdits \
           -p "$(cat "$PROMPT_FILE")"

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo -e "${GREEN}✓ Iteration completed in ${DURATION}s${NC}"

    # Check for completion signal
    if [ -f ".ralph_complete" ]; then
        echo -e "${GREEN}🎉 Ralph signaled completion!${NC}"
        rm .ralph_complete
        break
    fi

    # Show what changed and commit
    if [ -n "$(git status --porcelain)" ]; then
        echo ""
        echo -e "${CYAN}Files changed:${NC}"
        git status --porcelain | head -10 | while read -r line; do
            status="${line:0:2}"
            file="${line:3}"
            case "$status" in
                "A "*|"??") echo -e "  ${GREEN}+ $file${NC}" ;;
                "M "*|" M") echo -e "  ${YELLOW}~ $file${NC}" ;;
                "D "*|" D") echo -e "  ${RED}- $file${NC}" ;;
                *) echo -e "  $line" ;;
            esac
        done

        CHANGED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
        if [ "$CHANGED_COUNT" -gt 10 ]; then
            echo -e "  ${DIM}... and $((CHANGED_COUNT - 10)) more${NC}"
        fi

        git add -A
        git commit -m "Ralph iteration $ITERATION" || true

        echo -e "${DIM}Committed as: $(git log -1 --format='%h %s')${NC}"
    else
        echo -e "${DIM}No changes this iteration${NC}"
    fi

    sleep 2
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Ralph finished after $ITERATION iterations${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Show summary
echo ""
echo -e "${CYAN}Summary:${NC}"
git log --oneline -n $ITERATION 2>/dev/null | tac || true
