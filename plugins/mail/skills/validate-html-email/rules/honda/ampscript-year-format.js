// H1.1 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.1',
  name: 'ampscript-year-format',
  type: 'mech',
  requiresParams: [],
  description: "DON'T hardcode year values in footer text. Instead use the AMPScript format Now yyyy token. WHY hardcoded years ship stale content after calendar rollover",
  check: wrapHonda('updateDayDateformattoAMPScript')
}
