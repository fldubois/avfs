'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/components/descriptor');

module.exports = function (fs, getElement) {

  describe('futimesSync()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.futimesSync(fd, date, date);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;
      var fd        = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.futimesSync(fd, timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;

      fs.handles[fd] = new Descriptor(getElement('/dir/link'), '/dir/link', constants.O_RDWR);

      var result = fs.futimesSync(fd, date, date);

      expect(result).to.be.an('undefined');

      expect(getElement('/dir/link').get('atime').getTime()).to.not.equal(date.getTime());
      expect(getElement('/dir/link').get('mtime').getTime()).to.not.equal(date.getTime());

      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

  });

};
