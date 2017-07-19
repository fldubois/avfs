'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var factory  = require('lib/common/avfs/permissions');

var Storage = require('lib/common/storage');

var constants = {
  S_IFLNK: 40960, // 0120000 - symbolic link
  S_IFDIR: 16384  // 0040000 - directory
};

describe('common/avfs/permissions', function () {

  var uid = process.getuid();
  var gid = process.getgroups()[0];

  var storage = new Storage(constants);

  var base = factory(storage);

  before(function () {
    var file  = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));
    var other = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));
    var link  = elements.symlink(parseInt('0777', 8), '/file');

    file.set('gid', gid + 1);
    link.set('gid', gid + 1);

    other.set('uid', uid + 1);

    storage.files = elements.directory(parseInt('0755', 8), {
      file:  file,
      link:  link,
      other: other
    });
  });

  describe('chmod()', function () {

    it('should change the mode', function () {
      var result = base.chmod('/file', '0700');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should follow symlinks', function () {
      var result = base.chmod('/link', '0700');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
      expect(storage.files).to.contain.an.avfs.symlink('/link').with.mode('0777');
    });

    it('should throw EPERM on not owned files', function () {
      expect(function () {
        base.chmod('/other', '0700');
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

  describe('chown()', function () {

    it('should change the owner and group', function () {
      var result = base.chown('/file', uid, gid);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.owner(uid, gid);
    });

    it('should follow symlinks', function () {
      var result = base.chown('/link', uid, gid);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.owner(uid, gid);
      expect(storage.files).to.contain.an.avfs.symlink('/link').with.owner(uid, gid + 1);
    });

    it('should throw EPERM on not owned files', function () {
      expect(function () {
        base.chown('/other', uid, gid);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

});
