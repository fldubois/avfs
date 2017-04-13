'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('closeSync()', function () {

    it('should close the file handle', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      expect(fs.handles[fd].closed).to.equal(false);

      var result = fs.closeSync(fd);

      expect(result).to.be.an('undefined');
      expect(fs.handles[fd].closed).to.equal(true);
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.closeSync(0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.closeSync('Hello');
      }).to.throw(Error, 'Bad argument');
    });

  });

};
