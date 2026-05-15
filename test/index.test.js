'use strict';

// Two suites: getSecrets directly, and the module-load side effect in
// lib/index.js. fs is mocked in both.

// Builds a Dirent-shaped object for fs.readdirSync(..., { withFileTypes: true }).
const dirent = (name, { type = 'file' } = {}) => ({
  name,
  isFile: () => type === 'file',
  isDirectory: () => type === 'directory',
  isSymbolicLink: () => type === 'symlink',
});

describe('getSecrets', () => {
  let getSecrets;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('node:fs');
    ({ getSecrets } = require('../lib/secrets'));
    // Default size under the cap; size-cap tests override.
    const fsMock = require('node:fs');
    fsMock.statSync.mockReturnValue({ size: 100 });
  });

  afterEach(() => {
    delete process.env.SECRET_PATH;
    delete process.env.SECRET_PATH_FOLLOW_SYMLINKS;
  });

  test('returns empty object when the secrets directory does not exist', () => {
    const fsMock = require('node:fs');
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fsMock.readdirSync.mockImplementation(() => { throw err; });
    expect(getSecrets()).toEqual({});
  });

  test('rethrows non-ENOENT errors from readdirSync', () => {
    const fsMock = require('node:fs');
    const err = Object.assign(new Error('EACCES'), { code: 'EACCES' });
    fsMock.readdirSync.mockImplementation(() => { throw err; });
    expect(() => getSecrets()).toThrow('EACCES');
  });

  test('returns key->value pairs from files in the secrets directory', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('db_password'), dirent('api_key')]);
    fsMock.readFileSync.mockImplementation((path) => {
      if (path.includes('db_password')) return 'secret123';
      if (path.includes('api_key')) return 'myapikey';
      return null;
    });
    expect(getSecrets()).toEqual({ db_password: 'secret123', api_key: 'myapikey' });
  });

  test('strips a trailing newline from secret values (Docker/K8s convention)', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('token')]);
    fsMock.readFileSync.mockReturnValue('abcd1234\n');
    expect(getSecrets()).toEqual({ token: 'abcd1234' });
  });

  test('only strips a single trailing newline, not internal ones', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('multiline')]);
    fsMock.readFileSync.mockReturnValue('line1\nline2\n');
    expect(getSecrets()).toEqual({ multiline: 'line1\nline2' });
  });

  test('uses SECRET_PATH env var when set', () => {
    process.env.SECRET_PATH = '/custom/secrets';
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('token')]);
    fsMock.readFileSync.mockReturnValue('tokenvalue');
    getSecrets();
    expect(fsMock.readdirSync).toHaveBeenCalledWith('/custom/secrets', { withFileTypes: true });
  });

  test('defaults to /run/secrets when SECRET_PATH is not set', () => {
    delete process.env.SECRET_PATH;
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([]);
    getSecrets();
    expect(fsMock.readdirSync).toHaveBeenCalledWith('/run/secrets', { withFileTypes: true });
  });

  test('skips directories', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('subdir', { type: 'directory' }),
      dirent('my_secret'),
    ]);
    fsMock.readFileSync.mockReturnValue('value');
    const result = getSecrets();
    expect(result).not.toHaveProperty('subdir');
    expect(result).toHaveProperty('my_secret', 'value');
  });

  test('skips symlinks by default (defense against malicious symlinks)', () => {
    delete process.env.SECRET_PATH_FOLLOW_SYMLINKS;
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('shady_link', { type: 'symlink' }),
      dirent('real_secret'),
    ]);
    fsMock.readFileSync.mockReturnValue('value');
    const result = getSecrets();
    expect(result).not.toHaveProperty('shady_link');
    expect(result).toHaveProperty('real_secret', 'value');
  });

  test('follows symlinks when SECRET_PATH_FOLLOW_SYMLINKS=true', () => {
    process.env.SECRET_PATH_FOLLOW_SYMLINKS = 'true';
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('linked', { type: 'symlink' })]);
    fsMock.readFileSync.mockReturnValue('via-symlink');
    const result = getSecrets();
    expect(result).toHaveProperty('linked', 'via-symlink');
  });

  test('skips entries that disappear between readdir and readFile (ENOENT)', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('vanished')]);
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fsMock.readFileSync.mockImplementation(() => { throw err; });
    expect(getSecrets()).toEqual({});
  });

  test('skips files whose names are not valid env-var identifiers', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('.gitkeep'),
      dirent('README.md'),
      dirent('with-hyphen'),
      dirent('1leading_digit'),
      dirent('valid_name'),
    ]);
    fsMock.readFileSync.mockReturnValue('value');
    expect(getSecrets()).toEqual({ valid_name: 'value' });
  });

  test('skips dangerous env var names that would enable RCE or MITM', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('NODE_OPTIONS'),
      dirent('LD_PRELOAD'),
      dirent('NODE_TLS_REJECT_UNAUTHORIZED'),
      dirent('DYLD_INSERT_LIBRARIES'),
      dirent('SAFE_NAME'),
    ]);
    fsMock.readFileSync.mockReturnValue('payload');
    expect(getSecrets()).toEqual({ SAFE_NAME: 'payload' });
  });

  test('skips files larger than the size cap (defense against OOM)', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('huge_secret'),
      dirent('small_secret'),
    ]);
    fsMock.statSync.mockImplementation((p) => {
      if (String(p).includes('huge_secret')) return { size: 1024 * 1024 };
      return { size: 100 };
    });
    fsMock.readFileSync.mockReturnValue('value');
    expect(getSecrets()).toEqual({ small_secret: 'value' });
  });
});

