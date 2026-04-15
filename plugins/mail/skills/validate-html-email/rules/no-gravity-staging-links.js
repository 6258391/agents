// R1.8 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.8',
  name: 'no-gravity-staging-links',
  type: 'mech',
  requiresParams: [],
  description: "DON'T reference Gravity staging hosts in production HTML. Instead replace carbon8 and emailassets links with production URLs. WHY staging hosts are not guaranteed reachable from recipient networks",
  check: wrapHonda('noCarbon8Links')
}
