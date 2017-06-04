'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('renameSync()', function () {

    it('should rename files', function () {
      var result = fs.renameSync('/tmp/file', '/tmp/new');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

    it('should move files', function () {
      var result = fs.renameSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/dir/file').that.contain('Hello, friend.');
    });

  });

};
