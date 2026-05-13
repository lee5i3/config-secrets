'use strict';

// Patches singleton `util` for the whole file.
require('../lib/util-shim');

const util = require('util');

describe('util-shim', () => {
  describe('util.isArray', () => {
    test('exists as a function after the shim loads', () => {
      expect(typeof util.isArray).toBe('function');
    });

    test('returns true for arrays', () => {
      expect(util.isArray([])).toBe(true);
      expect(util.isArray([1, 2, 3])).toBe(true);
      expect(util.isArray(new Array(2))).toBe(true);
    });

    test('returns false for non-arrays', () => {
      expect(util.isArray({})).toBe(false);
      expect(util.isArray('foo')).toBe(false);
      expect(util.isArray(null)).toBe(false);
      expect(util.isArray(undefined)).toBe(false);
      expect(util.isArray(42)).toBe(false);
    });
  });

  describe('util.isDate', () => {
    test('exists as a function after the shim loads', () => {
      expect(typeof util.isDate).toBe('function');
    });

    test('returns true for Date instances', () => {
      expect(util.isDate(new Date())).toBe(true);
      expect(util.isDate(new Date('2024-01-01'))).toBe(true);
    });

    test('returns false for non-Dates', () => {
      expect(util.isDate('2024-01-01')).toBe(false);
      expect(util.isDate(Date.now())).toBe(false);
      expect(util.isDate({})).toBe(false);
      expect(util.isDate(null)).toBe(false);
      expect(util.isDate(undefined)).toBe(false);
    });
  });

  describe('util.isRegExp', () => {
    test('exists as a function after the shim loads', () => {
      expect(typeof util.isRegExp).toBe('function');
    });

    test('returns true for RegExp instances', () => {
      expect(util.isRegExp(/foo/)).toBe(true);
      expect(util.isRegExp(new RegExp('bar'))).toBe(true);
      expect(util.isRegExp(/with\/slashes/g)).toBe(true);
    });

    test('returns false for non-RegExps', () => {
      expect(util.isRegExp('foo')).toBe(false);
      expect(util.isRegExp('/foo/')).toBe(false);
      expect(util.isRegExp({})).toBe(false);
      expect(util.isRegExp(null)).toBe(false);
      expect(util.isRegExp(undefined)).toBe(false);
    });
  });

  test('loading the shim a second time is idempotent (no throw)', () => {
    expect(() => {
      jest.resetModules();
      require('../lib/util-shim');
    }).not.toThrow();
    expect(typeof util.isArray).toBe('function');
    expect(typeof util.isDate).toBe('function');
    expect(typeof util.isRegExp).toBe('function');
  });
});
