'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var storage  = require('lib/common/storage');

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

var getElement = function (path) {
  var current = files;

  storage.parse(path).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

describe('common/storage', function () {

  it('should expose storage function', function () {
    expect(storage).to.contain.keys([
      'parse',
      'get',
      'set',
      'unset'
    ]);
  });

  describe('parse()', function () {

    it('should return path elements', function () {
      expect(storage.parse('/')).to.deep.equal([]);
      expect(storage.parse('/path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(storage.parse('path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(storage.parse('C:\\path\\to\\file.txt')).to.deep.equal(['C:', 'path', 'to', 'file.txt']);
      expect(storage.parse('path\\to\\file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
    });

  });

  describe('get()', function () {

    it('should return the element', function () {
      expect(storage.get(files, 'test', '/')).to.equal(files);
      expect(storage.get(files, 'test', '/dir')).to.equal(getElement('/dir'));
      expect(storage.get(files, 'test', '/dir/file')).to.equal(getElement('/dir/file'));
    });

    it('should follow symlinks', function () {
      expect(storage.get(files, 'test', '/dir/link')).to.equal(getElement('/dir/file'));
    });

    it('should support relative symlinks', function () {
      expect(storage.get(files, 'test', '/tmp/link')).to.equal(getElement('/dir/file'));
    });

    it('should not follow symlinks', function () {
      expect(storage.get(files, 'test', '/dir/link', false)).to.equal(getElement('/dir/link'));
    });

    it('should slice the path', function () {
      expect(storage.get(files, 'test', '/dir/file', 1)).to.equal(getElement('/dir'));
    });

    it('should set parameters on error', function () {
      try {
        storage.get(files, {syscall: 'test', filepath: '/other/path'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.get(files, {syscall: 'test'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw EACCES on missing directory in path', function () {
      expect(function () {
        storage.get(files, 'test', '/restricted/file');
      }).to.throw(Error, 'EACCES, permission denied \'/restricted/file\'');
    });

    it('should throw ENOENT on missing directory in path', function () {
      expect(function () {
        storage.get(files, 'test', '/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw ENOTDIR on not directory element in path', function () {
      expect(function () {
        storage.get(files, 'test', '/dir/file/test');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

    it('should throw ENOENT on missing symlink target', function () {
      expect(function () {
        storage.get(files, 'test', '/dir/miss');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/dir/miss\'');
    });

  });

  describe('set()', function () {

    it('should set the element', function () {
      var file = elements.file(438, new Buffer(0));

      storage.set(files, 'test', '/dir/test', file);

      expect(getElement('/dir').get('content')).to.contain.keys('test');
      expect(getElement('/dir/test')).to.equal(file);
    });

    it('should set parameters on error', function () {
      try {
        storage.set(files, {syscall: 'test', filepath: '/other/path'}, '/not/file', elements.file(438, new Buffer(0)));
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.set(files, {syscall: 'test'}, '/not/file', elements.file(438, new Buffer(0)));
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.set(files, 'test', '/not/file', elements.file(438, new Buffer(0)));
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.set(files, 'test', '/dir/file/test', elements.file(438, new Buffer(0)));
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        storage.set(files, 'test', '/perm/test', elements.file(438, new Buffer(0)));
      }).to.throw(Error, 'EACCES, permission denied \'/perm/test\'');
    });

  });

  describe('unset()', function () {

    it('should unset the element', function () {
      storage.unset(files, 'test', '/dir/test');

      expect(getElement('/dir')).to.not.contain.keys('test');
    });

    it('should set parameters on error', function () {
      try {
        storage.unset(files, {syscall: 'test', filepath: '/other/path'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.unset(files, {syscall: 'test'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.unset(files, 'test', '/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.unset(files, 'test', '/dir/file/test');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        storage.unset(files, 'test', '/perm/file');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/file\'');
    });

  });

});
