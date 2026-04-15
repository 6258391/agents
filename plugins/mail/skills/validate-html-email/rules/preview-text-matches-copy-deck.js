// R1.1 — default mech wrapper, param-gated (preview_text)
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.1',
  name: 'preview-text-matches-copy-deck',
  type: 'mech',
  requiresParams: ['preview_text'],
  description: "DON'T ship preview text that drifts from the copy deck. Instead match the approved copy with only padding entities after it. WHY preview text is the first line recipients read and copy review signs off on exact wording",
  check: wrapHonda('ensureThePreviewTextInTheHTMLMatchesPreviewTextOnCopyDeck', { preview_text: 'previewText' })
}
