'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('readdirSync()', function () {

    it('should list directory files', function () {
      var result = fs.readdirSync('/tmp');

      expect(result).to.be.an('array');
      expect(result).to.deep.equal([
        'ascii',
        'empty',
        'file'
      ]);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.readdirSync('/not');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on file', function () {
      expect(function () {
        fs.readdirSync('/tmp/file');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.readdirSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

};
