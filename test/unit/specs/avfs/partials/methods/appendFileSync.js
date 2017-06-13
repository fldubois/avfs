'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('appendFileSync()', function () {

    it('should append buffer to file', function () {
      var result = fs.appendFileSync('/tmp/file', new Buffer(' Hello, world !'));

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append string to file', function () {
      var result = fs.appendFileSync('/tmp/file', ' Hello, world !');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append encoded string to file', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain(content);
    });

    it('should accept encoding option', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain(content);
    });

    it('should accept mode option', function () {
      var result = fs.appendFileSync('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should create non existing file', function () {
      var result = fs.appendFileSync('/tmp/new', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

  });

};
