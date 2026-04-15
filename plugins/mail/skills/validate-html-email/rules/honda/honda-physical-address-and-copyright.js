// H1.9 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.9',
  name: 'honda-physical-address-and-copyright',
  type: 'mech',
  requiresParams: [],
  description: "DON'T alter the Honda physical address or copyright format. Instead include the exact American Honda Motor Co address block and the AHM copyright line. WHY legal and CAN-SPAM review accepts only the approved wording",
  check: wrapHonda('checkPhysicalAddress')
}
