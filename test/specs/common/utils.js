'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');
var utils     = require('lib/common/utils');

describe('common/utils', function () {

  describe('parseFlags()', function () {

    it('should parse string to utils', function () {
      var specs = [
        {flag: constants.O_RDONLY, values: ['r', 'rs']},
        {flag: constants.O_WRONLY, values: ['w', 'wx', 'xw']},
        {flag: constants.O_RDWR,   values: ['r+', 'rs+', 'w+', 'wx+', 'xw+']},
        {flag: constants.O_CREAT,  values: ['w', 'wx', 'xw', 'w+', 'wx+', 'xw+', 'a', 'ax', 'xa', 'a+', 'ax+', 'xa+']},
        {flag: constants.O_TRUNC,  values: ['w', 'wx', 'xw', 'w+', 'wx+', 'xw+']},
        {flag: constants.O_APPEND, values: ['a', 'ax', 'xa', 'a+', 'ax+', 'xa+']},
        {flag: constants.O_EXCL,   values: ['xw', 'xw+', 'xa', 'xa+']}
      ];

      specs.forEach(function (spec) {
        spec.values.forEach(function (value) {
          expect(utils.parseFlags(value) & spec.flag).to.be.above(0, value + ' should contain ' + spec.flag + ' flag');
        });
      });
    });

    it('should throw on unknown utils', function () {
      expect(function () {
        utils.parseFlags('b');
      }).to.throw(Error, 'Unknown file open flag: b');
    });

    it('should do nothing on non string parameter', function () {
      expect(utils.parseFlags(1)).to.equal(1);
      expect(utils.parseFlags(true)).to.equal(true);
      expect(utils.parseFlags({})).to.deep.equal({});
    });

  });

  describe('parseMode()', function () {

    it('should parse mode string to number', function () {
      var specs = [
        {mode: '0666', value: parseInt('666', 8)},
        {mode: '0777', value: parseInt('777', 8)},
        {mode: '0100', value: parseInt('100', 8)},
        {mode: '0030', value: parseInt('030', 8)},
        {mode: '0007', value: parseInt('007', 8)},
        {mode: '0706', value: parseInt('706', 8)},
        {mode: '0051', value: parseInt('051', 8)},
        {mode: '0650', value: parseInt('650', 8)}
      ];

      specs.forEach(function (spec) {
        expect(utils.parseMode(spec.mode)).to.equal(spec.value, spec.mode + 'mode  should equal ' + spec.value);
      });
    });

    it('should return the value on number parameter', function () {
      expect(utils.parseMode(0)).to.equal(0);
      expect(utils.parseMode(7)).to.equal(7);

      expect(utils.parseMode(511)).to.equal(511);
      expect(utils.parseMode(438)).to.equal(438);
    });

    it('should return NaN on non octal string', function () {
      expect(Number.isNaN(utils.parseMode('9'))).to.equal(true, 'should return NaN');
    });

    it('should return default on bad type', function () {
      expect(utils.parseMode(null, 511)).to.equal(511);
      expect(utils.parseMode(true, 511)).to.equal(511);

      expect(utils.parseMode({}, '0777')).to.equal(511);
      expect(utils.parseMode([], '0777')).to.equal(511);
    });

    it('should return null on bad type without default', function () {
      expect(utils.parseMode(null)).to.equal(null);
      expect(utils.parseMode(true)).to.equal(null);

      expect(utils.parseMode({})).to.equal(null);
      expect(utils.parseMode([])).to.equal(null);
    });
  });

});
