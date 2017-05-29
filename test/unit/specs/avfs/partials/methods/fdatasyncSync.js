'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('fdatasyncSync', function () {

    it('should return undefined', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      expect(fs.fdatasyncSync(fd)).to.be.an('undefined');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fdatasyncSync(0);
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fdatasyncSync(true);
      }).to.throw(TypeError);
    });

  });

};
