var config = require('config');
var Path = require('path');
var fs = require('fs');

get = function() {}

getSecrets = function(CONFIG_DIR, extNames) {
  var result = {};
  extNames.forEach(function(extName) {
    var fullFilename = Path.join(CONFIG_DIR, 'custom-environment-variables' + '.' + extName);
    var configObj = config.util.parseFile(fullFilename);
    if (configObj) {
      //var environmentSubstitutions = config.util.substituteDeep(configObj, process.env);
      //config.util.extendDeep(result, environmentSubstitutions);

      var environmentSubstitutions = config.util.substituteDeep(configObj, {PORT: '1000'});
      config.util.extendDeep(result, environmentSubstitutions);
    }
  });

  console.log(result)
  return result;
};

module.exports = function() {
  config.util.getCustomEnvVars = getSecrets;

  config.util.loadFileConfigs();

  return config;
}
