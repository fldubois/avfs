'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var factory  = require('lib/base/watchers');

var AVFSError   = require('lib/common/avfs-error');
var FSWatcher   = require('lib/common/watchers/fs-watcher');
var StatWatcher = require('lib/common/watchers/stat-watcher');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

describe('base/watchers', function () {

  var base = factory();

  describe('unwatchFile()', function () {

    var watcher = null;

    before('Create watcher stub', function () {
      watcher =  {
        listeners:          sinon.stub(),
        removeListener:     sinon.stub(),
        removeAllListeners: sinon.stub(),
        stop:               sinon.stub()
      };
    });

    beforeEach('Reset watcher stub', function () {
      watcher.listeners.reset();
      watcher.removeListener.reset();
      watcher.removeAllListeners.reset();
      watcher.stop.reset();

      watcher.listeners.returns([]);

      base.watchers['/file'] = watcher;
    });

    it('should remove all listeners without listener parameter', function () {
      expect(base.unwatchFile('/file')).to.be.an('undefined');

      expect(watcher.removeListener).to.have.callCount(0);

      expect(watcher.removeAllListeners).to.have.callCount(1);
      expect(watcher.removeAllListeners).to.have.been.calledWithExactly('change');

      expect(watcher.stop).to.have.callCount(1);
    });

    it('should remove listener from watcher', function () {
      expect(base.unwatchFile('/file', noop)).to.be.an('undefined');

      expect(watcher.removeListener).to.have.callCount(1);
      expect(watcher.removeListener).to.have.been.calledWithExactly('change', noop);

      expect(watcher.removeAllListeners).to.have.callCount(0);

      expect(watcher.stop).to.have.callCount(1);
    });

    it('should not stop non empty watcher', function () {
      var listener = function () {
        return null;
      };

      watcher.listeners.returns([listener]);

      expect(base.unwatchFile('/file', noop)).to.be.an('undefined');

      expect(watcher.stop).to.have.callCount(0);
    });

    it('should do nothing on inexistant watcher', function () {
      expect(base.unwatchFile('/not')).to.be.an('undefined');

      expect(watcher.removeListener).to.have.callCount(0);
      expect(watcher.removeAllListeners).to.have.callCount(0);
      expect(watcher.stop).to.have.callCount(0);
    });

    after('Delete watcher stub', function () {
      delete base.watchers['/file'];
    });

  });

  describe('watch()', function () {

    it('should return a FSWatcher instance', function () {
      expect(base.watch('/file')).to.be.an.instanceOf(FSWatcher);
      expect(base.watch('/file', noop)).to.be.an.instanceOf(FSWatcher);
      expect(base.watch('/file', {}, noop)).to.be.an.instanceOf(FSWatcher);
    });

  });

  describe('watchFile()', function () {

    it('should return a StatWatcher instance', function () {
      expect(base.watchFile('/file', noop)).to.be.an.instanceOf(StatWatcher);
      expect(base.watchFile('/file', {}, noop)).to.be.an.instanceOf(StatWatcher);
    });

    it('should throw on missing listener function', function () {
      expect(function () {
        base.watchFile('/file');
      }).to.throw(AVFSError).with.property('code', 'listener:missing');
    });

  });

});
