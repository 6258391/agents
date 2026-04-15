// R1.9 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.9',
  name: 'no-marketo-leftovers',
  type: 'mech',
  requiresParams: [],
  description: "DON'T leave Marketo classes attributes or template tokens in compiled HTML. Instead remove mkto markers and dollar brace placeholders. WHY SFMC does not resolve Marketo syntax and the tokens ship as literal text",
  check: wrapHonda('CheckCodeMarketo')
}
