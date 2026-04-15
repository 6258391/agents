// H1.7 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.7',
  name: 'ampscript-new-onetrust-block',
  type: 'mech',
  requiresParams: [],
  description: "DON'T omit the OneTrust opt-out AMPScript block. Instead include the CloudPagesUrl block that matches the detected mail type. WHY OneTrust compliance requires the correct page URL per brand",
  check: wrapHonda('newCustomAmpscript')
}
