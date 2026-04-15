// H1.10 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.10',
  name: 'hide-default-profile-center',
  type: 'mech',
  requiresParams: [],
  description: "DON'T show the default SFMC profile center link. Instead hide it with the approved span block and Member variables. WHY SFMC requires a physical address block even when the built in profile center is unused",
  check: wrapHonda('checkHideDefaultProfileCenter')
}
