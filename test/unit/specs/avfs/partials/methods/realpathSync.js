'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('realpathSync()', function () {

    it('should resolve symlinks and cached links', function () {
      expect(fs.realpathSync('/dir/dlink/link')).to.equal('/tmp/file');
      expect(fs.realpathSync('/cache/file', {'/cache': '/tmp'})).to.equal('/tmp/file');
      expect(fs.realpathSync('/cache/link', {'/cache': '/dir/dlink'})).to.equal('/tmp/file');
    });

    it('should directly resolve fully cached links', function () {
      expect(fs.realpathSync('/falsy', {'/falsy': false})).to.equal(false);
    });

    it('should throw on non existing element', function () {
      expect(function () {
        fs.realpathSync('/not/test.txt');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not string path', function () {
      expect(function () {
        fs.realpathSync(false);
      }).to.throw(TypeError);
    });

    it('should throw on not string path in cache', function () {
      expect(function () {
        fs.realpathSync('/tmp/not/file', {'/tmp/not': false});
      }).to.throw(TypeError);
    });

  });

};
