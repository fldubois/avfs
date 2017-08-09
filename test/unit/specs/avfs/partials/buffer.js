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

  if (semver.gte(process.version, '6.0.0')) {

    describe('Buffer API', function () {

      function checkArg(method, base, indexes, parameters, basic) {

        it(pad(method, 17) + '() should accept paths as Buffer', function () {
          var target = basic === false ? fs : fs.base;

          sinon.stub(target, base);

          fs[method].apply(fs, parameters);

          expect(target[base]).to.have.callCount(1);

          indexes.forEach(function (index) {
            expect(parameters[index]).to.be.an.instanceof(Buffer);
            expect(target[base].getCall(0).args[index]).to.be.a('string');
          });

          target[base].restore();
        });

      }

      function checkRes(method, base, parameters, isArray) {

        it(pad(method, 17) + '() should return paths as Buffer', function () {
          var paths = (isArray === true) ? ['path/to/fileA', 'path/to/fileB'] : '/path/to/file';

          sinon.stub(fs.base, base);

          fs.base[base].returns(paths);

          var convert = function (encoding) {
            if (isArray === true) {
              return paths.map(function (path) {
                return (encoding === 'buffer') ? path : Buffer.from(path).toString(encoding);
              });
            }

            return (encoding === 'buffer') ? paths : Buffer.from(paths).toString(encoding);
          };

          var specs = [
            {options: void 0,               type: 'string', result: convert('utf8')},
            {options: {},                   type: 'string', result: convert('utf8')},
            {options: {encoding: 'utf8'},   type: 'string', result: convert('utf8')},
            {options: {encoding: 'utf8'},   type: 'string', result: convert('utf8')},
            {options: 'ascii',              type: 'string', result: convert('ascii')},
            {options: {encoding: 'ascii'},  type: 'string', result: convert('ascii')},
            {options: 'buffer',             type: 'buffer', result: convert('buffer')},
            {options: {encoding: 'buffer'}, type: 'buffer', result: convert('buffer')}
          ];

          specs.forEach(function (spec) {
            var result = fs[method].apply(fs, [].concat(parameters, spec.options));

            var check = function (value, expectation) {
              if (spec.type === 'buffer') {
                expect(value).to.be.an.instanceof(Buffer);
                expect(value.toString()).to.equal(expectation);
              } else {
                expect(value).to.be.a('string');
                expect(value).to.equal(expectation);
              }
            };

            if (isArray === true) {
              expect(result).to.be.an('array');

              result.forEach(function (value, index) {
                check(value, spec.result[index]);
              });
            } else {
              expect(result).not.to.be.an('array');

              check(result, spec.result);
            }
          });

          fs.base[base].restore();
        });

      }

      checkArg('accessSync',        'access',      [0],    [Buffer.from('/file'), fs.R_OK]);
      checkArg('appendFileSync',    'appendFile',  [0],    [Buffer.from('/file'), 'Hello, world', {encoding: 'utf8'}]);
      checkArg('chmodSync',         'chmod',       [0],    [Buffer.from('/file'), '0666']);
      checkArg('chownSync',         'chown',       [0],    [Buffer.from('/file'), 1000, 1000]);
      checkArg('createReadStream',  'ReadStream',  [0],    [Buffer.from('/file')], false);
      checkArg('createWriteStream', 'WriteStream', [0],    [Buffer.from('/file')], false);
      checkArg('existsSync',        'exists',      [0],    [Buffer.from('/file')]);
      checkArg('lchmodSync',        'lchmod',      [0],    [Buffer.from('/file'), '0666']);
      checkArg('lchownSync',        'lchown',      [0],    [Buffer.from('/file'), 1000, 1000]);
      checkArg('linkSync',          'link',        [0, 1], [Buffer.from('/src'), Buffer.from('/dst')]);
      checkArg('lstatSync',         'lstat',       [0],    [Buffer.from('/file')]);
      checkArg('mkdirSync',         'mkdir',       [0],    [Buffer.from('/dir'), '0666']);
      checkRes('mkdtempSync',       'mkdtemp',             ['prefix']);
      checkArg('openSync',          'open',        [0],    [Buffer.from('/file'), 'r', '0666']);
      checkArg('readdirSync',       'readdir',     [0],    [Buffer.from('/dir')]);
      checkRes('readdirSync',       'readdir',             ['/dir'], true);
      checkArg('readFileSync',      'readFile',    [0],    [Buffer.from('/file'), {encoding: 'utf8'}]);
      checkArg('readlinkSync',      'readlink',    [0],    [Buffer.from('/link')]);
      checkRes('readlinkSync',      'readlink',            ['/link']);
      checkArg('realpathSync',      'realpath',    [0],    [Buffer.from('/link')]);
      checkRes('realpathSync',      'realpath',            ['/link']);
      checkArg('renameSync',        'rename',      [0, 1], [Buffer.from('/old'), Buffer.from('/new')]);
      checkArg('rmdirSync',         'rmdir',       [0],    [Buffer.from('/dir')]);
      checkArg('statSync',          'stat',        [0],    [Buffer.from('/file')]);
      checkArg('symlinkSync',       'symlink',     [0, 1], [Buffer.from('/src'), Buffer.from('/dst')]);
      checkArg('truncateSync',      'truncate',    [0],    [Buffer.from('/file'), 20]);
      checkArg('unlinkSync',        'unlink',      [0],    [Buffer.from('/file')]);
      checkArg('utimesSync',        'utimes',      [0],    [Buffer.from('/file'), 946681200, 946681200]);
      checkArg('writeFileSync',     'writeFile',   [0],    [Buffer.from('/file'), 'Hello, world', {encoding: 'utf8'}]);
      checkArg('watch',             'watch',       [0],    [Buffer.from('/file'), {persistent: true}, noop]);
      checkArg('watchFile',         'watchFile',   [0],    [Buffer.from('/file'), {persistent: true}, noop]);
      checkArg('unwatchFile',       'unwatchFile', [0],    [Buffer.from('/file'), noop]);

    });

  }

};
