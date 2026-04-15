// Shared wrapper for Honda validator functions.
// Maps runner params (snake_case) to Honda option keys (camelCase),
// invokes the Honda function via vm context, strips HTML from the message.

const honda = require('./load-honda.js')

function stripHtml(s) {
  if (!s) return s
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wrapHonda(fnName, paramMap) {
  return function (html, params) {
    const opts = {}
    if (paramMap) {
      for (const runnerKey in paramMap) {
        opts[paramMap[runnerKey]] = params[runnerKey]
      }
    }
    const r = honda[fnName](html, opts)
    return { passed: !!r.passed, got: r.passed ? null : stripHtml(r.message) }
  }
}

module.exports = { stripHtml, wrapHonda }
