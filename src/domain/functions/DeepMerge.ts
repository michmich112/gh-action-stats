/**
 * Merge a `source` object to a `target` recursively
 * https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6
 */
export default function deepMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object) Object.assign(source[key], deepMerge(target[key], source[key]))
  }
  Object.assign(target || {}, source)
  return target
}