describe('promote secrets to process.env (module-load side effect)', () => {
  // Tracks env vars set by individual tests so afterEach can clean them up.
  let envKeysSetByTest;

  beforeEach(() => {
    envKeysSetByTest = new Set();
    jest.resetModules();
    jest.mock('node:fs');
    // Stub `config` so it doesn't read NODE_CONFIG_DIR during tests.
    jest.mock('config', () => ({ util: {} }));
    // Default size under the cap.
    const fsMock = require('node:fs');
    fsMock.statSync.mockReturnValue({ size: 100 });
  });

  afterEach(() => {
    for (const key of envKeysSetByTest) delete process.env[key];
    delete process.env.SECRET_PATH;
  });

  test('promotes every secret in SECRET_PATH to process.env on module load', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([
      dirent('FROM_SECRET_A'),
      dirent('FROM_SECRET_B'),
    ]);
    fsMock.readFileSync.mockImplementation((p) => {
      if (String(p).includes('FROM_SECRET_A')) return 'value-a';
      if (String(p).includes('FROM_SECRET_B')) return 'value-b';
      return '';
    });
    envKeysSetByTest.add('FROM_SECRET_A').add('FROM_SECRET_B');

    require('../lib/index');

    expect(process.env.FROM_SECRET_A).toBe('value-a');
    expect(process.env.FROM_SECRET_B).toBe('value-b');
  });

  test('does NOT overwrite an env var that was already set (env wins)', () => {
    process.env.PRE_EXISTING = 'from-env';
    envKeysSetByTest.add('PRE_EXISTING');
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('PRE_EXISTING')]);
    fsMock.readFileSync.mockReturnValue('from-secret');

    require('../lib/index');

    expect(process.env.PRE_EXISTING).toBe('from-env');
  });

  test('strips trailing newline when promoting (no \\n leaks into process.env)', () => {
    const fsMock = require('node:fs');
    fsMock.readdirSync.mockReturnValue([dirent('CLEAN')]);
    fsMock.readFileSync.mockReturnValue('clean-value\n');
    envKeysSetByTest.add('CLEAN');

    require('../lib/index');

    expect(process.env.CLEAN).toBe('clean-value');
  });

  test('no-ops when the secrets directory does not exist', () => {
    const fsMock = require('node:fs');
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fsMock.readdirSync.mockImplementation(() => { throw err; });
    expect(() => require('../lib/index')).not.toThrow();
  });
});
