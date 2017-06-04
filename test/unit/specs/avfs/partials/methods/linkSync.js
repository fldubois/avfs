'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('linkSync()', function () {

    it('should create a hard link', function () {
      var result = fs.linkSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file')).to.equal(getElement('/dir/file'));
    });

    it('should increment the number of links', function () {
      expect(getElement('/tmp/file').get('nlink')).to.equal(1);

      var result = fs.linkSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('nlink')).to.equal(2);
    });

  });

};
