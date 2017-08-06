'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('createReadStream()', function () {

    it('should create a ReadStream instance', function () {
      expect(fs.createReadStream('/file')).to.be.an.instanceof(fs.ReadStream);
    });

  });

  describe('createWriteStream()', function () {

    it('should create a WriteStream instance', function () {
      expect(fs.createWriteStream('/file')).to.be.an.instanceof(fs.WriteStream);
    });

  });

  describe('lchmodSync()', function () {

    it('should throw on null character in path', function () {
      expect(function () {
        fs.lchmodSync('\u0000', '0700');
      }).to.throw(Error);
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchmodSync(false, '0700');
      }).to.throw(Error);
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.lchmodSync('/file', false);
      }).to.throw(Error);
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchmodSync('/not', '0700');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchmodSync('/not/file', '0700');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchmodSync('/file/new', '0700');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on not owned files', function () {
      expect(function () {
        fs.lchmodSync('/other', '0700');
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

  describe('lchownSync()', function () {

    var uid = process.getuid();

    it('should throw on null character in path', function () {
      expect(function () {
        fs.lchownSync('\u0000', 1001, 1001);
      }).to.throw(Error);
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchownSync(false, 1001, 1001);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.lchownSync('/file', false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.lchownSync('/file', 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchownSync('/not', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchownSync('/not/file', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchownSync('/file/new', 1001, 1001);
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on permission denied', function () {
      expect(function () {
        fs.lchownSync('/other', 0, 0);
      }).to.throw(Error, {code: 'EPERM'});

      expect(function () {
        fs.lchownSync('/file', uid, 0);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

  describe('writeSync()', function () {

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.writeSync(true, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(TypeError);
    });

  });

};
