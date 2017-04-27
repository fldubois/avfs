'use strict';

var fs   = require('fs');
var path = require('path');

var chai   = require('chai');
var expect = chai.expect;
var rimraf = require('rimraf');

var version = require('lib/common/version');

var supported = fs.readdirSync(path.join(__dirname, '../../lib'));

if (supported.indexOf(version) !== -1) {
  var AVFS = require('lib/avfs');

  var avfs = new AVFS();

  var check = function (method, params) {
    var errors = {};

    try {
      fs[method].apply(fs, params);
    } catch (error) {
      errors.fs = error;
    }

    try {
      avfs[method].apply(avfs, params);
    } catch (error) {
      errors.avfs = error;
    }

    expect(errors.avfs.message).to.equal(errors.fs.message);

    expect(Object.keys(errors.avfs)).to.deep.equal(Object.keys(errors.fs));

    Object.keys(errors.avfs).forEach(function (key) {
      expect(errors.avfs[key]).to.equal(errors.fs[key]);
    });
  };

  describe('errors', function () {

    before('create files', function () {
      avfs.mkdirSync('/tmp');

      fs.mkdirSync('/tmp/dir');
      avfs.mkdirSync('/tmp/dir');

      fs.writeFileSync('/tmp/dir/file', 'Hello, friend.');
      avfs.writeFileSync('/tmp/dir/file', 'Hello, friend.');
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

    after('clean files', function () {
      rimraf.sync('/tmp/dir');
    });

  });
}
