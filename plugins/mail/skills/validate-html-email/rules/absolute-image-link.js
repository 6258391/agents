// R1.4 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.4',
  name: 'absolute-image-link',
  type: 'mech',
  requiresParams: [],
  description: "DON'T use relative image sources. Instead set every img src and background url to an absolute https URL. WHY email clients have no base URL and relative paths break image rendering",
  check: wrapHonda('checkAbsoluteImageLink')
}
