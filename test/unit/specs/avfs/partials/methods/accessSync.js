'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  if (version !== 'v0.10') {

    describe('accessSync()', function () {

      it('should return undefined on existing file and no mode', function () {
        expect(fs.accessSync('/tmp/file')).to.be.an('undefined');
      });

      it('should return undefined on existing file and F_OK mode', function () {
        expect(fs.accessSync('/tmp/file', fs.F_OK)).to.be.an('undefined');
      });

    });

  }

};
