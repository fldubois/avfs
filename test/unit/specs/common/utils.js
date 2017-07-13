'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var utils = require('lib/common/utils');

var AVFSError = require('lib/common/avfs-error');

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
    var nocb   = sinon.spy();

    utils.asyncify(target, nocb);

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

    it('should pass error to the callback', function (done) {
      var error = new Error('Fake error');

      target.doSync.throws(error);

      target.do(function (error, result) {
        expect(error).to.equal(error);
        expect(result).to.be.an('undefined');

        return done();
      });
    });

    it('should call the default callback without callback in call', function (done) {
      target.doSync.returns(1);

      target.do('nope', false);

      setImmediate(function () {
        expect(target.doSync).to.have.callCount(1);
        expect(target.doSync).to.have.been.calledWithExactly('nope', false);

        expect(nocb).to.have.callCount(1);
        expect(nocb).to.have.been.calledWithExactly(null, 1);

        return done();
      });
    });

  });

  describe('invoke()', function () {

    var method = sinon.stub();

    beforeEach(function () {
      method.reset();
    });

    it('should call the function with parameters', function () {
      method.onCall(0).returns(0);
      method.onCall(1).returns(1);
      method.onCall(2).returns(2);

      expect(utils.invoke(method, [1, true, 'test'])).to.equal(0);
      expect(utils.invoke(method, [false, 2])).to.equal(1);
      expect(utils.invoke(method)).to.equal(2);

      expect(method).to.have.callCount(3);

      expect(method.firstCall).to.have.been.calledWithExactly(1, true, 'test');
      expect(method.secondCall).to.have.been.calledWithExactly(false, 2);
      expect(method.thirdCall).to.have.been.calledWithExactly();
    });

    it('should call transform on AVFSError', function () {
      var error = new Error('Fake error');

      method.throws(new AVFSError('ENOENT'));

      var callback = sinon.stub();

      callback.throws(error);

      expect(function () {
        utils.invoke(method, [true], {
          ENOENT: callback
        });
      }).to.throw(error);

      expect(callback).to.have.callCount(1);
    });

    it('should throw errors', function () {
      var error = new Error('Fake error');

      method.throws(error);

      var callback = sinon.stub();

      expect(function () {
        utils.invoke(method, [true], {
          ENOENT: callback
        });
      }).to.throw(error);

      expect(callback).to.have.callCount(0);
    });

  });

});
