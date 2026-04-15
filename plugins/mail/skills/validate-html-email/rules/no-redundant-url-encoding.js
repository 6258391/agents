// R1.3 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.3',
  name: 'no-redundant-url-encoding',
  type: 'mech',
  requiresParams: [],
  description: "DON'T leave %25 in URLs. Instead use %% AMPScript tokens directly. WHY double percent encoding breaks SFMC link resolution",
  check: wrapHonda('checkRedundancy25')
}
