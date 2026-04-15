// H1.16 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.16',
  name: 'unsubscribe-link-alias-pair',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship without both OptOut this type and OptOut all link alias pairs. Instead include the RedirectTo pageURL and pageURLALL pair with matching aliases. WHY SFMC requires both opt out paths for OneTrust compliance",
  check: wrapHonda('checkLinkAndAliasUnsubscribe')
}
