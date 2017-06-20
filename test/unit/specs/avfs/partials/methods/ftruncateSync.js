'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/components/descriptor');

module.exports = function (fs, getElement) {

  describe('ftruncateSync()', function () {

    it('should truncate file', function () {
      var fd = 10;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.ftruncateSync(fd);

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');
      var fd = 10;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.ftruncateSync(fd, 3);

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain(content.slice(0, 3).toString());
    });

  });

};
