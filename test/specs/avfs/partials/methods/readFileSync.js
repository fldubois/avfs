'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('readFileSync()', function () {

    it('should return the file buffer', function () {
      var content = fs.readFileSync('/tmp/file');

      expect(content).to.be.an.instanceof(Buffer);
      expect(content.toString()).to.equal('Hello, friend.');
    });

    it('should return an encoded string', function () {
      var content = fs.readFileSync('/tmp/file', {encoding: 'utf8'});

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should accept encoding option', function () {
      var content = fs.readFileSync('/tmp/file', 'utf8');

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.readFileSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.readFileSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory');
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.readFileSync('/tmp/file', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.readFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.readFileSync('/tmp/file', true);
      }).to.throw(TypeError, 'Bad arguments');
    });

  });

};
