'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/base/files');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('base/files', function () {

  var storage = new Storage(constants);
  var handles = {next: 0};

  var base = factory(storage, constants, handles);

  beforeEach(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.')),
      dir:  elements.directory(parseInt('0755', 8)),
      perm: elements.directory(parseInt('0000', 8))
    });
  });

  describe('appendFile()', function () {

    it('should append buffer to file', function () {
      var result = base.appendFile('/file', new Buffer(' Hello, world !'));

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append string to file', function () {
      var result = base.appendFile('/file', ' Hello, world !');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append encoded string to file', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.appendFile('/new', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain(content);
    });

    it('should accept encoding option', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.appendFile('/new', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain(content);
    });

    it('should accept mode option', function () {
      var result = base.appendFile('/new', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        base.appendFile('/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should create non existing file', function () {
      var result = base.appendFile('/new', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain('Hello, friend.');
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.appendFile(path, 'OK');
        }).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw options:type error on bad options type', function () {
      [0, 1, true, false].forEach(function (options) {
        expect(function () {
          base.appendFile('/file', 'OK', options);
        }).to.throw(AVFSError).with.property('code', 'options:type');
      });
    });

    it('should throw options:encoding error on unknown encoding', function () {
      ['utf5', {encoding: 'utf5'}].forEach(function (options) {
        expect(function () {
          base.appendFile('/file', 'OK', options);
        }).to.throw(AVFSError).with.property('code', 'options:encoding');
      });
    });

  });

  describe('readFile()', function () {

    it('should return the file buffer', function () {
      var content = base.readFile('/file');

      expect(content).to.be.an.instanceof(Buffer);
      expect(content.toString()).to.equal('Hello, friend.');
    });

    it('should return an encoded string', function () {
      var content = base.readFile('/file', {encoding: 'utf8'});

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should accept encoding option', function () {
      var content = base.readFile('/file', 'utf8');

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should update file access time', function (done) {
      var file   = storage.get('/file');
      var before = file.get('atime');

      setTimeout(function () {
        base.readFile('/file');

        expect(file.get('atime').getTime()).to.be.above(before.getTime());

        done();
      }, 200);
    });

    it('should not update file access time with O_NOATIME flag', function (done) {
      var file  = storage.get('/file');
      var atime = file.get('atime');

      setTimeout(function () {
        base.readFile('/file', {flag: constants.O_RDWR | constants.O_NOATIME});

        expect(file.get('atime').getTime()).to.be.equal(atime.getTime());

        done();
      }, 200);
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.readFile(path);
        }).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw options:type error on bad options type', function () {
      [0, 1, true, false].forEach(function (options) {
        expect(function () {
          base.readFile('/file', options);
        }).to.throw(AVFSError).with.property('code', 'options:type');
      });
    });

    it('should throw options:encoding error on unknown encoding', function () {
      ['utf5', {encoding: 'utf5'}].forEach(function (options) {
        expect(function () {
          base.readFile('/file', options);
        }).to.throw(AVFSError).with.property('code', 'options:encoding');
      });
    });

    it('should throw EISDIR on directory', function () {
      expect(function () {
        base.readFile('/dir');
      }).to.throw(AVFSError).with.property('code', 'EISDIR');
    });

  });

  describe('rename()', function () {

    it('should rename files', function () {
      var result = base.rename('/file', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain('Hello, friend.');
    });

    it('should move files', function () {
      var result = base.rename('/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/dir/file').that.contain('Hello, friend.');
    });

    it('should throw old:type error on bad old path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.rename(path, '/new');
        }).to.throw(AVFSError).with.property('code', 'old:type');
      });
    });

    it('should throw new:type error on bad new path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.rename('/old', path);
        }).to.throw(AVFSError).with.property('code', 'new:type');
      });
    });

    it('should throw EINVAL on new path under old path', function () {
      expect(function () {
        base.rename('/file', '/file/new');
      }).to.throw(AVFSError).with.property('code', 'EINVAL');
    });

    it('should throw EACCES on not writable parent directory', function () {
      expect(function () {
        base.rename('/perm/file', '/new');
      }).to.throw(AVFSError).with.property('code', 'EACCES');
    });

    it('should throw EACCES on not writable destination directory', function () {
      expect(function () {
        base.rename('/file', '/perm/new');
      }).to.throw(AVFSError).with.property('code', 'EACCES');
    });

  });

  describe('truncate()', function () {

    it('should truncate file', function () {
      var result = base.truncate('/file');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      var result = base.truncate('/file', 3);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.truncate(path);
        }).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw length:type on bad length type', function () {
      [null, false, 'test', {}, []].forEach(function (length) {
        expect(function () {
          base.truncate('/file', length);
        }).to.throw(AVFSError).with.property('code', 'length:type');
      });
    });

    it('should throw ENOENT on not existing path', function () {
      expect(function () {
        base.truncate('/not');
      }).to.throw(AVFSError).with.property('code', 'ENOENT');
    });

  });

  describe('writeFile()', function () {

    it('should write buffer to file', function () {
      var result = base.writeFile('/file', new Buffer('Hello, friend.'));

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write string to file', function () {
      storage.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = base.writeFile('/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write encoded string to file', function () {
      storage.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.writeFile('/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content);
    });

    it('should accept encoding option', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.writeFile('/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content);
    });

    it('should accept mode option', function () {
      var result = base.writeFile('/tmp', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/tmp').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        base.writeFile('/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(function () {
          base.writeFile(path, 'OK');
        }).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw options:type error on bad options type', function () {
      [0, 1, true, false].forEach(function (options) {
        expect(function () {
          base.writeFile('/file', 'OK', options);
        }).to.throw(AVFSError).with.property('code', 'options:type');
      });
    });

    it('should throw options:encoding error on unknown encoding', function () {
      ['utf5', {encoding: 'utf5'}].forEach(function (options) {
        expect(function () {
          base.writeFile('/file', 'OK', options);
        }).to.throw(AVFSError).with.property('code', 'options:encoding');
      });
    });

  });

});
