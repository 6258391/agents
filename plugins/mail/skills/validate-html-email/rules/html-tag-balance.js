// R1.2 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.2',
  name: 'html-tag-balance',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship HTML with unbalanced tags or Outlook conditionals. Instead close every opened tag and every if mso block. WHY unbalanced markup breaks rendering in strict clients",
  check: wrapHonda('checkErrorHtmlSyntax')
}
