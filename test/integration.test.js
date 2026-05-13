'use strict';

// End-to-end against the real `config` module, parameterised over every
// supported major via aliased dev-deps (config-vN → npm:config@^N).
// Fixtures live in test/fixtures/.

const fs = require('fs');
const os = require('os');
const path = require('path');

// Patch util.* before any legacy `config` major loads (config@1/@2 need it).
require('../lib/util-shim');

const CONFIG_VERSIONS = [
  ['config@1', 'config-v1'],
  ['config@2', 'config-v2'],
  ['config@3', 'config-v3'],
  ['config@4', 'config-v4'],
];

// --- Fixture helpers -------------------------------------------------------

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SHARED_CONFIG_FIXTURE = path.join(FIXTURES_DIR, 'config');
const SECRET_SCENARIOS_DIR = path.join(FIXTURES_DIR, 'secret-scenarios');

const loadSecretScenario = (name, destSecretsDir) => {
  const source = path.join(SECRET_SCENARIOS_DIR, name);
  fs.cpSync(source, destSecretsDir, { recursive: true });
};

const loadConfigFixture = (name) =>
  JSON.parse(fs.readFileSync(path.join(SHARED_CONFIG_FIXTURE, name), 'utf8'));

const DEFAULT_CONFIG = loadConfigFixture('default.json');
const CUSTOM_ENV_VARS = loadConfigFixture('custom-environment-variables.json');

// --- Suite -----------------------------------------------------------------

for (const [label, alias] of CONFIG_VERSIONS) {
  describe(`integration: config-secrets + real \`config\` (${label})`, () => {
    let tmpRoot;
    let configDir;
    let secretsDir;

    // Temp tree isolated from /run/secrets and any host config/.
    beforeAll(() => {
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), `config-secrets-it-${alias}-`));
      configDir = path.join(tmpRoot, 'config');
      secretsDir = path.join(tmpRoot, 'secrets');
      fs.mkdirSync(secretsDir);
      fs.cpSync(SHARED_CONFIG_FIXTURE, configDir, { recursive: true });
    });

    afterAll(() => {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    // Reset the singleton + swap `config` to the aliased major for this row.
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('config', () => require(alias));
      process.env.NODE_CONFIG_DIR = configDir;
      process.env.SECRET_PATH = secretsDir;
      // Silence node-config's "no config" and v4 strictness warnings.
      process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
      process.env.SUPPRESS_STRICTNESS_CHECK = 'true';
    });

    afterEach(() => {
      jest.dontMock('config');
      delete process.env.NODE_CONFIG_DIR;
      delete process.env.SECRET_PATH;
      delete process.env.SUPPRESS_NO_CONFIG_WARNING;
      delete process.env.SUPPRESS_STRICTNESS_CHECK;
      // Don't leak env state between tests.
      delete process.env[CUSTOM_ENV_VARS.db.password];
      delete process.env[CUSTOM_ENV_VARS.api.key];
      delete process.env[CUSTOM_ENV_VARS.flag];
      // Reset secretsDir for the next test.
      for (const entry of fs.readdirSync(secretsDir)) {
        fs.rmSync(path.join(secretsDir, entry), { recursive: true, force: true });
      }
    });

    test('falls through to default.json when no secret or env var is set', () => {
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe(DEFAULT_CONFIG.db.password);
      expect(config.get('api.key')).toBe(DEFAULT_CONFIG.api.key);
      expect(config.get('flag')).toBe(DEFAULT_CONFIG.flag);
    });

    test('resolves a Docker-style secret file into config.get()', () => {
      loadSecretScenario('with-db-password', secretsDir);
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe('secret-from-file');
    });

    test('strips a trailing newline from secret files', () => {
      loadSecretScenario('with-api-key-newline', secretsDir);
      const config = require('../lib/index');
      expect(config.get('api.key')).toBe('apikey-with-newline');
    });

    test('env var takes precedence over a secret file', () => {
      loadSecretScenario('with-db-password', secretsDir);
      process.env[CUSTOM_ENV_VARS.db.password] = 'value-from-env';
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe('value-from-env');
    });

    test('mixes sources cleanly: one secret, one env, one default', () => {
      loadSecretScenario('with-db-password', secretsDir);
      process.env[CUSTOM_ENV_VARS.api.key] = 'api-from-env';
      // `flag` has neither a secret nor an env var; default.json should win.
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe('secret-from-file');
      expect(config.get('api.key')).toBe('api-from-env');
      expect(config.get('flag')).toBe(DEFAULT_CONFIG.flag);
    });

    test('handles a missing secrets directory without throwing', () => {
      process.env.SECRET_PATH = path.join(tmpRoot, 'does-not-exist');
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe(DEFAULT_CONFIG.db.password);
    });

    test('skips directory entries inside the secrets dir', () => {
      // Empty dirs don't track in git, so we create it inline rather than as a fixture.
      fs.mkdirSync(path.join(secretsDir, CUSTOM_ENV_VARS.db.password));
      const config = require('../lib/index');
      expect(config.get('db.password')).toBe(DEFAULT_CONFIG.db.password);
    });

    test('exports the node-config singleton, not a wrapper', () => {
      loadSecretScenario('with-db-password', secretsDir);
      const exported = require('../lib/index');
      expect(typeof exported.get).toBe('function');
      expect(typeof exported.has).toBe('function');
      expect(exported.get('db.password')).toBe('secret-from-file');
    });
  });
}
