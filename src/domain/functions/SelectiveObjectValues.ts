import deepMerge from './DeepMerge';

export default function SelectiveObjectValues(obj: any, paths: string[]): any {
  let ret = {};
  paths.forEach(p => {
    const val = valFromPath(obj, p);
    if (val !== undefined) {
      ret = deepMerge(ret, objFromValAndPath(p, val));
    }
  })
  return ret;
}

/**
 * Retrieve nested item from object/array
 * @param {Object|Array} obj
 * @param {String} path dot separated
 * @returns {*}
 */
function valFromPath(obj: object, path: string): any | undefined {
  for (let i = 0, p = path.split('.'), len = p.length; i < len; i++) {
    if (!obj || typeof obj !== 'object') return undefined;
    obj = obj[p[i]];
  }
  return obj;
}

/**
 * Creates an object from a path and value up to multiple depth
 */
function objFromValAndPath(path: string, val: any): object {
  let ret = val;
  for (let p = path.split('.'), i = p.length; i > 0; i--) {
    ret = { [p[i - 1]]: ret };
  }
  return ret;
}

