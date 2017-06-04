'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('unlinkSync()', function () {

    it('should delete file', function () {
      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp')).to.not.contain.keys('file');
    });

    it('should decrement the number of links', function () {
      var file = getElement('/tmp/file');

      file.set('nlink', 5);

      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(file.get('nlink')).to.equal(4);
    });

  });

};
