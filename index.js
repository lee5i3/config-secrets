var config = require('config');
var Path = require('path');
var jetpack = require('fs-jetpack');
var fs = require('fs');

getSecrets = function() {
  var secretsPath = process.env.SECRET_PATH || '/run/secrets'

  var result = {};
  var all = jetpack.list(secretsPath);
  var files = all.filter(file => !fs.statSync(`${secretsPath}/${file}`).isDirectory());
  if (files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var contents = jetpack.read(`${secretsPath}/${file}`, 'utf8');
      result[file] = contents;
    }
  }

  return result;
}

parseSecretsAndEnv = function(CONFIG_DIR, extNames) {
  var result = {};
  extNames.forEach(function(extName) {
    var fullFilename = Path.join(CONFIG_DIR, 'custom-environment-variables' + '.' + extName);
    var configObj = config.util.parseFile(fullFilename);
    if (configObj) {
      var secrets = this.getSecrets();

      var environmentSubstitutions = config.util.substituteDeep(configObj, secrets);
      config.util.extendDeep(result, environmentSubstitutions);

      var environmentSubstitutions = config.util.substituteDeep(configObj, process.env);
      config.util.extendDeep(result, environmentSubstitutions);
    }
  });

  return result;
};

module.exports = function() {
  config.util.getCustomEnvVars = parseSecretsAndEnv;

  var t = config;

  // Merge configurations into this
  config.util.extendDeep(t, config.util.loadFileConfigs());
  config.util.attachProtoDeep(t);

  // Perform strictness checks and possibly throw an exception.
  config.util.runStrictnessChecks(t);

  return config;
}()
