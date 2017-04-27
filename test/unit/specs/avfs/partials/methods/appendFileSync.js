'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('appendFileSync()', function () {

    it('should append buffer to file', function () {
      var result = fs.appendFileSync('/tmp/file', new Buffer(' Hello, world !'));

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append string to file', function () {
      var result = fs.appendFileSync('/tmp/file', ' Hello, world !');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append encoded string to file', function () {
      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept encoding option', function () {
      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept mode option', function () {
      var result = fs.appendFileSync('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should create non existing file', function () {
      var result = fs.appendFileSync('/tmp/new', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.appendFileSync('/not/file', 'Hello, friend.');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file/new', 'Hello, friend.');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on directory path', function () {
      expect(function () {
        fs.appendFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, {code: 'EISDIR'});
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.appendFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.', true);
      }).to.throw(TypeError);
    });

  });

};
