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

    it('should return undefined with valid string', function () {
      expect(errors.nullCheck('test')).to.be.an('undefined');
    });

    it('should throw with null bytes in string', function () {
      expect(function () {
        errors.nullCheck('\u0000');
      }).to.throw(Error, 'Path must be a string without null bytes.');
    });

    it('should accept data', function (done) {
      var data = {
        test: true,
        text: 'test'
      };

      try {
        errors.nullCheck(data, '\u0000');

        return done(new Error('nullCheck should have thrown an error'));
      } catch (error) {
        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.equal('Path must be a string without null bytes.');
        expect(error).to.have.property('test', true);
        expect(error).to.have.property('text', 'test');

        return done();
      }
    });

    it('should accept custom message', function (done) {
      var data = {
        message: 'Error message',
        test:    true,
        text:    'test'
      };

      try {
        errors.nullCheck(data, '\u0000');

        return done(new Error('nullCheck should have thrown an error'));
      } catch (error) {
        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.equal('Error message');
        expect(error).to.have.property('test', true);
        expect(error).to.have.property('text', 'test');

        return done();
      }
    });

  });

});
