---
name: version-sync
description: Synchronize the version field across every package.json in the Prodigy Origin monorepo AND the sibling P-NP repo to a single target version. Bumps only — does not commit, tag, or push.
---

# Version Sync

## Overview

Prodigy Origin spans multiple packages that must share a single version number:

- `extension/package.json` (Plasmo-built Chrome extension)
- `originGUI/package.json` (mod menu bundle)
- `typings/package.json` (shared type definitions)
- `CITATION.cff` (academic citation metadata)
- `/home/alex/P-NP/package.json` (sibling repo — game patcher)
- `/home/alex/P-NP/src/constants.ts` (VERSION constant used at runtime)

This skill updates all of them in one go. It **only** edits version fields. Committing, tagging, and pushing are left to the caller.

## Usage

The caller passes a target version as an argument, e.g. `4.1.0` or `4.2.0-beta.1`. The skill validates semver shape, then runs the bump script.

**Invocation**:
```
bash /home/alex/ProdigyMathGameHacking/.claude/skills/version-sync/bump.sh <target-version>
```

## Behavior

1. Validates the target version matches `^\d+\.\d+\.\d+(-[\w.]+)?$`.
2. Edits the `"version"` field (top-level only, not nested) in each of the four package.json files.
3. Edits the `version:` field in `CITATION.cff`.
4. Edits the `VERSION` constant in `P-NP/src/constants.ts`.
5. Prints a diff summary of old → new for each file.
6. Exits non-zero if any file is missing or the regex fails.

## Constraints

- Never touches nested dependency version fields.
- Never modifies lock files (pnpm-lock.yaml) — the caller must run `pnpm install` afterward if lock refresh is wanted.
- Never commits, tags, or pushes. That is the caller's responsibility.
- Plasmo auto-picks the new version from extension/package.json on next `pnpm build`.
- P-NP needs a rebuild (`pnpm build && node dist/patch.js ./dist`) to bake the new VERSION into dist/game.min.js.
- originGUI bundle is rebuilt by the GitHub Actions `originGUI-build.yml` workflow on push.

## Paths

The targets are hardcoded in `bump.sh`:
- `/home/alex/ProdigyMathGameHacking/extension/package.json`
- `/home/alex/ProdigyMathGameHacking/originGUI/package.json`
- `/home/alex/ProdigyMathGameHacking/typings/package.json`
- `/home/alex/ProdigyMathGameHacking/CITATION.cff` (version: field)
- `/home/alex/P-NP/package.json`
- `/home/alex/P-NP/src/constants.ts` (VERSION constant)
