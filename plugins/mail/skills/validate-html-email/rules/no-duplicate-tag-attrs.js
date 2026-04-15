// R1.7 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.7',
  name: 'no-duplicate-tag-attrs',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship tags with duplicate attributes. Instead keep each attribute only once per tag. WHY duplicate attrs produce undefined parser behavior across clients",
  check: wrapHonda('checkDublicateAttr')
}
