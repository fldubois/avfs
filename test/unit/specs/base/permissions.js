'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/base/permissions');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('base/permissions', function () {

  var uid = process.getuid();
  var gid = process.getgroups()[0];

  var storage = new Storage(constants);

  var base = factory(storage, constants);

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

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.chmod.bind(null, path, '0700')).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw mode:type error on bad mode type', function () {
      [void 0, null, false, {}, []].forEach(function (mode) {
        expect(base.chmod.bind(null, '/file', mode)).to.throw(AVFSError).with.property('code', 'mode:type');
      });
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

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.chown.bind(null, path, uid, gid)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw uid:type error on bad uid type', function () {
      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.chown.bind(null, '/file', value, gid)).to.throw(AVFSError).with.property('code', 'uid:type');
      });
    });

    it('should throw gid:type error on bad gid type', function () {
      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.chown.bind(null, '/file', uid, value)).to.throw(AVFSError).with.property('code', 'gid:type');
      });
    });

    it('should throw EPERM on not owned files', function () {
      expect(function () {
        base.chown('/other', uid, gid);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

});
