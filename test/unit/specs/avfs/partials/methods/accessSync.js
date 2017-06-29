'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  if (version !== 'v0.10') {

    describe('accessSync()', function () {

      it('should return undefined on existing file and F_OK mode', function () {
        expect(fs.accessSync('/tmp/file', fs.F_OK)).to.be.an('undefined');
      });

      it('should return undefined on accessible file', function () {
        expect(fs.accessSync('/access/r', fs.R_OK)).to.be.an('undefined');
        expect(fs.accessSync('/access/w', fs.W_OK)).to.be.an('undefined');
        expect(fs.accessSync('/access/x', fs.x_OK)).to.be.an('undefined');
      });

      it('should return undefined on existing file and falsy mode', function () {
        expect(fs.accessSync('/tmp/file')).to.be.an('undefined');
        expect(fs.accessSync('/tmp/file', null)).to.be.an('undefined');
        expect(fs.accessSync('/tmp/file', false)).to.be.an('undefined');
        expect(fs.accessSync('/tmp/file', '')).to.be.an('undefined');
      });

      it('should return undefined on executable file and truthy mode', function () {
        expect(fs.accessSync('/access/x', true)).to.be.an('undefined');
        expect(fs.accessSync('/access/x', 'test')).to.be.an('undefined');
        expect(fs.accessSync('/access/x', {})).to.be.an('undefined');
      });

    });

  }

};
