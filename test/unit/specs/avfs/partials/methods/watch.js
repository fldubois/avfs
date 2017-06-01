'use strict';

var chai   = require('chai');
var expect = chai.expect;

var FSWatcher = require('lib/common/fs-watcher');

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('watch()', function () {

    it('should return a FSWatcher instance', function () {
      expect(fs.watch('/tmp/file')).to.be.an.instanceOf(FSWatcher);
      expect(fs.watch('/tmp/file', noop)).to.be.an.instanceOf(FSWatcher);
      expect(fs.watch('/tmp/file', {}, noop)).to.be.an.instanceOf(FSWatcher);
    });

  });

};
