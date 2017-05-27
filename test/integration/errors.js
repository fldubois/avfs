'use strict';

var fs   = require('fs');
var path = require('path');

var chai   = require('chai');
var expect = chai.expect;
var rimraf = require('rimraf');

var version = require('lib/common/version');

var supported = fs.readdirSync(path.join(__dirname, '../../lib'));

var BAD_FD = 1000000000;

if (supported.indexOf(version) !== -1) {
  var AVFS = require('lib/avfs');

  var avfs = new AVFS();

  var check = function (method, params) {
    var errors = {};

    try {
      fs[method].apply(fs, params.hasOwnProperty('fs') ? params.fs : params);
    } catch (error) {
      errors.fs = error;
    }

    try {
      avfs[method].apply(avfs, params.hasOwnProperty('avfs') ? params.avfs : params);
    } catch (error) {
      errors.avfs = error;
    }

    expect(errors.avfs.message).to.equal(errors.fs.message);

    expect(errors.avfs.constructor).to.equal(errors.fs.constructor);

    expect(Object.keys(errors.avfs)).to.deep.equal(Object.keys(errors.fs));

    Object.keys(errors.avfs).forEach(function (key) {
      expect(errors.avfs[key]).to.equal(errors.fs[key]);
    });
  };

  describe('errors', function () {

    var fd = null;

    before('create files', function () {
      avfs.mkdirSync('/tmp');

      fs.mkdirSync('/tmp/dir');
      avfs.mkdirSync('/tmp/dir');

      fs.writeFileSync('/tmp/dir/file', 'Hello, friend.');
      avfs.writeFileSync('/tmp/dir/file', 'Hello, friend.');

      fs.writeFileSync('/tmp/dir/foo', 'Hello, friend.');
      avfs.writeFileSync('/tmp/dir/foo', 'Hello, friend.');

      fs.symlinkSync('/tmp/dir/file', '/tmp/dir/link');
      avfs.symlinkSync('/tmp/dir/file', '/tmp/dir/link');

      fs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));
      avfs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));

      fs.mkdirSync('/tmp/dir/dperm');
      avfs.mkdirSync('/tmp/dir/dperm');

      fs.chmodSync('/tmp/dir/dperm', parseInt('000', 8));
      avfs.chmodSync('/tmp/dir/dperm', parseInt('000', 8));

      fd = {
        read: {
          fs:   fs.openSync('/tmp/dir/file', 'r'),
          avfs: avfs.openSync('/tmp/dir/file', 'r')
        },
        write: {
          fs:   fs.openSync('/tmp/dir/file', 'a'),
          avfs: avfs.openSync('/tmp/dir/file', 'a')
        },
        closed: {
          fs:   fs.openSync('/tmp/dir/file', 'r'),
          avfs: avfs.openSync('/tmp/dir/file', 'r')
        },
        dir: {
          fs:   fs.openSync('/tmp/dir', 'r'),
          avfs: avfs.openSync('/tmp/dir', 'r')
        }
      };

      fs.closeSync(fd.closed.fs);
      avfs.closeSync(fd.closed.avfs);
    });

    describe('appendFileSync()', function () {

      it('should throw on non existing parent directory', function () {
        check('appendFileSync', ['/tmp/dir/not/file', 'Hello, friend.']);
      });

      it('should throw on not directory parent', function () {
        check('appendFileSync', ['/tmp/dir/file/file', 'Hello, friend.']);
      });

      it('should throw on directory path', function () {
        check('appendFileSync', ['/tmp/dir', 'Hello, friend.']);
      });

      it('should throw on unknown encoding', function () {
        check('appendFileSync', ['/tmp/dir/file', 'Hello, friend.', 'utf5']);
      });

      it('should throw on non string path', function () {
        check('appendFileSync', [true]);
      });

      it('should throw on bad options type', function () {
        check('appendFileSync', ['/tmp/dir/file', 'Hello, friend.', true]);
      });

    });

    describe('chmodSync()', function () {

      it('should throw on bad path parameter type', function () {
        check('chmodSync', [false, '0700']);
      });

      it('should throw on bad mode parameter type', function () {
        check('chmodSync', ['/tmp/dir/file', false]);
      });

      it('should throw on non existing file', function () {
        check('chmodSync', ['/tmp/dir/not', '0700']);
      });

      it('should throw on non existing parent directory', function () {
        check('chmodSync', ['/tmp/dir/not/file', '0700']);
      });

      it('should throw on not directory parent', function () {
        check('chmodSync', ['/tmp/dir/file/file', '0700']);
      });

      it('should throw on not owned files', function () {
        check('chmodSync', ['/', '0777']);
      });

    });

    describe('chownSync()', function () {

      it('should throw on bad path parameter type', function () {
        check('chownSync', [false, 1001, 1001]);
      });

      it('should throw on bad uid parameter type', function () {
        check('chownSync', ['/tmp/dir/file', false, 1001]);
      });

      it('should throw on bad gid parameter type', function () {
        check('chownSync', ['/tmp/dir/file', 1001, false]);
      });

      it('should throw on non existing file', function () {
        check('chownSync', ['/tmp/dir/not', 1001, 1001]);
      });

      it('should throw on non existing parent directory', function () {
        check('chownSync', ['/tmp/dir/not/file', 1001, 1001]);
      });

      it('should throw on not directory parent', function () {
        check('chownSync', ['/tmp/dir/file/file', 1001, 1001]);
      });

      it('should throw on permission denied', function () {
        check('chownSync', ['/', 1001, 1001]);
      });

    });

    describe('closeSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('closeSync', [BAD_FD]);
      });

      it('should throw on non integer file descriptor', function () {
        check('closeSync', [false]);
      });

    });

    describe('fchmodSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fchmodSync', [BAD_FD, '0700']);
      });

      it('should throw on non integer file descriptor', function () {
        check('fchmodSync', [false, '0700']);
      });

      it('should throw on bad mode parameter type', function () {
        check('fchmodSync', {
          fs:   [fd.read.fs,   false],
          avfs: [fd.read.avfs, false]
        });
      });

    });

    describe('fchownSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fchownSync', [BAD_FD, 1001, 1001]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fchownSync', [true, 1001, 1001]);
      });

      it('should throw on negative uid parameter', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   -1, 1001],
          avfs: [fd.read.avfs, -1, 1001]
        });
      });

      it('should throw on negative gid parameter', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   1001, -1],
          avfs: [fd.read.avfs, 1001, -1]
        });
      });

      it('should throw on bad uid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   false, 1001],
          avfs: [fd.read.avfs, false, 1001]
        });
      });

      it('should throw on bad gid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   1001, false],
          avfs: [fd.read.avfs, 1001, false]
        });
      });

    });

    describe('fstatSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fstatSync', [BAD_FD]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fstatSync', [true]);
      });

    });

    describe('fsyncSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fsyncSync', [BAD_FD]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fsyncSync', [true]);
      });

    });

    describe('ftruncateSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('ftruncateSync', [BAD_FD]);
      });

      it('should throw on non integer file descriptor', function () {
        check('ftruncateSync', [true]);
      });

      it('should throw on non integer length', function () {
        check('ftruncateSync', {
          fs:   [fd.read.fs,   {}],
          avfs: [fd.read.avfs, {}]
        });
      });

    });

    describe('futimesSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('futimesSync', [BAD_FD, 0, 0]);
      });

      it('should throw on non integer file descriptor', function () {
        check('futimesSync', [true, 0, 0]);
      });

      it('should throw on bad atime parameter type', function () {
        check('futimesSync', {
          fs:   [fd.read.fs,   false, 0],
          avfs: [fd.read.avfs, false, 0]
        });
      });

      it('should throw on bad mtime parameter type', function () {
        check('futimesSync', {
          fs:   [fd.read.fs,   0, false],
          avfs: [fd.read.avfs, 0, false]
        });
      });

      it('should throw on bad time parameter type first', function () {
        check('futimesSync', {
          fs:   [true, true, true],
          avfs: [true, true, true]
        });
      });

    });

    describe('linkSync()', function () {

      it('should throw on directory source', function () {
        check('linkSync', ['/tmp/dir', '/tmp/link']);
      });

      it('should throw on existing destination', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/file']);
      });

      it('should throw on non existing parent directory in source path', function () {
        check('linkSync', ['/tmp/dir/not/file', '/tmp/dir/link']);
      });

      it('should throw on not directory parent in source path', function () {
        check('linkSync', ['/tmp/dir/file/file', '/tmp/dir/link']);
      });

      it('should throw on non existing parent directory in destination path', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/not/link']);
      });

      it('should throw on not directory parent in destination path', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/file/link']);
      });

      it('should throw on non string source path', function () {
        check('linkSync', [true, '/tmp/dir/link']);
      });

      it('should throw on non string destination path', function () {
        check('linkSync', ['/tmp/dir/file', true]);
      });

    });

    describe('lstatSync()', function () {

      it('should throw on non existing path', function () {
        check('lstatSync', ['/tmp/dir/not']);
      });

      it('should throw on non existing parent directory', function () {
        check('lstatSync', ['/tmp/dir/not/file']);
      });

      it('should throw on not directory parent', function () {
        check('lstatSync', ['/tmp/dir/file/file']);
      });

      it('should throw on non string path', function () {
        check('lstatSync', [true]);
      });

    });

    describe('mkdirSync()', function () {

      it('should throw on existing path', function () {
        check('mkdirSync', ['/tmp/dir']);
      });

      it('should throw on non existing parent directory', function () {
        check('mkdirSync', ['/tmp/dir/not/dir']);
      });

      it('should throw on not directory parent', function () {
        check('mkdirSync', ['/tmp/dir/file/dir']);
      });

      it('should throw on non string path', function () {
        check('mkdirSync', [true]);
      });

    });

    describe('mkdtemp()', function () {

      it('should throw on non function callback', function () {
        check('mkdtemp', ['test-', false]);
      });

    });

    describe('openSync()', function () {

      it('should throw on bad path type', function () {
        check('openSync', [false, 'r']);
      });

      it('should throw on bad flags type', function () {
        check('openSync', ['/tmp/dir/file', false]);
      });

      it('should throw on non unknown flags', function () {
        check('openSync', ['/tmp/dir/file', 'p']);
      });

      it('should throw on non existing file in read mode', function () {
        ['r', 'r+', 'rs', 'rs+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir/not', flags]);
        });
      });

      it('should throw on existing file in exclusive mode', function () {
        ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir/file', flags]);
        });
      });

      it('should throw on directory in write mode', function () {
        ['r+', 'rs+', 'w', 'w+', 'a', 'a+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir', flags]);
        });
      });

      it('should throw on non existing parent directory', function () {
        check('openSync', ['/tmp/dir/not/file', 'w']);
      });

      it('should throw on non directory parent', function () {
        check('openSync', ['/tmp/dir/file/file', 'w']);
      });

      it('should throw on permission denied', function () {
        check('openSync', ['/tmp/dir/perm', 'r']);
      });

    });

    describe('readdirSync()', function () {

      it('should throw on non existing path', function () {
        check('readdirSync', ['/tmp/dir/not']);
      });

      it('should throw on file', function () {
        check('readdirSync', ['/tmp/dir/file']);
      });

      it('should throw on non string path', function () {
        check('readdirSync', [true]);
      });

    });

    describe('readFileSync()', function () {

      it('should throw on non existing file', function () {
        check('readFileSync', ['/tmp/dir/not']);
      });

      it('should throw on directory', function () {
        check('readFileSync', ['/tmp/dir']);
      });

      it('should throw on unknown encoding', function () {
        check('readFileSync', ['/tmp/dir/file', 'utf5']);
      });

      it('should throw on non string path', function () {
        check('readFileSync', [true]);
      });

      it('should throw on bad options type', function () {
        check('readFileSync', ['/tmp/dir/file', true]);
      });

    });

    describe('readlinkSync()', function () {

      it('should throw on non symlink', function () {
        check('readlinkSync', ['/tmp/dir/file']);
      });

      it('should throw on non existing parent directory', function () {
        check('readlinkSync', ['/tmp/dir/not/file']);
      });

      it('should throw on non directory parent', function () {
        check('readlinkSync', ['/tmp/dir/file/link']);
      });

      it('should throw on non string path', function () {
        check('readlinkSync', [true]);
      });

    });

    describe('readSync()', function () {

      it('should fail on non existing fd', function () {
        check('readSync', [BAD_FD, new Buffer(5), 0, 5, 0]);
      });

      it('should fail on closed fd', function () {
        check('readSync', {
          fs:   [fd.closed.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.closed.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should fail on non reading fd', function () {
        check('readSync', {
          fs:   [fd.write.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.write.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should fail on directory', function () {
        check('readSync', {
          fs:   [fd.dir.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.dir.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should throw on bad fd type', function () {
        check('readSync', [true, new Buffer(5), 0, 5, 0]);
      });

      it('should throw on offset out of bounds', function () {
        check('readSync', {
          fs:   [fd.read.fs,   new Buffer(5), 1000, 5, 0],
          avfs: [fd.read.avfs, new Buffer(5), 1000, 5, 0]
        });
      });

      it('should throw on length beyond buffer', function () {
        check('readSync', {
          fs:   [fd.read.fs,   new Buffer(5), 0, 1000, 0],
          avfs: [fd.read.avfs, new Buffer(5), 0, 1000, 0]
        });
      });

    });

    describe('realpathSync()', function () {

      it('should throw on non existing element', function () {
        check('realpathSync', ['/tmp/dir/not']);
      });

      it('should throw on not string path', function () {
        check('realpathSync', [false]);
      });

      it('should throw on not string path in cache', function () {
        check('realpathSync', ['/tmp/dir/file', {'/tmp/dir': false}]);
      });

    });

    describe('renameSync()', function () {

      it('should throw on non existing source', function () {
        check('renameSync', ['/tmp/dir/not', '/tmp/dir/new']);
      });

      it('should throw on non existing destination', function () {
        check('renameSync', ['/tmp/dir/file', '/tmp/dir/not/new']);
      });

      it('should throw on new path under old path', function () {
        check('renameSync', ['/tmp', '/tmp/new']);
      });

      it('should throw on not directory parent', function () {
        check('renameSync', ['/tmp/dir/file/file', '/tmp/dir/new']);
      });

      it('should throw on not writable parent directory', function () {
        check('renameSync', ['/tmp/dir/dperm/file', '/tmp/dir/new']);
      });

      it('should throw on not writable destination directory', function () {
        check('renameSync', ['/tmp/dir/file', '/tmp/dir/dperm/new']);
      });

      it('should throw on not string source', function () {
        check('renameSync', [true, '/tmp/dir/new']);
      });

      it('should throw on not string destination', function () {
        check('renameSync', ['/tmp/dir/new', true]);
      });

    });

    describe('rmdirSync()', function () {

      it('should throw on non existing path', function () {
        check('rmdirSync', ['/tmp/dir/not']);
      });

      it('should throw on file', function () {
        check('rmdirSync', ['/tmp/dir/file']);
      });

      it('should throw on non string path', function () {
        check('rmdirSync', [true]);
      });

      it('should throw on not writable parent directory', function () {
        check('rmdirSync', ['/tmp/dir/dperm/dir']);
      });

    });

    describe('statSync()', function () {

      it('should throw on non existing path', function () {
        check('statSync', ['/tmp/dir/not']);
      });

      it('should throw on non directory parent', function () {
        check('statSync', ['/tmp/dir/file/file']);
      });

      it('should throw on non string path', function () {
        check('statSync', [true]);
      });

    });

    describe('symlinkSync()', function () {

      it('should throw on existing destination', function () {
        check('symlinkSync', ['/tmp/dir/file', '/tmp/dir/foo']);
      });

      it('should throw on non existing parent directory in destination path', function () {
        check('symlinkSync', ['/tmp/dir/file', '/tmp/dir/not/link']);
      });

      it('should throw on not directory parent in destination path', function () {
        check('symlinkSync', ['/tmp/dir/file', '/tmp/dir/foo/link']);
      });

      it('should throw on non string source path', function () {
        check('symlinkSync', [true, '/tmp/dir/link']);
      });

      it('should throw on non string destination path', function () {
        check('symlinkSync', ['/tmp/dir/file', true]);
      });

      it('should throw on not writable destination directory', function () {
        check('symlinkSync', ['/tmp/dir/file', '/tmp/dir/dperm/link']);
      });

    });

    describe('truncateSync()', function () {

      it('should throw on non existing path', function () {
        check('truncateSync', ['/tmp/dir/not']);
      });

      it('should throw on directory', function () {
        check('truncateSync', ['/tmp/dir']);
      });

      it('should throw on non string path', function () {
        check('truncateSync', [true]);
      });

      it('should throw on non integer length', function () {
        check('truncateSync', ['/tmp/dir/file', {}]);
      });

    });

    describe('unlinkSync()', function () {

      it('should throw on non existing path', function () {
        check('unlinkSync', ['/tmp/dir/not']);
      });

      it('should throw on directory', function () {
        check('unlinkSync', ['/tmp/dir']);
      });

      it('should throw on non string path', function () {
        check('unlinkSync', [true]);
      });

      it('should throw on not writable parent directory', function () {
        check('unlinkSync', ['/tmp/dir/dperm/not']);
      });

    });

    describe('utimesSync()', function () {

      it('should throw on non existing path', function () {
        check('utimesSync', ['/tmp/dir/not', 0, 0]);
      });

      it('should throw on non existing parent directory', function () {
        check('utimesSync', ['/tmp/dir/not/file', 0, 0]);
      });

      it('should throw on not directory parent', function () {
        check('utimesSync', ['/tmp/dir/file/new', 0, 0]);
      });

      it('should throw on non string path', function () {
        check('utimesSync', [true, 0, 0]);
      });

      it('should throw bad atime parameter type', function () {
        check('utimesSync', ['/tmp/dir/file', false, 0]);
      });

      it('should throw bad mtime parameter type', function () {
        check('utimesSync', ['/tmp/dir/file', 0, false]);
      });

    });

    describe('writeFileSync()', function () {

      it('should throw on non existing parent directory', function () {
        check('writeFileSync', ['/tmp/dir/not/file', 'Hello, friend.']);
      });

      it('should throw on not directory parent', function () {
        check('writeFileSync', ['/tmp/dir/file/file', 'Hello, friend.']);
      });

      it('should throw on directory path', function () {
        check('writeFileSync', ['/tmp/dir', 'Hello, friend.']);
      });

      it('should throw on unknown encoding', function () {
        check('writeFileSync', ['/tmp/dir/file', 'Hello, friend.', 'utf5']);
      });

      it('should throw on non string path', function () {
        check('writeFileSync', [true]);
      });

      it('should throw on bad options type', function () {
        check('writeFileSync', ['/tmp/dir/file', 'Hello, friend.', true]);
      });

    });

    describe('writeSync()', function () {

      // Critical error in node v0.12
      // See https://github.com/nodejs/node/issues/1550
      if (version !== 'v0.12') {

        it('should throw on non existing file descriptor', function () {
          check('writeSync', [BAD_FD, new Buffer('Hello, friend'), 0, 5, 0]);
        });

        it('should throw on non integer file descriptor', function () {
          check('writeSync', {
            fs:   [true, new Buffer('Hello, friend'), 0, 5, 0],
            avfs: [true, new Buffer('Hello, friend'), 0, 5, 0]
          });
        });

      }

      it('should throw on closed file descriptor', function () {
        check('writeSync', {
          fs:   [fd.closed.fs,   new Buffer('Hello, friend'), 0, 5, 0],
          avfs: [fd.closed.avfs, new Buffer('Hello, friend'), 0, 5, 0]
        });
      });

      it('should throw on non writing file descriptor', function () {
        check('writeSync', {
          fs:   [fd.read.fs,   new Buffer('Hello, friend'), 0, 5, 0],
          avfs: [fd.read.avfs, new Buffer('Hello, friend'), 0, 5, 0]
        });
      });

      if (version !== 'v0.10') {

        it('should throw on offset out of bounds', function () {
          check('writeSync', {
            fs:   [fd.write.fs,   new Buffer('Hello, friend'), 1000, 0, 0],
            avfs: [fd.write.avfs, new Buffer('Hello, friend'), 1000, 0, 0]
          });
        });

      }

      it('should throw on length beyond buffer', function () {
        check('writeSync', {
          fs:   [fd.write.fs,   new Buffer('Hello, friend'), 0, 1000, 0],
          avfs: [fd.write.avfs, new Buffer('Hello, friend'), 0, 1000, 0]
        });
      });

      if (version !== 'v0.10') {

        // fs.writeSync(fd, data[, position[, encoding]]);

        if (version !== 'v0.12') {

          it('should throw on non existing file descriptor', function () {
            check('writeSync', [BAD_FD, 'Hello, friend']);
          });

          it('should throw on non integer file descriptor', function () {
            check('writeSync', {
              fs:   [true, 'Hello, friend'],
              avfs: [true, 'Hello, friend']
            });
          });

        }

        it('should throw on closed file descriptor', function () {
          check('writeSync', {
            fs:   [fd.closed.fs,   'Hello, friend'],
            avfs: [fd.closed.avfs, 'Hello, friend']
          });
        });

        it('should throw on non writing file descriptor', function () {
          check('writeSync', {
            fs:   [fd.read.fs,   'Hello, friend'],
            avfs: [fd.read.avfs, 'Hello, friend']
          });
        });

      }

    });

    after('clean files', function () {
      fs.chmodSync('/tmp/dir/dperm', parseInt('777', 8));

      rimraf.sync('/tmp/dir');
    });

  });
}
