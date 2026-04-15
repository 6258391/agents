// H1.4 — honda mech wrapper, param-gated (campaign_code)
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.4',
  name: 'alias-prefix-matches-campaign',
  type: 'mech',
  requiresParams: ['campaign_code'],
  description: "DON'T let alias drift from campaign code. Instead prefix every alias with the campaign code. WHY SFMC groups tracking by alias prefix",
  check: wrapHonda('checkAllAliasMatchingWithFormat', { campaign_code: 'preAliasText' })
}
