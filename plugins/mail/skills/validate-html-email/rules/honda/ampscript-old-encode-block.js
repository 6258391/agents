// H1.6 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.6',
  name: 'ampscript-old-encode-block',
  type: 'mech',
  requiresParams: [],
  description: "DON'T remove the legacy CUSTOM AMPSCRIPT encode block. Instead keep the Base64Encode email and recipientID block intact. WHY the profile center URL breaks without those variables",
  check: wrapHonda('oldCustomAmpscript')
}
