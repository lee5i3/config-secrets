// Type declarations for config-secrets.
//
// The library re-exports the node-config singleton unchanged — secrets from
// SECRET_PATH (default /run/secrets) are promoted to process.env at load
// time, then standard node-config env-var substitution does the rest.
// TypeScript consumers should also install `@types/config` so the `IConfig`
// surface resolves.

import { IConfig } from 'config';

declare const configSecrets: IConfig;
export = configSecrets;
