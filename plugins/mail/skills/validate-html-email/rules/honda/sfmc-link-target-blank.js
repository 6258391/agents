// H1.11 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.11',
  name: 'sfmc-link-target-blank',
  type: 'mech',
  requiresParams: [],
  description: "DON'T leave external links without a new tab target. Instead set target blank on every non whitelist non honda anchor. WHY inline navigation inside webmail clients breaks the reading context",
  check: wrapHonda('checkLinkShouldOpenNewTab')
}
