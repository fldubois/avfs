'use strict';

module.exports = {
  asyncify: function (target) {
    var prototype = Object.getPrototypeOf(target);

    for (var method in prototype) {
      if (/Sync$/.test(method)) {
        var name = method.replace('Sync', '');

        if (!(name in prototype)) {
          (function (sync, async) {
            prototype[async] = function () {
              var args     = Array.prototype.slice.call(arguments);
              var callback = null;

              if (typeof args[args.length - 1] === 'function') {
                callback = args.pop();
              } else {
                callback = function (error) {
                  if (error) {
                    console.error('fs: missing callback ' + error.message);
                  }
                };
              }

              var result = void 0;
              var error  = null;

              try {
                result = target[sync].apply(target, args);
              } catch (err) {
                error = err;
              }

              setImmediate(function () {
                return callback(error, result);
              });
            };
          })(method, name);
        }
      }
    }
  },
  invoke: function (method, args, errors) {
    args   = args   || [];
    errors = errors || {};

    try {
      return method.apply(null, args);
    } catch (error) {
      if (error.name === 'AVFSError' && errors.hasOwnProperty(error.code)) {
        throw errors[error.code]();
      }

      throw error;
    }
  }
};
