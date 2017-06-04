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

  });

};
