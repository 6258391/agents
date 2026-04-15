// H1.2 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.2',
  name: 'ampscript-open-tracking-tag',
  type: 'mech',
  requiresParams: [],
  description: "DON'T omit the SFMC open counter custom tag. Instead include exactly one opencounter tracking tag outside comments. WHY SFMC needs the tag to record opens",
  check: wrapHonda('addOpenTrackingCodeToEmail')
}
