---
name: Bug report
about: Report a defect or unexpected behavior in config-secrets
title: "[Bug] "
labels: bug
assignees: ''
---

## Summary

A clear, concise description of the bug.

## Reproduction

Minimum steps to reproduce. A small repro repo or gist is hugely helpful.

```
1. ...
2. ...
3. ...
```

**Secrets directory layout** (file names + sizes, not contents):

```
/run/secrets/
├── db_password   (8 bytes)
└── ...
```

**Relevant `custom-environment-variables.json`** (redacted):

```json
{
  "db": { "password": "DB_PASSWORD" }
}
```

## Expected behavior

What you expected to happen.

## Actual behavior

What actually happened. Include the full error message and stack trace if there is one.

```
<paste error here>
```

## Environment

- `config-secrets` version:
- `config` version:
- Node.js version (`node --version`):
- OS:
- Runtime context (Docker, Kubernetes, bare metal):
- Relevant env vars (`SECRET_PATH`, `SECRET_PATH_FOLLOW_SYMLINKS`):

## Additional context

Anything else that might help — recent changes, suspected cause, links to related issues.

> ⚠️ **Do not paste real secret values, API keys, or credentials.** If the bug is security-sensitive, do not file a public issue — see [SECURITY.md](../../SECURITY.md) for private disclosure.
