'use strict';

var os = require('os');

var url = require('url');

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');
var parsers   = require('lib/common/parsers')(constants);

function createURL(str) {
  if (url.hasOwnProperty('URL')) {
    return new url.URL(str);
  }

  return url.parse(str);
}

describe('common/parsers', function () {

  describe('flags()', function () {

    it('should parse string to parsers', function () {
      var specs = [
        {flag: constants.O_RDONLY, values: ['r', 'rs']},
        {flag: constants.O_WRONLY, values: ['w', 'wx', 'xw']},
        {flag: constants.O_RDWR,   values: ['r+', 'rs+', 'w+', 'wx+', 'xw+']},
        {flag: constants.O_CREAT,  values: ['w', 'wx', 'xw', 'w+', 'wx+', 'xw+', 'a', 'ax', 'xa', 'a+', 'ax+', 'xa+']},
        {flag: constants.O_TRUNC,  values: ['w', 'wx', 'xw', 'w+', 'wx+', 'xw+']},
        {flag: constants.O_APPEND, values: ['a', 'ax', 'xa', 'a+', 'ax+', 'xa+']},
        {flag: constants.O_EXCL,   values: ['xw', 'xw+', 'xa', 'xa+']}
      ];

      specs.forEach(function (spec) {
        spec.values.forEach(function (value) {
          var flag = spec.flag;

          expect(parsers.flags(value) & flag).to.equal(flag, value + ' should contain ' + spec.flag + ' flag');
        });
      });
    });

    it('should throw on unknown parsers', function () {
      expect(function () {
        parsers.flags('b');
      }).to.throw(Error, 'Unknown file open flag: b');
    });

    it('should do nothing on non string parameter', function () {
      expect(parsers.flags(1)).to.equal(1);
      expect(parsers.flags(true)).to.equal(true);
      expect(parsers.flags({})).to.deep.equal({});
    });

  });

  describe('mode()', function () {

    it('should parse mode string to number', function () {
      var specs = [
        {mode: '0666', value: parseInt('666', 8)},
        {mode: '0777', value: parseInt('777', 8)},
        {mode: '0100', value: parseInt('100', 8)},
        {mode: '0030', value: parseInt('030', 8)},
        {mode: '0007', value: parseInt('007', 8)},
        {mode: '0706', value: parseInt('706', 8)},
        {mode: '0051', value: parseInt('051', 8)},
        {mode: '0650', value: parseInt('650', 8)}
      ];

      specs.forEach(function (spec) {
        expect(parsers.mode(spec.mode)).to.equal(spec.value, spec.mode + 'mode  should equal ' + spec.value);
      });
    });

    it('should return the value on number parameter', function () {
      expect(parsers.mode(0)).to.equal(0);
      expect(parsers.mode(7)).to.equal(7);

      expect(parsers.mode(511)).to.equal(511);
      expect(parsers.mode(438)).to.equal(438);
    });

    it('should return NaN on non octal string', function () {
      expect(Number.isNaN(parsers.mode('9'))).to.equal(true, 'should return NaN');
    });

    it('should return default on bad type', function () {
      expect(parsers.mode(null, 511)).to.equal(511);
      expect(parsers.mode(true, 511)).to.equal(511);

      expect(parsers.mode({}, '0777')).to.equal(511);
      expect(parsers.mode([], '0777')).to.equal(511);
    });

    it('should return null on bad type without default', function () {
      expect(parsers.mode(null)).to.equal(null);
      expect(parsers.mode(true)).to.equal(null);

      expect(parsers.mode({})).to.equal(null);
      expect(parsers.mode([])).to.equal(null);
    });
  });

  describe('path()', function () {

    it('should return path elements', function () {
      expect(parsers.path('/')).to.deep.equal([]);
      expect(parsers.path('/path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(parsers.path('path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(parsers.path('C:\\path\\to\\file.txt')).to.deep.equal(['C:', 'path', 'to', 'file.txt']);
      expect(parsers.path('path\\to\\file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
    });

  });

  describe('url()', function () {

    it('should return non url parameter', function () {
      [void 0, null, 1, 'test', true, {}, []].forEach(function (param) {
        expect(parsers.url(param)).to.equal(param);
      });
    });

    it('should extract path from url', function () {
      expect(parsers.url(createURL('file:///'))).to.equal('/');
      expect(parsers.url(createURL('file:///test'))).to.equal('/test');
      expect(parsers.url(createURL('file:///test/file'))).to.equal('/test/file');
    });

    it('should throw on bad protocol', function () {
      expect(function () {
        parsers.url(createURL('http://www.example.com'));
      }).to.throw(TypeError, 'Only `file:` URLs are supported');
    });

    it('should throw on specified hostname', function () {
      var message = 'File URLs on ' + os.platform() + ' must use hostname \'localhost\' or not specify any hostname';

      expect(function () {
        parsers.url(createURL('file://host/file'));
      }).to.throw(TypeError, message);
    });

    it('should throw on encoded /', function () {
      expect(function () {
        parsers.url(createURL('file:///' + encodeURIComponent('test/file')));
      }).to.throw(TypeError, 'Path must not include encoded / characters');
    });

  });

});
