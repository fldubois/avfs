'use strict';

var path = require('path');

require('app-module-path').addPath(path.join(__dirname, '..'));

require('chai').use(function (chai, utils) {
  var Assertion = chai.Assertion;

  Assertion.addProperty('vfs', function () {
    utils.flag(this, 'vfs', true);
  });

  Assertion.addChainableMethod('file', function (filepath) {
    utils.expectTypes(this, ['object']);

    if (utils.flag(this, 'contains')) {
      var normalized = path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');
      var elements   = normalized.split(path.sep);
      var object     = this._obj;

      var messages = {
        fail:   'expected #{this} to include a vfs file at ' + filepath,
        negate: 'expected #{this} not to include a vfs file at ' + filepath
      };

      for (var i = 0; i < elements.length; i++) {
        object = object[elements[i]];

        this.assert(utils.type(object) === 'object', messages.fail, messages.negate);
      }

      return new Assertion(object).to.be.a.vfs.file();
    }

    new Assertion(this._obj).to.deep.equal({});

    var type = this._obj['@type'];

    this.assert(type === 'file', 'expected #{this} to be a vfs file', 'expected #{this} not to be a vfs file');
  }, function () {
    utils.flag(this, 'vfs.file', true);
  });

  Assertion.addChainableMethod('directory', function (directory) {
    utils.expectTypes(this, ['object']);

    var messages = null;

    if (utils.flag(this, 'contains')) {
      var normalized = path.normalize(directory).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');
      var elements   = normalized.split(path.sep);
      var object     = this._obj;

      messages = {
        fail:   'expected #{this} to include a vfs directory at ' + directory,
        negate: 'expected #{this} not to include a vfs directory at ' + directory
      };

      for (var i = 0; i < elements.length; i++) {
        object = object[elements[i]];

        this.assert(utils.type(object) === 'object', messages.fail, messages.negate);
      }

      return new Assertion(object).to.be.a.vfs.directory();
    }

    new Assertion(this._obj).to.deep.equal({});

    var type = this._obj['@type'];

    messages = {
      fail:   'expected #{this} to be a vfs directory',
      negate: 'expected #{this} not to be a vfs directory'
    };

    this.assert(type === 'directory', messages.fail, messages.negate);
  }, function () {
    utils.flag(this, 'vfs.directory', true);
  });

  Assertion.addMethod('mode', function (mode) {
    utils.expectTypes(this, ['object']);

    var actual   = this._obj['@mode'];
    var expected = parseInt(mode, 8);

    var messages = {
      fail:   'expected vfs file mode to be #{exp}',
      negate: 'expected vfs file mode to not be #{exp}'
    };

    this.assert(actual === expected, messages.fail, messages.negate, expected.toString(8), actual.toString(8), true);
  });

  Assertion.addMethod('clear', function () {
    utils.expectTypes(this, ['object']);

    var messages = null;

    if (utils.flag(this, 'vfs.file')) {
      var actual   = this._obj['@content'].toString();
      var expected = '';

      messages = {
        fail:   'expected vfs file to be empty',
        negate: 'expected vfs file to not be empty'
      };

      this.assert(actual === expected, messages.fail, messages.negate, expected, actual, true);
    } else if (utils.flag(this, 'vfs.directory')) {
      var children = Object.keys(this._obj);

      messages = {
        fail:   'expected vfs folder to be empty',
        negate: 'expected vfs folder to not be empty'
      };

      this.assert(children.length === 0, messages.fail, messages.negate, [], children, true);
    } else {
      throw new Error('clear() should be called on vfs element');
    }
  });

  Assertion.overwriteChainableMethod('contain', function (_super) {
    return function (content) {
      if (utils.flag(this, 'vfs.file')) {
        new Assertion(this._obj).to.be.a.vfs.file();

        var actual = this._obj['@content'];

        var equal = (actual.toString() === content.toString());

        var messages = {
          fail:   'expected virtual file to contain #{exp} but got #{act}',
          negate: 'expected virtual file to not contain #{act}'
        };

        this.assert(equal, messages.fail, messages.negate, content, actual.toString());
      } else {
        _super.apply(this, arguments);
      }
    };
  }, function (_super) {
    return _super;
  });
});
