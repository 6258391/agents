// H1.14 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.14',
  name: 'campaign-code-cid-format',
  type: 'mech',
  requiresParams: [],
  description: "DON'T use campaign codes or preference CIDs that break the approved format. Instead match the X0N dash Y0N pattern with matching numeric segments. WHY attribution parsers reject off format codes",
  check: wrapHonda('checkFormatCampaignCodeCID')
}
