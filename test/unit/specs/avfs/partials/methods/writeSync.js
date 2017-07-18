'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('writeSync()', function () {

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.writeSync(true, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(TypeError);
    });

  });

};
