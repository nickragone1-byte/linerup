#!/bin/bash
# ============================================================
#  Linerup NBA Deployment Script
#  Run from inside ~/Desktop/linerup AFTER extracting the tarball
# ============================================================
set -e

REPO_ROOT="$HOME/Desktop/linerup"
cd "$REPO_ROOT"

echo "=== Step 1: Verifying file placement ==="
for f in \
  lib/types-nba.ts \
  lib/tier-nba.ts \
  lib/display-tier-nba.ts \
  lib/narrative-nba.ts \
  lib/data-nba.ts \
  app/components/HeroCardNBA.tsx \
  app/components/LeanCardNBA.tsx \
  app/components/HowItWorksNBA.tsx \
  app/nba/page.tsx \
  public/data/nba/predictions.json
do
  if [ -f "$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ MISSING: $f"
    exit 1
  fi
done

echo ""
echo "=== Step 2: Local build test ==="
echo "(this catches any TypeScript errors before you push)"
npm run build

echo ""
echo "=== Step 3: Git commit ==="
git add lib/ app/ public/data/nba/
git status

echo ""
echo "Review the changes above. Ready to commit? (y/n)"
read -r CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Aborted. Run 'git status' to see staged changes."
  exit 0
fi

git commit -m "Deploy NBA V6 — 67.97% validated OOS, inaugural pick Detroit -4.5"
echo ""
echo "=== Step 4: Push to GitHub (triggers Vercel deploy) ==="
echo "Ready to push? (y/n)"
read -r CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Commit saved locally. Run 'git push' when ready."
  exit 0
fi

git push

echo ""
echo "=========================================="
echo "  ✓ NBA DEPLOYED"
echo "  Vercel will rebuild in ~2 minutes."
echo "  Check: https://linerup.bet/nba"
echo "=========================================="
