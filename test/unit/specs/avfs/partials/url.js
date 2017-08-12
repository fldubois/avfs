'use strict';

var url = require('url');

var chai   = require('chai');
var expect = chai.expect;
var pad    = require('lodash.padstart');
var semver = require('semver');
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

function createURL(str) {
  if (url.hasOwnProperty('URL')) {
    return new url.URL(str);
  }

  return url.parse(str);
}

module.exports = function (fs) {

  if (semver.gte(process.version, '7.0.0')) {

    describe('WHATWG URL API', function () {

      function checkArg(method, base, indexes, parameters, basic) {

        it(pad(method, 17) + '() should accept paths as WHATWG URL', function () {
          var target = basic === false ? fs : fs.base;

          sinon.stub(target, base);

          var results = [];

          indexes.forEach(function (index) {
            results[index]    = parameters[index];
            parameters[index] = createURL('file://' + parameters[index]);
          });

          fs[method].apply(fs, parameters);

          expect(target[base]).to.have.callCount(1);

          indexes.forEach(function (index) {
            expect(target[base].getCall(0).args[index]).to.be.a('string');
            expect(target[base].getCall(0).args[index]).to.equal(results[index]);
          });

          target[base].restore();
        });

      }

      checkArg('accessSync',        'access',      [0],    ['/file', fs.R_OK]);
      checkArg('appendFileSync',    'appendFile',  [0],    ['/file', 'Hello, world', {encoding: 'utf8'}]);
      checkArg('chmodSync',         'chmod',       [0],    ['/file', '0666']);
      checkArg('chownSync',         'chown',       [0],    ['/file', 1000, 1000]);
      checkArg('createReadStream',  'ReadStream',  [0],    ['/file'], false);
      checkArg('createWriteStream', 'WriteStream', [0],    ['/file'], false);
      checkArg('existsSync',        'exists',      [0],    ['/file']);
      checkArg('lchmodSync',        'lchmod',      [0],    ['/file', '0666']);
      checkArg('lchownSync',        'lchown',      [0],    ['/file', 1000, 1000]);
      checkArg('linkSync',          'link',        [0, 1], ['/src', '/dst']);
      checkArg('lstatSync',         'lstat',       [0],    ['/file']);
      checkArg('mkdirSync',         'mkdir',       [0],    ['/dir', '0666']);
      checkArg('openSync',          'open',        [0],    ['/file', 'r', '0666']);
      checkArg('readdirSync',       'readdir',     [0],    ['/dir']);
      checkArg('readFileSync',      'readFile',    [0],    ['/file', {encoding: 'utf8'}]);
      checkArg('readlinkSync',      'readlink',    [0],    ['/link']);
      checkArg('realpathSync',      'realpath',    [0],    ['/link']);
      checkArg('renameSync',        'rename',      [0, 1], ['/old', '/new']);
      checkArg('rmdirSync',         'rmdir',       [0],    ['/dir']);
      checkArg('statSync',          'stat',        [0],    ['/file']);
      checkArg('symlinkSync',       'symlink',     [0, 1], ['/src', '/dst']);
      checkArg('truncateSync',      'truncate',    [0],    ['/file', 20]);
      checkArg('unlinkSync',        'unlink',      [0],    ['/file']);
      checkArg('utimesSync',        'utimes',      [0],    ['/file', 946681200, 946681200]);
      checkArg('writeFileSync',     'writeFile',   [0],    ['/file', 'Hello, world', {encoding: 'utf8'}]);
      checkArg('watch',             'watch',       [0],    ['/file', {persistent: true}, noop]);
      checkArg('watchFile',         'watchFile',   [0],    ['/file', {persistent: true}, noop]);
      checkArg('unwatchFile',       'unwatchFile', [0],    ['/file', noop]);

    });

  }

};
