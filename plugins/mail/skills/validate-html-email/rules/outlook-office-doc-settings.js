// R1.12 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.12',
  name: 'outlook-office-doc-settings',
  type: 'mech',
  requiresParams: [],
  description: "DON'T skip the Outlook OfficeDocumentSettings block. Instead add the AllowPNG and PixelsPerInch 96 xml block in head. WHY Outlook downscales images without this block",
  check: wrapHonda('checkOfficeDocumentSettingsOnOutlook')
}
