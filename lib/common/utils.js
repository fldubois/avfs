'use strict';

module.exports = {
  asyncify: function (target, nocb) {
    var prototype = Object.getPrototypeOf(target);

    for (var method in prototype) {
      if (/Sync$/.test(method)) {
        var name = method.replace('Sync', '');

        if (!(name in prototype)) {
          (function (sync, async) {
            prototype[async] = function () {
              var args     = Array.prototype.slice.call(arguments);
              var callback = (typeof args[args.length - 1] === 'function') ? args.pop() : nocb;
              var error    = null;
              var result   = void 0;

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
  invoke: function (method, args, transform) {
    args = args || [];

    try {
      return method.apply(null, args);
    } catch (error) {
      throw (error.name === 'AVFSError' && typeof transform === 'function') ? transform(error) : error;
    }
  }
};
