'use strict';

var chai   = require('chai');
var expect = chai.expect;

var StatWatcher = require('lib/common/watchers/stat-watcher');

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('watchFile()', function () {

    it('should return a StatWatcher instance', function () {
      expect(fs.watchFile('/tmp/file', noop)).to.be.an.instanceOf(StatWatcher);
      expect(fs.watchFile('/tmp/file', {}, noop)).to.be.an.instanceOf(StatWatcher);
    });

  });

};
