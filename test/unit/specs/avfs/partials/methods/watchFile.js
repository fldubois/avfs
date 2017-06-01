'use strict';

var chai   = require('chai');
var expect = chai.expect;

var StatWatcher = require('lib/common/stat-watcher');

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('watchFile()', function () {

    it('should return a StatWatcher instance', function () {
      expect(fs.watchFile('/tmp/file', noop)).to.be.an.instanceOf(StatWatcher);
      expect(fs.watchFile('/tmp/file', {}, noop)).to.be.an.instanceOf(StatWatcher);
    });

    it('should throw on non function listener', function () {
      expect(function () {
        fs.watchFile('/tmp/file', false);
      }).to.throw(Error, 'watchFile requires a listener function');
    });

  });

};
