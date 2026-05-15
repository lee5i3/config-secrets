'use strict';

// Polyfills util.isArray/isDate/isRegExp for node-config v1/v2.
// Removed in Node 23+; overwriting also silences DEP0044/45/46 on Node ≤22.
// try/catch survives hardened builds where these properties are non-configurable.

const _util = require('util');

try { _util.isArray = Array.isArray; } catch { /* property locked */ }
try {
  _util.isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';
} catch { /* property locked */ }
try {
  _util.isRegExp = (v) => Object.prototype.toString.call(v) === '[object RegExp]';
} catch { /* property locked */ }
