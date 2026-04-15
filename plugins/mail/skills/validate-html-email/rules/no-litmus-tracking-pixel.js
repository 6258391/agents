// R1.13 — default mech wrapper
const { wrapHonda } = require('../lib/wrap.js')

module.exports = {
  id: 'R1.13',
  name: 'no-litmus-tracking-pixel',
  type: 'mech',
  requiresParams: [],
  description: "DON'T leave the Litmus tracking pixel in production HTML. Instead remove any emltrk domain references before send. WHY Litmus pixels are for QA previews and skew production analytics",
  check: wrapHonda('checkLitmusTrackingCode')
}
