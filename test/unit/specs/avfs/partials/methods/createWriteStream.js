'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('createWriteStream()', function () {

    it('should create a WriteStream instance', function () {
      expect(fs.createWriteStream('/tmp/file')).to.be.an.instanceof(fs.WriteStream);
    });

  });

};
