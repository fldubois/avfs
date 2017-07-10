'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var factory  = require('lib/common/avfs/utils');

describe('common/avfs/utils', function () {

  var base = factory();

  describe('toUnixTimestamp()', function () {

    var clock = null;

    before('Mock dates', function () {
      clock = sinon.useFakeTimers(1500600, 'Date');
    });

    it('should return parsed number for numeric string', function () {
      expect(base.toUnixTimestamp('125')).to.equal(125);
    });

    it('should return parsed number for finite positive number', function () {
      expect(base.toUnixTimestamp(125)).to.equal(125);
    });

    it('should return unix timestamp for infinite number', function () {
      expect(base.toUnixTimestamp(Infinity)).to.equal(1500.600);
    });

    it('should return unix timestamp for negative number', function () {
      expect(base.toUnixTimestamp(-1)).to.equal(1500.600);
    });

    it('should return unix timestamp for Date', function () {
      expect(base.toUnixTimestamp(new Date())).to.equal(1500.600);
    });

    it('should throw error on not parsable parameter', function () {
      expect(function () {
        base.toUnixTimestamp({});
      }).to.throw(Error, 'Cannot parse time: [object Object]');
    });

    after('Restore dates', function () {
      clock.restore();
    });

  });

});
