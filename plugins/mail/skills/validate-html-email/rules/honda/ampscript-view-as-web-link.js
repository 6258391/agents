// H1.5 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.5',
  name: 'ampscript-view-as-web-link',
  type: 'mech',
  requiresParams: [],
  description: "DON'T skip the view in browser link. Instead include an anchor with href set to the SFMC view_email_url token. WHY recipients on buggy clients need a web fallback",
  check: wrapHonda('updateViewAsWebURL')
}
