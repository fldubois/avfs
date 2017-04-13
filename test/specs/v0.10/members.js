'use strict';

var chai   = require('chai');
var expect = chai.expect;

var Stats = require('lib/common/stats');

var ReadStream  = require('lib/common/read-stream');
var WriteStream = require('lib/common/write-stream');

module.exports = function (fs) {

  describe('members', function () {

    it('should expose Stats', function () {
      expect(fs.Stats).to.equal(Stats);
    });

    it('should expose ReadStream', function () {
      expect(fs.ReadStream).to.be.a('function');
      expect(new fs.ReadStream('/file')).to.be.an.instanceof(ReadStream);
    });

    it('should expose WriteStream', function () {
      expect(fs.WriteStream).to.be.a('function');
      expect(new fs.WriteStream('/file')).to.be.an.instanceof(WriteStream);
    });

  });

};
