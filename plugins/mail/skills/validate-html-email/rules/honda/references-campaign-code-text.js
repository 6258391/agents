// H1.13 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.13',
  name: 'references-campaign-code-text',
  type: 'mech',
  requiresParams: [],
  description: "DON'T omit the Reference campaign code line in body text. Instead include the Reference CAMPAIGNCODE OFFERCODE line outside comments. WHY support teams trace incidents by the reference line in forwarded emails",
  check: wrapHonda('checkContainReferencesCampaignCode')
}
