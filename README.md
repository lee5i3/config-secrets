# Config Secrets

[![CI](https://github.com/lee5i3/config-secrets/actions/workflows/ci.yaml/badge.svg)](https://github.com/lee5i3/config-secrets/actions/workflows/ci.yaml)

A plug-in for the [config](https://www.npmjs.com/package/config) module that adds support for Docker secrets alongside standard environment variables.

## What it does

`config-secrets` extends the `config` module so that values in your `custom-environment-variables` config file are resolved against both Docker secrets (files in the secrets directory) **and** process environment variables. Environment variables take precedence over secrets, so you can always override a secret with an env var at runtime.

## Installing

```
npm install config-secrets
```

## Usage

Replace your `require('config')` call with `require('config-secrets')`. The returned object **is** the fully-configured `config` instance — every existing `config.get(...)` / `config.has(...)` keeps working, with secret files now resolved alongside env vars.

```js
const config = require('config-secrets');

console.log(config.get('db.password'));
```

Under the hood, importing `config-secrets` reads `SECRET_PATH` (default `/run/secrets`) and copies each file's contents into `process.env` before loading node-config. Existing env vars are never overwritten, so explicit env values always win over secret files.

## Configuration

### `SECRET_PATH`

Set this environment variable to change the directory where Docker secrets are read from. Defaults to `/run/secrets`.

```
SECRET_PATH=/my/secrets/dir node app.js
```

### `SECRET_PATH_FOLLOW_SYMLINKS`

By default `config-secrets` reads only **regular files** in `SECRET_PATH` — symlinks are skipped so a hostile symlink (e.g. one pointing at `/etc/passwd`) can't leak data from outside the secrets directory. Set this to `true` to opt in to following symlinks:

```
SECRET_PATH_FOLLOW_SYMLINKS=true node app.js
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

## TypeScript

TypeScript declarations ship with the package ([lib/index.d.ts](lib/index.d.ts)). Install `@types/config` alongside this package and the import is fully typed — `getSecrets()` and `parseSecretsAndEnv()` augment the standard node-config surface.

```ts
import config from 'config-secrets';
const password: string = config.get('db.password');
```

## Compatibility

### Node.js

Requires **Node.js 18 or newer**. Node 17 and earlier are not supported.

### `config`

Tested against every `config` major from **v1 through v4**. The library ships a small `util.is*` polyfill ([lib/util-shim.js](lib/util-shim.js)) so `config@1` and `config@2` keep working on Node 23+ — where Node removed the legacy `util.isRegExp` / `util.isDate` / `util.isArray` helpers those older versions still call directly. The shim is loaded automatically before `require('config')`; no consumer action required.

| `config` version | Status |
|------------------|--------|
| `^1`             | ✓ supported (via built-in polyfill) |
| `^2`             | ✓ supported (via built-in polyfill) |
| `^3`             | ✓ supported |
| `^4`             | ✓ supported |
