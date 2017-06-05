'use strict';

var chai   = require('chai');
var expect = chai.expect;

var WriteStream = require('lib/common/streams/write-stream');

module.exports = function (fs) {

  describe('createWriteStream()', function () {

    it('should create a WriteStream instance', function () {
      expect(fs.createWriteStream('/tmp/file')).to.be.an.instanceof(WriteStream);
    });

  });

};
