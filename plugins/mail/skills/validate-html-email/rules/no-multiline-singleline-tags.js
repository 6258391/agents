// R1.6 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.6',
  name: 'no-multiline-singleline-tags',
  type: 'mech',
  requiresParams: [],
  description: "DON'T leave multiline or singleline template tags in compiled HTML. Instead strip those tags before export. WHY SFMC interprets them as content editors and corrupts rendering",
  check: wrapHonda('checkMultilineSinglelineTag')
}
