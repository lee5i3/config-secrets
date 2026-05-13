'use strict';

require('./util-shim');

const { getSecrets } = require('./secrets');

// Existing env vars are preserved — runtime overrides beat secret files.
for (const [key, value] of Object.entries(getSecrets())) {
  if (process.env[key] === undefined) process.env[key] = value;
}

module.exports = require('config');
