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

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp/file');
    });

    it('should open directory in read mode', function () {
      var fd = fs.openSync('/tmp', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp');
    });

    it('should throw on bad path type', function () {
      expect(function () {
        fs.openSync(false, 'r');
      }).to.throw(Error, 'path must be a string');
    });

    it('should throw on bad flags type', function () {
      expect(function () {
        fs.openSync('/tmp/file', false);
      }).to.throw(Error, 'flags must be an int');
    });

    it('should throw on non unknown flags', function () {
      expect(function () {
        fs.openSync('/tmp/file', 'p');
      }).to.throw(Error, 'Unknown file open flag: p');
    });

    it('should throw on non existing file in read mode', function () {
      ['r', 'r+', 'rs', 'rs+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp/not', fgs);
        }).to.throw(Error, {code: 'ENOENT'});
      });
    });

    it('should throw on existing file in exclusive mode', function () {
      ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp/file', fgs);
        }).to.throw(Error, {code: 'EEXIST'});
      });
    });

    it('should throw on directory in write mode', function () {
      ['r+', 'rs+', 'w', 'w+', 'a', 'a+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp', fgs);
        }).to.throw(Error, {code: 'EISDIR'});
      });
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.openSync('/not/file', 'w');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.openSync('/tmp/file/file', 'w');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on permission denied', function () {
      ['r', 'r+', 'w', 'w+', 'a', 'a+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/dir/perm', fgs);
        }).to.throw(Error, {code: 'EACCES'});
      });
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
        expect(fs.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should set mode on new file', function () {
      var fd = fs.openSync('/file', 'w', '0500');

      expect(fd).to.be.a('number');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0500').that.is.clear();
    });

    it('should set mode to 0666 by default', function () {
      var fd = fs.openSync('/file', 'w');

      expect(fd).to.be.a('number');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0666').that.is.clear();
    });

    it('should erase existing file in truncate mode', function () {
      ['w',  'w+'].forEach(function (fgs) {
        var filename = 'file-' + fgs + '';

        fs.files[filename] = elements.file('0666', new Buffer('Hello, friend.'));

        var fd = fs.openSync('/' + filename, fgs);

        expect(fd).to.be.a('number');
        expect(fs.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (fgs) {
        var fd = fs.openSync('/tmp/file', fgs);

        expect(fd).to.be.a('number');
        expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.');
      });
    });

  });

};
