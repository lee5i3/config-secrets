'use strict';

const config = require('config');
const Path = require('path');
const jetpack = require('fs-jetpack');
const fs = require('fs');

const getSecrets = function() {
  const secretsPath = process.env.SECRET_PATH || '/run/secrets';
  const result = {};
  const all = jetpack.list(secretsPath);
  if (!all) return result;
  const files = all.filter(file => !fs.statSync(`${secretsPath}/${file}`).isDirectory());
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    result[file] = jetpack.read(`${secretsPath}/${file}`, 'utf8');
  }
  return result;
};

const parseSecretsAndEnv = function(CONFIG_DIR, extNames) {
  const result = {};
  extNames.forEach(function(extName) {
    const fullFilename = Path.join(CONFIG_DIR, 'custom-environment-variables.' + extName);
    const configObj = config.util.parseFile(fullFilename);
    if (configObj) {
      const secrets = getSecrets();
      const secretSubstitutions = config.util.substituteDeep(configObj, secrets);
      config.util.extendDeep(result, secretSubstitutions);
      const envSubstitutions = config.util.substituteDeep(configObj, process.env);
      config.util.extendDeep(result, envSubstitutions);
    }
  });
  return result;
};

module.exports = (function() {
  config.util.getCustomEnvVars = parseSecretsAndEnv;
  const t = config;
  config.util.extendDeep(t, config.util.loadFileConfigs());
  config.util.attachProtoDeep(t);
  config.util.runStrictnessChecks(t);
  return config;
})();

module.exports.getSecrets = getSecrets;
module.exports.parseSecretsAndEnv = parseSecretsAndEnv;
