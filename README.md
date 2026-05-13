# Config Secrets

[![Test](https://github.com/lee5i3/config-secrets/actions/workflows/test.yml/badge.svg)](https://github.com/lee5i3/config-secrets/actions/workflows/test.yml)
[![Lint](https://github.com/lee5i3/config-secrets/actions/workflows/lint.yml/badge.svg)](https://github.com/lee5i3/config-secrets/actions/workflows/lint.yml)

A plug-in for the [config](https://www.npmjs.com/package/config) module that adds support for Docker secrets alongside standard environment variables.

## What it does

`config-secrets` extends the `config` module so that values in your `custom-environment-variables` config file are resolved against both Docker secrets (files in the secrets directory) **and** process environment variables. Environment variables take precedence over secrets, so you can always override a secret with an env var at runtime.

## Installing

```
npm install config-secrets
```

## Usage

Replace your `require('config')` call with `require('config-secrets')`. The returned object is the fully-configured `config` instance.

```js
const config = require('config-secrets');

console.log(config.get('db.password'));
```

The helper functions are also exported for use in tests or custom tooling:

```js
const { getSecrets, parseSecretsAndEnv } = require('config-secrets');
```

## Configuration

### `SECRET_PATH`

Set this environment variable to change the directory where Docker secrets are read from. Defaults to `/run/secrets`.

```
SECRET_PATH=/my/secrets/dir node app.js
```

### `custom-environment-variables` file

You still need a `custom-environment-variables` file in your `config/` folder. The environment variable names in that file are used as the secret file names too.

```yaml
# config/custom-environment-variables.yml
default:
  service:
    port: "PORT"
  db:
    password: "DB_PASSWORD"
```

With the above config, `config-secrets` will look for a file named `DB_PASSWORD` inside `SECRET_PATH` and use its contents as `db.password`. If the `DB_PASSWORD` environment variable is also set, it takes precedence.

## Notes

- Environment variables take precedence over Docker secrets.
- If `SECRET_PATH` does not exist or is empty, secrets resolution is skipped gracefully.

## v1.1.0 changes

- Fixed global scope leaks: `getSecrets` and `parseSecretsAndEnv` were accidentally assigned to the global scope (missing `const`). Both are now properly scoped.
- Fixed incorrect `this` reference inside a `forEach` callback in `parseSecretsAndEnv` (was `this.getSecrets()`, now `getSecrets()`).
- Removed duplicate `var` declaration for `environmentSubstitutions`.
- Rewrote `index.js` using `'use strict'`, `const`/`let` throughout.
- Added named exports `getSecrets` and `parseSecretsAndEnv` so they can be unit-tested independently.
- Added Jest tests, ESLint configuration, and GitHub Actions workflows for CI.
