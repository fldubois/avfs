'use strict';

var flags = module.exports = {
  RO:     1,
  WO:     2,
  RW:     4,
  CREAT:  8,
  TRUNC:  16,
  APPEND: 32,
  EXCL:   64
};

module.exports.parse = function (flag) {
  if (typeof flag !== 'string') {
    return flag;
  }

  switch (flag) {
    case 'r':   // fall through
    case 'rs':  return flags.RO;

    case 'r+':  // fall through
    case 'rs+': return flags.RW;

    case 'w':  return flags.WO | flags.CREAT | flags.TRUNC;
    case 'wx': // fall through
    case 'xw': return flags.WO | flags.CREAT | flags.TRUNC | flags.EXCL;

    case 'w+':  return flags.RW | flags.CREAT | flags.TRUNC;
    case 'wx+': // fall through
    case 'xw+': return flags.RW | flags.CREAT | flags.TRUNC | flags.EXCL;

    case 'a':  return flags.WO | flags.CREAT | flags.APPEND;
    case 'ax': // fall through
    case 'xa': return flags.WO | flags.CREAT | flags.APPEND | flags.EXCL;

    case 'a+':  return flags.RW | flags.CREAT | flags.APPEND;
    case 'ax+': // fall through
    case 'xa+': return flags.RW | flags.CREAT | flags.APPEND | flags.EXCL;

    default: throw new Error('Unknown file open flag: ' + flag);
  }
};
