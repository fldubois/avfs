'use strict';

var chai   = require('chai');
var expect = chai.expect;

var errors = require('lib/common/errors');

describe('common/errors', function () {

  describe('createError()', function () {

    it('should create an error with message and data', function () {
      var error = errors.createError('Fake error', {
        test: true,
        text: 'test'
      });

      expect(error).to.be.an('error');
      expect(error.message).to.equal('Fake error');
      expect(error).to.include.keys(['test', 'text']);
      expect(error.test).to.equal(true);
      expect(error.text).to.equal('test');
    });

  });

  describe('nullCheck()', function () {

    it('should return true with valid string', function () {
      expect(errors.nullCheck('test')).to.equal(true);
    });

    it('should throw with null bytes in string', function () {
      expect(function () {
        errors.nullCheck('\u0000');
      }).to.throw(Error, 'Path must be a string without null bytes.');
    });

    it('should accept callback', function (done) {
      errors.nullCheck('test', done);
    });

    it('should pass error to the callback', function () {
      errors.nullCheck('\u0000', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Path must be a string without null bytes.');
      });
    });

    it('should accept data', function () {
      var data = {
        test: true,
        text: 'test'
      };

      errors.nullCheck(data, '\u0000', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Path must be a string without null bytes.');
        expect(error).to.include.keys(['test', 'text']);
        expect(error.test).to.equal(true);
        expect(error.text).to.equal('test');
      });
    });

  });

});
