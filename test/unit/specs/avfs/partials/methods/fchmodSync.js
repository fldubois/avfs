'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('fchmodSync()', function () {

    it('should change the mode', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.fchmodSync(fd, '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fchmodSync(0, '0700');
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fchmodSync(true, '0700');
      }).to.throw(TypeError);
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.fchmodSync(0, false);
      }).to.throw(Error);
    });

  });

};
