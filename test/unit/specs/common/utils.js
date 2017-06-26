'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var utils = require('lib/common/utils');

chai.use(require('sinon-chai'));

// Target mock

var Target = function () {
  this.mock = true;
};

Target.prototype.doSync = sinon.stub();
Target.prototype.isSync = sinon.stub();

// Specs

describe('common/utils', function () {

  describe('asyncify()', function () {

    var target = new Target();

    utils.asyncify(target);

    before(function () {
      sinon.stub(console, 'error');
    });

    beforeEach(function () {
      target.doSync.reset();
    });

    it('should convert synchronous functions', function () {
      for (var method in target) {
        if (/Sync$/.test(method)) {
          expect(target).to.respondTo(method.replace('Sync', ''));
        }
      }
    });

    it('should call the synchronous couterpart', function (done) {
      target.doSync.returns(1);

      target.do(true, 10, function (error, result) {
        expect(error).to.equal(null);

        expect(result).to.equal(1);

        expect(target.doSync).to.have.callCount(1);
        expect(target.doSync).to.have.been.calledWithExactly(true, 10);

        return done();
      });

    });

    it('should work without callback', function (done) {
      target.doSync.returns(1);

      target.do('nope', false);

      setImmediate(function () {
        expect(target.doSync).to.have.callCount(1);
        expect(target.doSync).to.have.been.calledWithExactly('nope', false);

        return done();
      });
    });

    it('should pass error to the callback', function (done) {
      var error = new Error('Fake error');

      target.doSync.throws(error);

      target.do(function (error, result) {
        expect(error).to.equal(error);
        expect(result).to.be.an('undefined');

        return done();
      });
    });

    it('should log error without callback', function (done) {
      var error = new Error('Fake error');

      target.doSync.throws(error);

      target.do(true, 'test');

      setImmediate(function () {
        expect(console.error).to.have.been.calledWithExactly('fs: missing callback Fake error');

        return done();
      });
    });

    after(function () {
      console.error.restore();
    });

  });

});
