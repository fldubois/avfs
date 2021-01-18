'use strict';

module.exports = {
  asyncify: function (target, options) {
    if (typeof options === 'function') {
      options = {nocb: options};
    }

    var prototype = Object.getPrototypeOf(target);

    for (var method in prototype) {
      if (/Sync$/.test(method) && (!Array.isArray(options.methods) || options.methods.indexOf(method) !== -1)) {
        var name = method.replace('Sync', '');

        if (!(name in prototype)) {
          (function (sync, async) {
            prototype[async] = function () {
              var args     = Array.prototype.slice.call(arguments);
              var callback = options.nocb;
              var error    = null;
              var result   = void 0;

              for (var i = args.length - 1; i >= 0; i--) {
                if (typeof args[i] === 'function') {
                  callback = args[i];
                  args.splice(i);
                  break;
                }
              }

              try {
                result = this[sync].apply(this, args);
              } catch (err) {
                error = err;
              }

              if (typeof options.error === 'function') {
                options.error(error);
              }

              setImmediate(function () {
                if (typeof options.transform === 'function') {
                  return options.transform(error, result, async, args, callback);
                }

                return callback(error, result);
              });
            };
          })(method, name);
        }
      }
    }
  },
  invoke: function (method, args, transform) {
    args = args || [];

    try {
      return method.apply(null, args);
    } catch (error) {
      throw (error.name === 'AVFSError' && typeof transform === 'function') ? transform(error) : error;
    }
  },
  filter: function (object, predicate) {
    return Object.keys(object).reduce(function (memo, key) {
      if (predicate(key)) {
        memo[key] = object[key];
      }

      return memo;
    }, {});
  }
};
