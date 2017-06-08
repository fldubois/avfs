'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('existsSync()', function () {

    it('should return true for existing file', function () {
      expect(fs.existsSync('/tmp/file')).to.equal(true);
    });

    it('should return false for non existing file', function () {
      expect(fs.existsSync('/not/file')).to.equal(false);
    });

    it('should return false for bad parameter', function () {
      expect(fs.existsSync('\u0000')).to.equal(false);
      expect(fs.existsSync(0)).to.equal(false);
      expect(fs.existsSync(false)).to.equal(false);
      expect(fs.existsSync([])).to.equal(false);
      expect(fs.existsSync({})).to.equal(false);
    });

  });

};
