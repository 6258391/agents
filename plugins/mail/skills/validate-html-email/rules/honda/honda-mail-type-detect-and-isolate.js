// H1.15 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.15',
  name: 'honda-mail-type-detect-and-isolate',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship without a detectable Honda mail type or with cross-brand mentions. Instead include alias links for one brand and exclude text from the others. WHY cross-brand leaks violate OneTrust audience segmentation",
  check: wrapHonda('checExistHondaEmailTypeOther')
}
