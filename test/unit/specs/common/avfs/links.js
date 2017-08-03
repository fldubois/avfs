'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/common/avfs/links');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('common/avfs/links', function () {

  var uid = process.getuid();
  var gid = process.getgroups()[0];

  var storage = new Storage(constants);

  var base = factory(storage, constants);

  beforeEach(function () {
    var file  = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));
    var other = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));
    var link  = elements.symlink(parseInt('0777', 8), '/file');

    link.set('gid', gid + 1);
    file.set('gid', gid + 1);

    other.set('uid', uid + 1);

    storage.files = elements.directory(parseInt('0755', 8), {
      dir:   elements.directory(parseInt('0755', 8), {}),
      dlink: elements.symlink(parseInt('0777', 8), '/'),
      file:  file,
      link:  link,
      other: other
    });
  });

  describe('lchmod()', function () {

    it('should change the mode', function () {
      var result = base.lchmod('/file', '0700');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should not follow symlinks', function () {
      var result = base.lchmod('/link', '0700');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0666');
      expect(storage.files).to.contain.an.avfs.symlink('/link').with.mode('0700');
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.lchmod.bind(null, path, '0700')).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw mode:type error on bad mode type', function () {
      [void 0, null, false, {}, []].forEach(function (mode) {
        expect(base.lchmod.bind(null, '/link', mode)).to.throw(AVFSError).with.property('code', 'mode:type');
      });
    });

    it('should throw EPERM on not owned files', function () {
      expect(function () {
        base.lchmod('/other', '0700');
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

  describe('lchown()', function () {

    it('should change the owner and group', function () {
      var result = base.lchown('/file', uid, gid);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.owner(uid, gid);
    });

    it('should not follow symlinks', function () {
      var result = base.lchown('/link', uid, gid);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.symlink('/link').with.owner(uid, gid);
      expect(storage.files).to.contain.an.avfs.file('/file').with.owner(uid, gid + 1);
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.lchown.bind(null, path, uid, gid)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw uid:type error on bad uid type', function () {
      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.lchown.bind(null, '/link', value, gid)).to.throw(AVFSError).with.property('code', 'uid:type');
      });
    });

    it('should throw gid:type error on bad gid type', function () {
      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.lchown.bind(null, '/link', uid, value)).to.throw(AVFSError).with.property('code', 'gid:type');
      });
    });

    it('should throw EPERM on permission denied', function () {
      expect(function () {
        base.lchown('/other', 0, 0);
      }).to.throw(Error, {code: 'EPERM'});

      expect(function () {
        base.lchown('/file', uid, 0);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

  describe('link()', function () {

    it('should create a hard link', function () {
      var result = base.link('/file', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.get('/file')).to.equal(storage.get('/new'));
    });

    it('should increment the number of links', function () {
      expect(storage.get('/file').get('nlink')).to.equal(1);

      var result = base.link('/file', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.get('/file').get('nlink')).to.equal(2);
    });

    it('should throw srcpath:type error on bad srcpath type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (srcpath) {
        expect(base.link.bind(null, srcpath, '/new')).to.throw(AVFSError).with.property('code', 'srcpath:type');
      });
    });

    it('should throw dstpath:type error on bad dstpath type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (dstpath) {
        expect(base.link.bind(null, '/file', dstpath)).to.throw(AVFSError).with.property('code', 'dstpath:type');
      });
    });

    it('should throw EPERM on directory source', function () {
      expect(function () {
        base.link('/dir', '/new');
      }).to.throw(Error, {code: 'EPERM'});
    });

    it('should throw ENOTDIR on not directory parent in destination', function () {
      expect(function () {
        base.link('/file', '/file/new');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw EEXIST on existing destination', function () {
      expect(function () {
        base.link('/file', '/link');
      }).to.throw(Error, {code: 'EEXIST'});
    });

  });

  describe('lstat()', function () {

    it('should return link stats', function () {
      var stats = base.lstat('/link');

      expect(stats).to.be.an('object');

      var file = storage.get('/link', false);

      expect(stats.dev).to.equal(1);
      expect(stats.ino).to.equal(file.get('inode'));
      expect(stats.mode).to.equal(file.get('mode') + file.get('type'));
      expect(stats.nlink).to.equal(file.get('nlink'));
      expect(stats.uid).to.equal(file.get('uid'));
      expect(stats.gid).to.equal(file.get('gid'));
      expect(stats.rdev).to.equal(0);
      expect(stats.size).to.equal(0);
      expect(stats.blksize).to.equal(512);
      expect(stats.blocks).to.equal(0);
      expect(stats.atime).to.equal(file.get('atime'));
      expect(stats.mtime).to.equal(file.get('mtime'));
      expect(stats.ctime).to.equal(file.get('ctime'));
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.lstat.bind(null, path)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

  });

  describe('readlink()', function () {

    it('should return the symlink target', function () {
      expect(base.readlink('/link')).to.equal('/file');
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.readlink.bind(null, path)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw EINVAL on not link', function () {
      expect(function () {
        base.readlink('/file');
      }).to.throw(Error, {code: 'EINVAL'});
    });

  });

  describe('realpath()', function () {

    it('should resolve symlinks and cached links', function () {
      expect(base.realpath('/link')).to.equal('/file');
      expect(base.realpath('/cache/file', {'/cache': '/'})).to.equal('/file');
      expect(base.realpath('/cache/file', {'/cache': '/dlink'})).to.equal('/file');
    });

    it('should directly resolve fully cached links', function () {
      expect(base.realpath('/falsy', {'/falsy': false})).to.equal(false);
    });

  });

  describe('symlink()', function () {

    it('should create a symbolic link on file', function () {
      var result = base.symlink('/file', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.symlink('/new').with.mode('0777').that.target('/file');
    });

    it('should create a symbolic link on folder', function () {
      var result = base.symlink('/dir', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.symlink('/new').with.mode('0777').that.target('/dir');
    });

    it('should create a symbolic link on nonexistent target', function () {
      var result = base.symlink('/not', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.symlink('/new').with.mode('0777').that.target('/not');
    });

    it('should throw srcpath:type error on bad srcpath type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (srcpath) {
        expect(base.symlink.bind(null, srcpath, '/new')).to.throw(AVFSError).with.property('code', 'srcpath:type');
      });
    });

    it('should throw dstpath:type error on bad dstpath type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (dstpath) {
        expect(base.symlink.bind(null, '/file', dstpath)).to.throw(AVFSError).with.property('code', 'dstpath:type');
      });
    });

    it('should throw EEXIST on existing destination', function () {
      expect(function () {
        base.symlink('/file', '/link');
      }).to.throw(Error, {code: 'EEXIST'});
    });

  });

  describe('unlink()', function () {

    it('should delete file', function () {
      var result = base.unlink('/file');

      expect(result).to.be.an('undefined');
      expect(storage.get('/')).to.not.contain.keys('file');
    });

    it('should decrement the number of links', function () {
      var file = storage.get('/file');

      file.set('nlink', 5);

      var result = base.unlink('/file');

      expect(result).to.be.an('undefined');
      expect(file.get('nlink')).to.equal(4);
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.unlink.bind(null, path)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw EISDIR on directory', function () {
      expect(function () {
        base.unlink('/dir');
      }).to.throw(Error, {code: 'EISDIR'});
    });

  });


});
