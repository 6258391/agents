// R1.5 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.5',
  name: 'darkmode-full-stack',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship partial dark mode configuration. Instead add both color-scheme and supported-color-schemes meta tags plus the root CSS block. WHY partial config leaves some clients in light-only mode",
  check: wrapHonda('ensureHtmlContainDarkmodeMetaTagStyles')
}
