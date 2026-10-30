#!/usr/bin/env bash
# Create or update Aiden's Mesh / Minima repository and configure GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")"

repo_owner="aiden-azarnoush"
repo_name="mesh-minima"
repo="$repo_owner/$repo_name"
repo_url="https://github.com/$repo"
site_url="https://$repo_owner.github.io/$repo_name/"
description="Interactive 3D optimization visualizer: explore gradient descent, conjugate gradient, BFGS and Newton methods on custom functions."

for tool in git gh; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing $tool. Install Git and GitHub CLI, then run this script again." >&2
    exit 1
  fi
done
for file in index.html app.js optimizer.js style.css README.md LICENSE; do
  if [[ ! -f "$file" ]]; then
    echo "Missing $file. Unzip the complete Mesh / Minima package before publishing." >&2
    exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not signed in. Run: gh auth login" >&2
  exit 1
fi
if ! account="$(gh api user --jq .login)"; then
  echo "Could not verify the GitHub account. Check your connection and run: gh auth login" >&2
  exit 1
fi
if [[ "$(printf '%s' "$account" | tr '[:upper:]' '[:lower:]')" != "$repo_owner" ]]; then
  echo "Signed in as $account, but this project is configured for $repo_owner." >&2
  echo "Switch accounts with: gh auth switch" >&2
  exit 1
fi
if [[ -z "$(git config user.name || true)" || -z "$(git config user.email || true)" ]]; then
  echo "Configure your Git name and email before publishing:" >&2
  echo '  git config --global user.name "Your Name"' >&2
  echo '  git config --global user.email "you@example.com"' >&2
  exit 1
fi

# Never attach this folder to an unrelated remote or overwrite an existing repo.
origin=""
if [[ -d .git ]]; then
  origin="$(git remote get-url origin 2>/dev/null || true)"
  branch="$(git symbolic-ref --quiet --short HEAD || true)"
  if [[ "$branch" != main ]]; then
    echo "This folder is on branch '${branch:-detached HEAD}'. Switch to main before publishing." >&2
    exit 1
  fi
elif [[ -e .git ]]; then
  echo "This folder uses a Git worktree. Publish from a regular checkout instead." >&2
  exit 1
fi
if [[ -n "$origin" ]]; then
  case "$origin" in
    "https://github.com/$repo"|"https://github.com/$repo.git"|"git@github.com:$repo"|"git@github.com:$repo.git"|"ssh://git@github.com/$repo"|"ssh://git@github.com/$repo.git") ;;
    *) echo "Origin points to a different repository: $origin. Stopping." >&2; exit 1 ;;
  esac
elif gh repo view "$repo" >/dev/null 2>&1; then
  echo "$repo already exists. Clone that repository before updating it." >&2
  exit 1
fi

if [[ ! -d .git ]]; then git init -b main; fi
git add .
if ! git diff --cached --quiet; then
  git commit -m "Update Mesh / Minima optimization visualizer"
elif ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "There is nothing to commit." >&2
  exit 1
fi

if [[ -z "$origin" ]]; then
  echo "Creating public repository $repo and uploading files..."
  gh repo create "$repo" --public --source=. --remote=origin --push --description "$description"
else
  echo "Uploading updates to $repo..."
  git push -u origin main
fi

echo "Setting the description, website link, and repository topics..."
gh repo edit "$repo" --description "$description" --homepage "$site_url" \
  --add-topic optimization --add-topic numerical-optimization \
  --add-topic gradient-descent --add-topic conjugate-gradient --add-topic bfgs \
  --add-topic newton-method --add-topic scientific-visualization \
  --add-topic 3d-visualization --add-topic javascript --add-topic github-pages

echo "Configuring GitHub Pages..."
pages_source="$(gh api "repos/$repo/pages" --jq '(.source.branch // "") + ":" + (.source.path // "")' 2>/dev/null || true)"
if [[ "$pages_source" == "main:/" ]]; then
  echo "GitHub Pages already uses main / (root)."
elif [[ -n "$pages_source" ]]; then
  if ! printf '%s' '{"build_type":"legacy","source":{"branch":"main","path":"/"}}' | gh api --method PUT "repos/$repo/pages" --input - >/dev/null; then
    echo "Repository uploaded, but Pages could not be configured. In Settings → Pages, select Deploy from a branch, main, / (root)." >&2
    exit 1
  fi
else
  if ! printf '%s' '{"build_type":"legacy","source":{"branch":"main","path":"/"}}' | gh api --method POST "repos/$repo/pages" --input - >/dev/null; then
    echo "Repository uploaded, but Pages could not be configured. In Settings → Pages, select Deploy from a branch, main, / (root), or rerun this script." >&2
    exit 1
  fi
fi

echo
echo "Repository: $repo_url"
echo "Website:    $site_url"
echo "Pages settings: $repo_url/settings/pages"
echo "GitHub Pages may take a few minutes to finish building. Check the Pages settings if the site is not available yet."
