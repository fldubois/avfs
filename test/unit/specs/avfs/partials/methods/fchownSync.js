'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('fchownSync()', function () {

    it('should change the owner and group', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.fchownSync(fd, process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fchownSync(0, 1001, 1001);
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fchownSync(true, 1001, 1001);
      }).to.throw(TypeError);
    });

    it('should throw on negative uid parameter', function () {
      expect(function () {
        fs.fchownSync(0, -1, 1001);
      }).to.throw(TypeError);
    });

    it('should throw on negative gid parameter', function () {
      expect(function () {
        fs.fchownSync(0, 1001, -1);
      }).to.throw(TypeError);
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.fchownSync(0, false, 1001);
      }).to.throw(TypeError);
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.fchownSync(0, 1001, false);
      }).to.throw(TypeError);
    });

  });

};
