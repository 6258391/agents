// H1.12 — honda mech wrapper, param-gated (cid)
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.12',
  name: 'cid-query-matches-campaign',
  type: 'mech',
  requiresParams: ['cid'],
  description: "DON'T let link cid query params drift from the campaign CID. Instead set cid equal to the campaign CID on every non whitelist link. WHY attribution pipelines join on cid",
  check: wrapHonda('checkAllCidQueryMatching', { cid: 'inputCid' })
}
