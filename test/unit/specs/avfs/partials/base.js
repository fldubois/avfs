'use strict';

var chai   = require('chai');
var expect = chai.expect;
var pad    = require('lodash.padstart');
var semver = require('semver');
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('Base functions', function () {

    function check(method, base, parameters) {

      it(pad(method, 14) + '() should call the base function ' + base + '()', function () {
        sinon.stub(fs.base, base);

        fs[method].apply(fs, parameters);

        expect(fs.base[base]).to.have.callCount(1);

        parameters.forEach(function (parameter, index) {
          expect(fs.base[base].getCall(0).args[index]).to.equal(parameter);
        });

        fs.base[base].restore();
      });

    }

    if (semver.gte(process.version, '0.12.0')) {
      check('accessSync', 'access', ['/file', fs.R_OK]);
    }

    check('appendFileSync', 'appendFile',  ['/file', 'Hello, world', {encoding: 'utf8'}]);
    check('chmodSync',      'chmod',       ['/file', '0666']);
    check('chownSync',      'chown',       ['/file', 1000, 1000]);
    check('closeSync',      'close',       [0]);
    check('existsSync',     'exists',      ['/file']);
    check('fchmodSync',     'fchmod',      [0, '0666']);
    check('fchownSync',     'fchown',      [0, 1000, 1000]);
    check('fdatasyncSync',  'fdatasync',   [0]);
    check('fstatSync',      'fstat',       [0]);
    check('fsyncSync',      'fsync',       [0]);
    check('ftruncateSync',  'ftruncate',   [0, 20]);
    check('futimesSync',    'futimes',     [0, 946681200, 946681200]);
    check('lchmodSync',     'lchmod',      ['/file', '0666']);
    check('lchownSync',     'lchown',      ['/file', 1000, 1000]);
    check('linkSync',       'link',        ['/src', '/dst']);
    check('lstatSync',      'lstat',       ['/file']);
    check('mkdirSync',      'mkdir',       ['/file', '0666']);

    if (semver.gte(process.version, '4.0.0')) {
      check('mkdtempSync', 'mkdtemp', ['test']);
    }

    check('openSync',       'open',        ['/file', 'r', '0666']);
    check('readdirSync',    'readdir',     ['/file']);
    check('readFileSync',   'readFile',    ['/file', {encoding: 'utf8'}]);
    check('readlinkSync',   'readlink',    ['/link']);
    check('readSync',       'read',        [0, new Buffer(40), 10, 20, 5]);

    if (semver.lt(process.version, '6.0.0')) {
      check('realpathSync', 'realpath', ['/dir/file', {'/dir': '/other'}]);
    } else {
      check('realpathSync', 'realpath', ['/dir/file']);
    }

    check('renameSync',     'rename',      ['/old', '/new']);
    check('rmdirSync',      'rmdir',       ['/file']);
    check('statSync',       'stat',        ['/file']);
    check('symlinkSync',    'symlink',     ['/src', '/dst']);
    check('truncateSync',   'truncate',    ['/file', 20]);
    check('unlinkSync',     'unlink',      ['/file']);
    check('utimesSync',     'utimes',      ['/file', 946681200, 946681200]);
    check('writeFileSync',  'writeFile',   ['/file', 'Hello, world', {encoding: 'utf8'}]);
    check('writeSync',      'write',       [0, new Buffer(40), 10, 20, 5]);
    check('watch',          'watch',       ['/file', {persistent: true}, noop]);
    check('watchFile',      'watchFile',   ['/file', {persistent: true}, noop]);
    check('unwatchFile',    'unwatchFile', ['/file', noop]);

  });

};
