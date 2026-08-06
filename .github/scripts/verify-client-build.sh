#!/usr/bin/env bash
#
# Asserts that both client builds produced something Render can actually serve.
#
# `vite build` exits 0 for a React Router framework-mode app but never runs the
# SPA prerender step, so it emits assets with no index.html. Render then
# publishes a directory with no entry document and the deployed site silently
# serves nothing new. Exit code alone does not catch that, so check the
# artifacts the publish directory is pointed at.
set -euo pipefail

# Keep these paths in sync with each Render static site's Publish Directory.
PUBLISH_DIRS=(
  "apps/plain/client/build/client"
  "apps/gamified/client/build/client"
)

failed=0

for dir in "${PUBLISH_DIRS[@]}"; do
  echo "Checking ${dir}"

  if [ ! -d "$dir" ]; then
    echo "  FAIL: publish directory does not exist"
    failed=1
    continue
  fi

  if [ ! -f "${dir}/index.html" ]; then
    echo "  FAIL: no index.html — the SPA prerender step did not run."
    echo "        The client build script must be 'react-router build', not 'vite build'."
    failed=1
    continue
  fi

  # index.html must load the client entry, otherwise it renders a blank page.
  if ! grep -q 'assets/entry\.client-' "${dir}/index.html"; then
    echo "  FAIL: index.html does not reference an entry.client bundle"
    failed=1
    continue
  fi

  # The referenced entry bundle must exist on disk with the same hash.
  entry=$(grep -o 'assets/entry\.client-[A-Za-z0-9_-]*\.js' "${dir}/index.html" | head -1)
  if [ ! -f "${dir}/${entry}" ]; then
    echo "  FAIL: index.html references ${entry}, which is not in the build output"
    failed=1
    continue
  fi

  echo "  OK: index.html present and wired to ${entry}"
done

if [ "$failed" -ne 0 ]; then
  echo "Client build output is not deployable — see failures above."
  exit 1
fi

echo "All client builds are deployable."
