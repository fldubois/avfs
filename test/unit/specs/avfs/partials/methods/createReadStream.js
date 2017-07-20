'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('createReadStream()', function () {

    it('should create a ReadStream instance', function () {
      expect(fs.createReadStream('/tmp/file')).to.be.an.instanceof(fs.ReadStream);
    });

  });

};
