#!/usr/bin/env bash
# Best-effort, idempotent installer for the GitHub Copilot CLI and the
# hve-core-all plugin (https://github.com/microsoft/hve-core).
#
# This script is intentionally NON-FATAL: every step is allowed to fail
# without aborting the caller (dev container / cloud sandbox setup), so a
# missing network connection or an unauthenticated Copilot CLI must not
# block the environment from starting.
set -euo pipefail

echo "==> Ensuring GitHub Copilot CLI is installed"
command -v copilot >/dev/null 2>&1 || npm install -g @github/copilot || echo "::warning::copilot CLI install failed"

echo "==> Adding hve-core marketplace"
copilot plugin marketplace add microsoft/hve-core || echo "::warning::marketplace add failed"

echo "==> Installing hve-core-all plugin"
copilot plugin install hve-core-all@hve-core || echo "::warning::hve-core-all install failed"

echo "==> Installed Copilot CLI plugins"
copilot plugin list || true
