---
name: Feature request
about: Suggest a new feature or enhancement for config-secrets
title: "[Feature] "
labels: enhancement
assignees: ''
---

## Problem

What problem are you trying to solve? What's the use case driving the request? Concrete examples beat abstract descriptions.

## Proposed solution

What you'd like `config-secrets` to do. If you have a specific API or env var in mind, sketch it here.

```js
// example of the proposed usage
```

## Alternatives considered

Other approaches you thought about (workarounds in user code, configuration tricks, forks). Why didn't they fit?

## Scope check

`config-secrets` aims to stay small: read Docker/Kubernetes secret files, promote them to `process.env`, and let upstream [`config`](https://www.npmjs.com/package/config) do the rest. Features that belong in `config` itself, in your application code, or in an orchestrator (Docker/K8s) are usually a poor fit here.

- [ ] This belongs in `config-secrets` specifically (not upstream `config`, not user code).
- [ ] It can be implemented without breaking existing or previous versions.
- [ ] It doesn't require fetching secrets from network sources (use Vault/SOPS/ASM for that).

## Additional context

Links, related issues, etc.
