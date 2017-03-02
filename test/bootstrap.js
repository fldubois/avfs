'use strict';

var path = require('path');

require('app-module-path').addPath(path.join(__dirname, '..'));

require('chai').use(function (chai, utils) {
  var Assertion = chai.Assertion;

  Assertion.addProperty('avfs', function () {
    utils.flag(this, 'avfs', true);
  });

  Assertion.addChainableMethod('file', function (filepath) {
    utils.expectTypes(this, ['object']);

    if (utils.flag(this, 'contains')) {
      var normalized = path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');
      var elements   = normalized.split(path.sep);
      var object     = this._obj;

      var messages = {
        fail:   'expected #{this} to include an avfs file at ' + filepath,
        negate: 'expected #{this} not to include an avfs file at ' + filepath
      };

      for (var i = 0; i < elements.length; i++) {
        object = object[elements[i]];

        this.assert(utils.type(object) === 'object', messages.fail, messages.negate);
      }

      return new Assertion(object).to.be.an.avfs.file();
    }

    new Assertion(this._obj).to.deep.equal({});

    var type = this._obj['@type'];

    this.assert(type === 'file', 'expected #{this} to be an avfs file', 'expected #{this} not to be an avfs file');
  }, function () {
    utils.flag(this, 'avfs.file', true);
  });

  Assertion.addChainableMethod('symlink', function (filepath) {
    utils.expectTypes(this, ['object']);

    if (utils.flag(this, 'contains')) {
      var normalized = path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');
      var elements   = normalized.split(path.sep);
      var object     = this._obj;

      var messages = {
        fail:   'expected #{this} to include an avfs symlink at ' + filepath,
        negate: 'expected #{this} not to include an avfs symlink at ' + filepath
      };

      for (var i = 0; i < elements.length; i++) {
        object = object[elements[i]];

        this.assert(utils.type(object) === 'object', messages.fail, messages.negate);
      }

      return new Assertion(object).to.be.an.avfs.symlink();
    }

    new Assertion(this._obj).to.deep.equal({});

    var isLink = (this._obj['@type'] === 'symlink');

    this.assert(isLink, 'expected #{this} to be an avfs symlink', 'expected #{this} not to be an avfs symlink');
  }, function () {
    utils.flag(this, 'avfs.symlink', true);
  });

  Assertion.addChainableMethod('directory', function (directory) {
    utils.expectTypes(this, ['object']);

    var messages = null;

    if (utils.flag(this, 'contains')) {
      var normalized = path.normalize(directory).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');
      var elements   = normalized.split(path.sep);
      var object     = this._obj;

      messages = {
        fail:   'expected #{this} to include an avfs directory at ' + directory,
        negate: 'expected #{this} not to include an avfs directory at ' + directory
      };

      for (var i = 0; i < elements.length; i++) {
        object = object[elements[i]];

        this.assert(utils.type(object) === 'object', messages.fail, messages.negate);
      }

      return new Assertion(object).to.be.an.avfs.directory();
    }

    new Assertion(this._obj).to.deep.equal({});

    var type = this._obj['@type'];

    messages = {
      fail:   'expected #{this} to be an avfs directory',
      negate: 'expected #{this} not to be an avfs directory'
    };

    this.assert(type === 'directory', messages.fail, messages.negate);
  }, function () {
    utils.flag(this, 'avfs.directory', true);
  });

  Assertion.addMethod('mode', function (mode) {
    utils.expectTypes(this, ['object']);

    var actual   = this._obj['@mode'];
    var expected = parseInt(mode, 8);

    var messages = {
      fail:   'expected avfs file mode to be #{exp}',
      negate: 'expected avfs file mode to not be #{exp}'
    };

    this.assert(actual === expected, messages.fail, messages.negate, expected.toString(8), actual.toString(8), true);
  });

  Assertion.addMethod('target', function (target) {
    utils.expectTypes(this, ['object']);

    if (!utils.flag(this, 'avfs.symlink')) {
      throw new Error('target() should be called on avfs symlink');
    }

    var actual = this._obj['@target'];

    var messages = {
      fail:   'expected avfs symlink to target #{exp}',
      negate: 'expected avfs symlink to not target #{exp}'
    };

    this.assert(actual === target, messages.fail, messages.negate, target, actual, true);
  });

  Assertion.addMethod('clear', function () {
    utils.expectTypes(this, ['object']);

    var messages = null;

    if (utils.flag(this, 'avfs.file')) {
      var actual   = this._obj['@content'].toString();
      var expected = '';

      messages = {
        fail:   'expected avfs file to be empty',
        negate: 'expected avfs file to not be empty'
      };

      this.assert(actual === expected, messages.fail, messages.negate, expected, actual, true);
    } else if (utils.flag(this, 'avfs.directory')) {
      var children = Object.keys(this._obj);

      messages = {
        fail:   'expected avfs folder to be empty',
        negate: 'expected avfs folder to not be empty'
      };

      this.assert(children.length === 0, messages.fail, messages.negate, [], children, true);
    } else {
      throw new Error('clear() should be called on avfs file or directory');
    }
  });

  Assertion.overwriteChainableMethod('contain', function (_super) {
    return function (content) {
      if (utils.flag(this, 'avfs.file')) {
        new Assertion(this._obj).to.be.an.avfs.file();

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
