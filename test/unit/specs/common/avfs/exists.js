'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/common/avfs/exists');

var Storage = require('lib/common/storage');

describe('common/avfs/exists', function () {

  var storage = new Storage(constants);

  var base = factory(storage);

  before(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.'))
    });
  });

  describe('exists()', function () {

    it('should return true for existing file', function () {
      expect(base.exists('/file')).to.equal(true);
    });

    it('should return false for non existing file', function () {
      expect(base.exists('/not')).to.equal(false);
    });

    it('should return false for bad parameter', function () {
      expect(base.exists('\u0000')).to.equal(false);
      expect(base.exists(0)).to.equal(false);
      expect(base.exists(false)).to.equal(false);
      expect(base.exists([])).to.equal(false);
      expect(base.exists({})).to.equal(false);
    });

  });

});
