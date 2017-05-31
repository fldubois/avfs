'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

module.exports = function (fs) {

  describe('_toUnixTimestamp', function () {

    var clock = null;

    before('Mock dates', function () {
      clock = sinon.useFakeTimers(1500600, 'Date');
    });

    it('should return parsed number for numeric string', function () {
      expect(fs._toUnixTimestamp('125')).to.equal(125);
    });

    it('should return parsed number for finite positive number', function () {
      expect(fs._toUnixTimestamp(125)).to.equal(125);
    });

    it('should return unix timestamp for infinite number', function () {
      expect(fs._toUnixTimestamp(Infinity)).to.equal(1500.600);
    });

    it('should return unix timestamp for negative number', function () {
      expect(fs._toUnixTimestamp(-1)).to.equal(1500.600);
    });

    it('should return unix timestamp for Date', function () {
      expect(fs._toUnixTimestamp(new Date())).to.equal(1500.600);
    });

    it('should throw on invalid string parameter', function () {
      expect(function () {
        fs._toUnixTimestamp('not');
      }).to.throw(Error, 'Cannot parse time: not');
    });

    it('should throw on invalid parameter', function () {
      expect(function () {
        fs._toUnixTimestamp(false);
      }).to.throw(Error, 'Cannot parse time: false');
    });

    after('Restore dates', function () {
      clock.restore();
    });

  });

};
