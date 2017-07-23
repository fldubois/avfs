'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var parsers  = require('lib/common/parsers')(constants);

var Storage  = require('lib/common/storage');

var files = elements.directory(parseInt('0755', 8), {
  dir: elements.directory(parseInt('0777', 8), {
    file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend')),
    link: elements.symlink(parseInt('0777', 8), '/dir/file'),
    miss: elements.symlink(parseInt('0777', 8), '/dir/not')
  }),
  tmp: elements.directory(parseInt('0777', 8), {
    link: elements.symlink(parseInt('0777', 8), '../dir/file')
  }),
  restricted: elements.directory(parseInt('0666', 8), {
    file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend'))
  }),
  perm: elements.directory(parseInt('555', 8), {
    file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend'))
  })
});

var getElement = function (storage, path) {
  var current = storage.files;

  parsers.path(path).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

var storage = new Storage(constants);

storage.files = files;

describe('common/storage', function () {

  it('should expose a constructor', function () {
    expect(Storage).to.be.a('function');
    expect(new Storage({})).to.be.an.instanceOf(Storage);
  });

  it('should expose storage interface', function () {
    expect(Storage).to.respondTo('get');
    expect(Storage).to.respondTo('set');
    expect(Storage).to.respondTo('unset');
  });

  describe('get()', function () {

    it('should return the element', function () {
      expect(storage.get('/')).to.equal(files);
      expect(storage.get('/dir')).to.equal(getElement(storage, '/dir'));
      expect(storage.get('/dir/file')).to.equal(getElement(storage, '/dir/file'));
    });

    it('should follow symlinks', function () {
      expect(storage.get('/dir/link')).to.equal(getElement(storage, '/dir/file'));
    });

    it('should support relative symlinks', function () {
      expect(storage.get('/tmp/link')).to.equal(getElement(storage, '/dir/file'));
    });

    it('should not follow symlinks', function () {
      expect(storage.get('/dir/link', false)).to.equal(getElement(storage, '/dir/link'));
    });

    it('should slice the path', function () {
      expect(storage.get('/dir/file', 1)).to.equal(getElement(storage, '/dir'));
    });

    it('should throw EACCES on missing directory in path', function () {
      expect(function () {
        storage.get('/restricted/file');
      }).to.throw(Error, {code: 'EACCES'});
    });

    it('should throw ENOENT on missing directory in path', function () {
      expect(function () {
        storage.get('/not/file');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw ENOTDIR on not directory element in path', function () {
      expect(function () {
        storage.get('/dir/file/test');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw ENOENT on missing symlink target', function () {
      expect(function () {
        storage.get('/dir/miss');
      }).to.throw(Error, {code: 'ENOENT'});
    });

  });

  describe('set()', function () {

    it('should set the element', function () {
      var file = elements.file(438, new Buffer(0));

      storage.set('/dir/test', file);

      expect(getElement(storage, '/dir').get('content')).to.contain.keys('test');
      expect(getElement(storage, '/dir/test')).to.equal(file);
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.set('/not/file', elements.file(438, new Buffer(0)));
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.set('/dir/file/test', elements.file(438, new Buffer(0)));
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        storage.set('/perm/test', elements.file(438, new Buffer(0)));
      }).to.throw(Error, {code: 'EACCES'});
    });

  });

  describe('unset()', function () {

    it('should unset the element', function () {
      storage.unset('/dir/test');

      expect(getElement(storage, '/dir')).to.not.contain.keys('test');
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.unset('/not/file');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.unset('/dir/file/test');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        storage.unset('/perm/file');
      }).to.throw(Error, {code: 'EACCES'});
    });

  });

});
