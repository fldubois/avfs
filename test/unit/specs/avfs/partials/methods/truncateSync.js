'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('truncateSync()', function () {

    it('should truncate file', function () {
      var result = fs.truncateSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      var result = fs.truncateSync('/tmp/file', 3);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain(content.slice(0, 3).toString());
    });

  });

};
