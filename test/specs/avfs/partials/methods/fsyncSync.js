'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('fsyncSync', function () {

    it('should return undefined', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      expect(fs.fsyncSync(fd)).to.be.an('undefined');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fsyncSync(0);
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fsyncSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

  });

};
