// R1.11 — default mech wrapper, param-gated (title_text)
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.11',
  name: 'title-text-matches-copy-deck',
  type: 'mech',
  requiresParams: ['title_text'],
  description: "DON'T let the title tag drift from the copy deck. Instead match the title content to the approved copy. WHY the title appears in browser tabs and accessibility readers",
  check: wrapHonda('ensureTitleIsMatching', { title_text: 'titleText' })
}
