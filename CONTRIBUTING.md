# Contributing

Thanks for taking the time to contribute. This document covers the minimum you need to know to land a change.

## Prerequisites

- **Node.js** ≥ 18 (matches the `engines` field in `package.json`).
- **[pre-commit](https://pre-commit.com/#install)** — installed locally so the git hook can run. The hook in `.husky/pre-commit` invokes it; without it, commits will be rejected with a link to the install docs.

## Getting started

```bash
git clone https://github.com/lee5i3/config-secrets.git
cd config-secrets
npm install        # also wires up husky's git hooks via the `prepare` script
pre-commit install # one-time: install the pre-commit framework's hook scripts
```

After this, every `git commit` runs `pre-commit run --all-files`, which executes the standard hygiene hooks (trailing whitespace, EOF, merge-conflict markers, JSON/YAML/AWS-credential checks) plus `npm run lint` and `npm test`.

## Running checks manually

```bash
npm run lint       # ESLint
npm test           # Jest (unit + integration across config v1–v4)
npm run coverage   # Jest with coverage report
pre-commit run --all-files   # full hook suite, same as the commit gate
```

## Project layout

```
lib/           runtime code
  index.js       entry point — requires the shim, promotes secrets, re-exports `config`
  secrets.js     reads SECRET_PATH, validates filenames, applies size cap
  util-shim.js   polyfills util.isArray/isDate/isRegExp for config v1/v2 compat
test/
  index.test.js       unit tests (fs mocked)
  integration.test.js end-to-end against real `config` versions 1–4
  util-shim.test.js   shim behavior on currently-running Node
```

## Pull requests

- Branch from `master`. Keep changes focused — one logical change per PR.
- Add or update tests for any behavior change. The Jest suite is fast (sub-second); use it.
- Apply one of these labels so [Release Drafter](https://github.com/release-drafter/release-drafter) categorizes the change correctly:
  - `feature` / `enhancement` — new behavior
  - `fix` / `bugfix` / `bug` — bug fixes
  - `chore` / `dependencies` / `refactor` — internal maintenance
  - `documentation` — docs only
- The CI workflow (`.github/workflows/ci.yaml`) must be green before merge.

## Reporting security issues

Don't open a public issue. See [SECURITY.md](SECURITY.md) for the disclosure process.

## Code style

- ESLint config lives in [eslint.config.js](eslint.config.js) — let `npm run lint` tell you what's wrong rather than guessing.
- CommonJS (`require` / `module.exports`) throughout; no ESM conversion.
- Prefer small, readable changes over clever ones. Comments should explain **why**, not what.
