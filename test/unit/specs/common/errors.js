'use strict';

var chai   = require('chai');
var expect = chai.expect;

var errors = require('lib/common/errors');

var AVFSError = require('lib/common/avfs-error');

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

    it('should throw path:null error with null bytes in string', function () {
      expect(errors.nullCheck.bind(null, '\u0000')).to.throw(AVFSError).with.property('code', 'path:null');
    });

  });

});
