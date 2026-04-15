// H1.8 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.8',
  name: 'sfmc-tracking-query-params',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship tracked links without pgrcd cmpcd and ofrcd params. Instead append the 3 AMPScript tokens to every non whitelist link. WHY attribution reports key on those 3 params",
  check: wrapHonda('addTrackingToLinks')
}
