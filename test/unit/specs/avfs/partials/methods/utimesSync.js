'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('utimesSync()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/tmp/file', date, date);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;

      var result = fs.utimesSync('/tmp/file', timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/dir/link', date, date);

      expect(result).to.be.an('undefined');

      expect(getElement('/dir/link').get('atime').getTime()).to.not.equal(date.getTime());
      expect(getElement('/dir/link').get('mtime').getTime()).to.not.equal(date.getTime());

      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

  });

};
