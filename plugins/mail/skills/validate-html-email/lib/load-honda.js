// Load Honda validators in a vm context so helpers.js and validate-functions.js
// share top-level const declarations like they do in the browser.
// Node-native shims replace browser-only dependencies ($, console).

const fs = require('fs')
const path = require('path')
const vm = require('vm')

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '\u200c')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&reg;/g, '\u00ae')
    .replace(/&copy;/g, '\u00a9')
    .replace(/&trade;/g, '\u2122')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

// jQuery shim covers the two patterns Honda code actually uses:
//   $('<textarea />').html(h).text()   — decodeHtmlEntities path
//   $('.toast').toast('show')          — clipboard UI (never invoked)
function $shim(arg) {
  let inner = typeof arg === 'string' ? arg : ''
  const obj = {
    html(h) { inner = h; return obj },
    text() { return decodeEntities(inner) },
    remove() {},
    toast() { return obj }
  }
  return obj
}

const helpersCode = fs.readFileSync(path.join(__dirname, 'helpers.js'), 'utf8')
const validatorsCode = fs.readFileSync(path.join(__dirname, 'validate-functions.js'), 'utf8')

const context = vm.createContext({
  $: $shim,
  URL,
  Math,
  Date,
  JSON,
  RegExp,
  String,
  Array,
  Object,
  Map,
  Set,
  parseInt,
  parseFloat,
  Number,
  Boolean,
  isNaN,
  console: { log: () => {}, error: () => {}, warn: () => {} }
})

const combined = helpersCode + '\n' + validatorsCode + '\n;allValidateFunctions;'
const validators = vm.runInContext(combined, context, { filename: 'honda-validators' })

module.exports = validators
