'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('realpathSync()', function () {

    it('should resolve symlinks and cached links', function () {
      expect(fs.realpathSync('/cache/link', {'/cache': '/dir/dlink'})).to.equal('/tmp/file');
    });

    it('should throw on non existing element', function () {
      expect(function () {
        fs.realpathSync('/not/test.txt');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not string path', function () {
      expect(function () {
        fs.realpathSync(false);
      }).to.throw(TypeError, 'Arguments to path.resolve must be strings');
    });

    it('should throw on not string path in cache', function () {
      expect(function () {
        fs.realpathSync('/not', {'/not': false});
      }).to.throw(TypeError, 'Arguments to path.resolve must be strings');
    });

  });

};
