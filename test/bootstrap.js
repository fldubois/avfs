'use strict';

var path = require('path');

require('app-module-path').addPath(path.join(__dirname, '..'));

require('chai').use(function (chai, utils) {
  var Assertion = chai.Assertion;

  Assertion.addProperty('vfs', function () {
    utils.flag(this, 'vfs', true);
  });

  Assertion.addChainableMethod('file', function () {
    utils.expectTypes(this, ['object']);

    new Assertion(this._obj).to.deep.equal({});

    var type = this._obj['@type'];

    this.assert(type === 'file', 'expected #{this} to be a vfs file', 'expected #{this} not to be a vfs file');
  }, function () {
    utils.flag(this, 'vfs.file', true);
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
