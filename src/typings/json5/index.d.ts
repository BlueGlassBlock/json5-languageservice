declare module 'json5' {
  import parse = require('json5/lib/parse')
  import stringify = require('json5/lib/stringify')

  const lib: { parse: typeof parse, stringify: typeof stringify }

  export default lib
}
