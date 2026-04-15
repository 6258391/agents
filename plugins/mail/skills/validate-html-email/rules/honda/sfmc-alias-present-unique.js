// H1.3 — honda mech wrapper
const { wrapHonda } = require('../../lib/wrap.js')

module.exports = {
  id: 'H1.3',
  name: 'sfmc-alias-present-unique',
  type: 'mech',
  requiresParams: [],
  description: "DON'T ship links without alias attributes or with duplicate aliases. Instead set a unique alias on every non whitelist anchor. WHY SFMC link tracking aggregates by alias and duplicates merge metrics",
  check: wrapHonda('ensureAllLinksHaveAliasAttributeApplied')
}
