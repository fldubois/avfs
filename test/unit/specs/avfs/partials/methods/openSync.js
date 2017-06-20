'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');

module.exports = function (fs) {

  describe('openSync()', function () {

    it('should return a file descriptor', function () {
      var fd = fs.openSync('/tmp/file', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.base.handles).to.contain.keys(key);
      expect(fs.base.handles[key].path).to.equal('/tmp/file');
    });

    it('should open directory in read mode', function () {
      var fd = fs.openSync('/tmp', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.base.handles).to.contain.keys(key);
      expect(fs.base.handles[key].path).to.equal('/tmp');
    });

    it('should create non existing file in create mode', function () {
      [
        'w',  'wx',  'xw',
        'w+', 'wx+', 'xw+',
        'a',  'ax',  'xa',
        'a+', 'ax+', 'xa+'
      ].forEach(function (fgs) {
        var filename = 'file-' + fgs + '';

        var fd = fs.openSync('/' + filename, fgs);

        expect(fd).to.be.a('number');
        expect(fs.storage.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should set mode on new file', function () {
      var fd = fs.openSync('/file', 'w', '0500');

      expect(fd).to.be.a('number');
      expect(fs.storage.files).to.contain.an.avfs.file('/file').with.mode('0500').that.is.clear();
    });

    it('should set mode to 0666 by default', function () {
      var fd = fs.openSync('/file', 'w');

      expect(fd).to.be.a('number');
      expect(fs.storage.files).to.contain.an.avfs.file('/file').with.mode('0666').that.is.clear();
    });

    it('should erase existing file in truncate mode', function () {
      ['w',  'w+'].forEach(function (fgs) {
        var filename = 'file-' + fgs + '';

        fs.storage.files[filename] = elements.file('0666', new Buffer('Hello, friend.'));

        var fd = fs.openSync('/' + filename, fgs);

        expect(fd).to.be.a('number');
        expect(fs.storage.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (fgs) {
        var fd = fs.openSync('/tmp/file', fgs);

        expect(fd).to.be.a('number');
        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.');
      });
    });

  });

};
