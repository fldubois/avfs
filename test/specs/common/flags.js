'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');
var flags     = require('lib/common/flags');

describe('common/flags', function () {

  describe('parse()', function () {

    it('should parse string to flags', function () {
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
          expect(flags.parse(value) & spec.flag).to.be.above(0, value + ' should contain ' + spec.flag + ' flag');
        });
      });
    });

    it('should throw on unknown flags', function () {
      expect(function () {
        flags.parse('b');
      }).to.throw(Error, 'Unknown file open flag: b');
    });

    it('should do nothing on non string parameter', function () {
      expect(flags.parse(1)).to.equal(1);
      expect(flags.parse(true)).to.equal(true);
      expect(flags.parse({})).to.deep.equal({});
    });

  });

});
