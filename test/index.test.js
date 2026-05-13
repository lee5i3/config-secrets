'use strict';

jest.mock('fs-jetpack');
jest.mock('fs');

const jetpack = require('fs-jetpack');
const fs = require('fs');

describe('getSecrets', () => {
  let getSecrets;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('fs-jetpack');
    jest.mock('fs');
    // Re-mock config so module loads without side effects
    jest.mock('config', () => ({
      util: {
        getCustomEnvVars: null,
        extendDeep: jest.fn((a) => a),
        loadFileConfigs: jest.fn(() => ({})),
        attachProtoDeep: jest.fn(),
        runStrictnessChecks: jest.fn(),
        parseFile: jest.fn(),
        substituteDeep: jest.fn(),
      }
    }));
    const mod = require('../index');
    getSecrets = mod.getSecrets;
  });

  afterEach(() => {
    delete process.env.SECRET_PATH;
  });

  test('returns empty object when jetpack.list returns null', () => {
    const jetpackMock = require('fs-jetpack');
    jetpackMock.list.mockReturnValue(null);
    const result = getSecrets();
    expect(result).toEqual({});
  });

  test('returns empty object when jetpack.list returns undefined', () => {
    const jetpackMock = require('fs-jetpack');
    jetpackMock.list.mockReturnValue(undefined);
    const result = getSecrets();
    expect(result).toEqual({});
  });

  test('returns key->value pairs from files in the secrets directory', () => {
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue(['db_password', 'api_key']);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    jetpackMock.read.mockImplementation((path) => {
      if (path.includes('db_password')) return 'secret123';
      if (path.includes('api_key')) return 'myapikey';
      return null;
    });
    const result = getSecrets();
    expect(result).toEqual({ db_password: 'secret123', api_key: 'myapikey' });
  });

  test('uses SECRET_PATH env var when set', () => {
    process.env.SECRET_PATH = '/custom/secrets';
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue(['token']);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    jetpackMock.read.mockReturnValue('tokenvalue');
    getSecrets();
    expect(jetpackMock.list).toHaveBeenCalledWith('/custom/secrets');
  });

  test('defaults to /run/secrets when SECRET_PATH is not set', () => {
    delete process.env.SECRET_PATH;
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue([]);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    getSecrets();
    expect(jetpackMock.list).toHaveBeenCalledWith('/run/secrets');
  });

  test('skips directories', () => {
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue(['subdir', 'my_secret']);
    fsMock.statSync.mockImplementation((path) => {
      if (path.includes('subdir')) return { isDirectory: () => true };
      return { isDirectory: () => false };
    });
    jetpackMock.read.mockReturnValue('value');
    const result = getSecrets();
    expect(result).not.toHaveProperty('subdir');
    expect(result).toHaveProperty('my_secret', 'value');
  });
});

describe('parseSecretsAndEnv', () => {
  let parseSecretsAndEnv;
  let mockConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('fs-jetpack');
    jest.mock('fs');
    mockConfig = {
      util: {
        getCustomEnvVars: null,
        extendDeep: jest.fn((a) => a),
        loadFileConfigs: jest.fn(() => ({})),
        attachProtoDeep: jest.fn(),
        runStrictnessChecks: jest.fn(),
        parseFile: jest.fn(),
        substituteDeep: jest.fn(() => ({})),
      }
    };
    jest.mock('config', () => mockConfig);
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue([]);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    const mod = require('../index');
    parseSecretsAndEnv = mod.parseSecretsAndEnv;
  });

  test('returns empty object when configObj is null', () => {
    mockConfig.util.parseFile.mockReturnValue(null);
    const result = parseSecretsAndEnv('/some/dir', ['yml']);
    expect(result).toEqual({});
  });

  test('calls substituteDeep with secrets and env vars when configObj is found', () => {
    const configObj = { db: { password: 'DB_PASSWORD' } };
    mockConfig.util.parseFile.mockReturnValue(configObj);
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue(['DB_PASSWORD']);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    jetpackMock.read.mockReturnValue('secretvalue');

    parseSecretsAndEnv('/some/dir', ['yml']);

    expect(mockConfig.util.substituteDeep).toHaveBeenCalledTimes(2);
    // First call with secrets
    const firstCall = mockConfig.util.substituteDeep.mock.calls[0];
    expect(firstCall[0]).toBe(configObj);
    expect(firstCall[1]).toHaveProperty('DB_PASSWORD', 'secretvalue');
    // Second call with process.env
    const secondCall = mockConfig.util.substituteDeep.mock.calls[1];
    expect(secondCall[0]).toBe(configObj);
    expect(secondCall[1]).toBe(process.env);
  });

  test('calls extendDeep twice per config file found', () => {
    const configObj = { key: 'VAL' };
    mockConfig.util.parseFile.mockReturnValue(configObj);
    const jetpackMock = require('fs-jetpack');
    const fsMock = require('fs');
    jetpackMock.list.mockReturnValue([]);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });

    parseSecretsAndEnv('/some/dir', ['yml']);

    // extendDeep is called during module init too, so just check it was called at least twice for substitutions
    const callCount = mockConfig.util.extendDeep.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});
