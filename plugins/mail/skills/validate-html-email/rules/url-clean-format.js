// R1.10 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.10',
  name: 'url-clean-format',
  type: 'mech',
  requiresParams: [],
  description: "DON'T let URLs contain spaces double ampersands or repeated question marks. Instead encode or sanitize those characters. WHY unclean URLs break tracking and redirects at SFMC",
  check: wrapHonda('allLinkMustNotContainSpaceAndSpecialSymbols')
}
