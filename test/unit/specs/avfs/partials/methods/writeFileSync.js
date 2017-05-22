'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements  = require('lib/common/elements');

module.exports = function (fs) {

  describe('writeFileSync()', function () {

    it('should write buffer to file', function () {
      var result = fs.writeFileSync('/file', new Buffer('Hello, friend.'));

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write string to file', function () {
      fs.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = fs.writeFileSync('/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write encoded string to file', function () {
      fs.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = fs.writeFileSync('/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept encoding option', function () {
      var result = fs.writeFileSync('/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept mode option', function () {
      var result = fs.writeFileSync('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.writeFileSync('/not/file', 'Hello, friend.');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file/file', 'Hello, friend.');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on directory path', function () {
      expect(function () {
        fs.writeFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, {code: 'EISDIR'});
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.writeFileSync('/file', 'Hello, friend.', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.writeFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file', 'Hello, friend.', true);
      }).to.throw(TypeError);
    });

  });

};
