'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

module.exports = function (fs) {

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

      fs.base.watchers['/tmp/file'] = watcher;
    });

    it('should remove all listeners without listener parameter', function () {
      expect(fs.unwatchFile('/tmp/file')).to.be.an('undefined');

      expect(watcher.removeListener).to.have.callCount(0);

      expect(watcher.removeAllListeners).to.have.callCount(1);
      expect(watcher.removeAllListeners).to.have.been.calledWithExactly('change');

      expect(watcher.stop).to.have.callCount(1);
    });

    it('should remove listener from watcher', function () {
      expect(fs.unwatchFile('/tmp/file', noop)).to.be.an('undefined');

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

      expect(fs.unwatchFile('/tmp/file', noop)).to.be.an('undefined');

      expect(watcher.stop).to.have.callCount(0);
    });

    it('should do nothing on inexistant watcher', function () {
      expect(fs.unwatchFile('/tmp/not')).to.be.an('undefined');

      expect(watcher.removeListener).to.have.callCount(0);
      expect(watcher.removeAllListeners).to.have.callCount(0);
      expect(watcher.stop).to.have.callCount(0);
    });

    after('Delete watcher stub', function () {
      delete fs.base.watchers['/tmp/file'];
    });

  });

};
