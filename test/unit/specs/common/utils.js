'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var utils = require('lib/common/utils');

var AVFSError = require('lib/common/avfs-error');

chai.use(require('sinon-chai'));

// Prototype mock factory

var createTarget = function () {
  var Target = function () {
    this.mock = true;
  };

  Target.prototype.doSync = sinon.stub();
  Target.prototype.isSync = sinon.stub();

  return new Target();
};

// Specs

describe('common/utils', function () {

  describe('asyncify()', function () {

    var target = createTarget();
    var nocb   = sinon.spy();

    utils.asyncify(target, nocb);

    beforeEach(function () {
      target.doSync.reset();

      nocb.reset();
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
      target.doSync.returns(10);

      target.do('nope', false);

      setImmediate(function () {
        expect(target.doSync).to.have.callCount(1);
        expect(target.doSync).to.have.been.calledWithExactly('nope', false);

        expect(nocb).to.have.callCount(1);
        expect(nocb).to.have.been.calledWithExactly(null, 10);

        return done();
      });
    });

    it('should remove parameters after the callback', function (done) {
      target.doSync.returns(5);

      target.do('abc', null, function (error, result) {
        expect(error).to.equal(null);

        expect(result).to.equal(5);

        expect(target.doSync).to.have.callCount(1);
        expect(target.doSync).to.have.been.calledWithExactly('abc', null);

        return done();
      }, 'hello', 12);

    });

    it('should filter methods', function () {
      var partial = createTarget();

      utils.asyncify(partial, {
        methods: ['doSync'],
        nocb:    nocb
      });

      expect(partial).to.respondTo('do');
      expect(partial).to.not.respondTo('is');
    });

    it('should call the transform callback', function (done) {
      var partial   = createTarget();
      var transform = sinon.spy();

      utils.asyncify(partial, {
        nocb:      nocb,
        transform: transform
      });

      partial.doSync.returns('transformed');

      partial.do('test');

      setImmediate(function () {
        expect(partial.doSync).to.have.callCount(1);
        expect(partial.doSync).to.have.been.calledWithExactly('test');

        var matcher = sinon.match.array.deepEquals(['test']);

        expect(transform).to.have.callCount(1);
        expect(transform).to.have.been.calledWithExactly(null, 'transformed', 'do', matcher, nocb);

        return done();
      });
    });

    it('should call the error callback', function (done) {
      var error   = new Error('Fake error');
      var onError = sinon.spy();
      var partial = createTarget();

      utils.asyncify(partial, {
        nocb:  nocb,
        error: onError
      });

      partial.doSync.throws(error);

      partial.do('test');

      setImmediate(function () {
        expect(partial.doSync).to.have.callCount(1);
        expect(partial.doSync).to.have.been.calledWithExactly('test');

        expect(onError).to.have.callCount(1);
        expect(onError).to.have.been.calledWithExactly(error);

        expect(nocb).to.have.callCount(1);
        expect(nocb).to.have.been.calledWithExactly(error, void 0);

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
      var avfsError  = new AVFSError('ENOENT');
      var finalError = new Error('Fake error');

      method.throws(avfsError);

      var callback = sinon.stub();

      callback.throws(finalError);

      expect(function () {
        utils.invoke(method, [true], callback);
      }).to.throw(finalError);

      expect(callback).to.have.callCount(1);
      expect(callback).to.have.been.calledWithExactly(avfsError);
    });

    it('should throw errors', function () {
      var error = new Error('Fake error');

      method.throws(error);

      var callback = sinon.stub();

      expect(function () {
        utils.invoke(method, [true], callback);
      }).to.throw(error);

      expect(callback).to.have.callCount(0);
    });

  });

});
