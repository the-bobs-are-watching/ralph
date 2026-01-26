#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MAX_ITERATIONS=${1:-10}
PROMPT_NAME=${2:-backend}
TARGET_DIR=$(pwd)

if [ "$PROMPT_NAME" = "frontend" ]; then
    IMAGE_NAME="ralph-frontend"
    DOCKERFILE="Dockerfile.frontend"
else
    IMAGE_NAME="ralph-backend"
    DOCKERFILE="Dockerfile.backend"
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

GIT_USER_NAME="${GIT_USER_NAME:-$(git config --global user.name 2>/dev/null || echo 'Ralph')}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-$(git config --global user.email 2>/dev/null || echo 'ralph@localhost')}"

if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo "Building $IMAGE_NAME..."
    docker build -t "$IMAGE_NAME" -f "$SCRIPT_DIR/$DOCKERFILE" "$SCRIPT_DIR"
fi

echo "Starting Ralph ($PROMPT_NAME) in Docker sandbox"

docker run --rm -it \
    -v "$TARGET_DIR:/workspace" \
    -v "$SCRIPT_DIR:/ralph:ro" \
    -e "ANTHROPIC_API_KEY" \
    -e "GIT_AUTHOR_NAME=$GIT_USER_NAME" \
    -e "GIT_AUTHOR_EMAIL=$GIT_USER_EMAIL" \
    -e "GIT_COMMITTER_NAME=$GIT_USER_NAME" \
    -e "GIT_COMMITTER_EMAIL=$GIT_USER_EMAIL" \
    -u "$(id -u):$(id -g)" \
    -w /workspace \
    "$IMAGE_NAME" \
    /bin/bash -c "git config --global user.name '$GIT_USER_NAME' && \
                  git config --global user.email '$GIT_USER_EMAIL' && \
                  /ralph/ralph.sh $MAX_ITERATIONS $PROMPT_NAME"
