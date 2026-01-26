#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER=gotrippin
REMOTE_HOST=91.196.124.73
REMOTE_PORT=1022
REMOTE_ROOT=/home/gotrippin/app
SSH_KEY="$HOME/.ssh/gotrippin_terminal"

SSH="ssh -i $SSH_KEY -p $REMOTE_PORT"
RSYNC="rsync -az --delete -e \"$SSH\""

cd /mnt/d/Coding/gotrippin

# Build (shared core first)
npm --workspace @gotrippin/core run build
npm --workspace backend run build
npm --workspace web run build

# Upload backend dist
eval $RSYNC "apps/backend/dist/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_ROOT/apps/backend/dist/"

# Upload web artifacts (Next standalone)
eval $RSYNC "apps/web/.next/standalone/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_ROOT/apps/web/.next/standalone/"
eval $RSYNC "apps/web/.next/static/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_ROOT/apps/web/.next/static/"
eval $RSYNC "apps/web/public/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_ROOT/apps/web/public/"

# Fix Next standalone static symlink (safe to re-run)
$SSH "$REMOTE_USER@$REMOTE_HOST" \
  "cd $REMOTE_ROOT/apps/web/.next/standalone/apps/web && mkdir -p .next && rm -rf .next/static && ln -s $REMOTE_ROOT/apps/web/.next/static .next/static && rm -rf public && ln -s $REMOTE_ROOT/apps/web/public public"

echo "Upload done. Now restart apps in cPanel."
