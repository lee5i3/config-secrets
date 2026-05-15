# Security Policy

## Supported Versions

Only the latest published major version of `config-secrets` receives security fixes. If you're on an older major, please upgrade before reporting.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Use GitHub's [private vulnerability reporting](https://github.com/lee5i3/config-secrets/security/advisories/new) to send a report. Include:

- The version of `config-secrets` affected.
- A minimal reproduction (filesystem layout, env vars, `config` module version).
- The observed impact (information disclosure, RCE, DoS, etc.).
- Any suggested remediation, if you have one.

Coordinated disclosure is preferred — please give us a reasonable window to ship a fix before any public writeup.

## Scope

In scope:

- The `lib/` runtime: secret-file reading, env var promotion, the `util` shim.
- Documented configuration (`SECRET_PATH`, `SECRET_PATH_FOLLOW_SYMLINKS`).

Out of scope:

- Vulnerabilities in upstream `config` (report those to [node-config](https://github.com/node-config/node-config)).
- Issues that require write access to the secrets directory by an untrusted party — the secrets dir is assumed to be controlled by the same trust boundary as the Node process. We still apply defense-in-depth (filename allowlist, deny list of dangerous env-var names, size cap), and bypasses of those defenses are in scope.
