#!/usr/bin/env node
// Runner: load profile, iterate rule IDs, invoke rule modules, emit marker report.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PROFILES_DIR = path.join(ROOT, 'profiles')
const RULES_DIR = path.join(ROOT, 'rules')

function parseArgs(argv) {
  const positional = []
  const params = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2).replace(/-/g, '_')
      params[key] = argv[++i]
    } else {
      positional.push(a)
    }
  }
  return { htmlPath: positional[0], profileName: positional[1], params }
}

function loadProfile(name) {
  const file = path.join(PROFILES_DIR, name + '.json')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  let rules = raw.rules || []
  if (raw.extends) {
    const parent = loadProfile(raw.extends)
    rules = [...parent.rules, ...rules]
  }
  return { name, rules }
}

function indexRules(dir, index = {}) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      indexRules(full, index)
    } else if (entry.endsWith('.js') && !entry.endsWith('.test.js')) {
      const mod = require(full)
      if (mod && mod.id) index[mod.id] = mod
    }
  }
  return index
}

function runRule(rule, html, params) {
  if (rule.type === 'sem') {
    return { marker: '?' }
  }
  const missing = (rule.requiresParams || []).filter(p => !params[p])
  if (missing.length) {
    return { marker: '-', note: 'skipped: needs --' + missing[0].replace(/_/g, '-') }
  }
  try {
    const r = rule.check(html, params)
    if (r && r.passed) return { marker: 'x' }
    return { marker: ' ', note: r && r.got ? 'got: ' + r.got : 'got: check failed' }
  } catch (e) {
    return { marker: '!', note: 'error: ' + e.message }
  }
}

function emit(file, profileName, results) {
  let pass = 0, fail = 0, pending = 0, skipped = 0, errored = 0
  for (const r of results) {
    if (r.marker === 'x') pass++
    else if (r.marker === ' ') fail++
    else if (r.marker === '?') pending++
    else if (r.marker === '-') skipped++
    else if (r.marker === '!') errored++
  }
  let verdict
  if (errored > 0 || fail > 0) {
    verdict = 'FAIL (' + fail + ' fail, ' + errored + ' error, ' + pending + ' pending, ' + skipped + ' skipped, ' + pass + ' pass)'
  } else if (pending > 0 || skipped > 0) {
    verdict = 'PENDING (' + pending + ' pending, ' + skipped + ' skipped, ' + pass + ' pass)'
  } else {
    verdict = 'PASS (' + pass + ' pass)'
  }

  const lines = []
  lines.push('file:    ' + file)
  lines.push('profile: ' + profileName)
  lines.push('verdict: ' + verdict)
  lines.push('')
  lines.push('## checks')
  lines.push('')
  for (const r of results) {
    let entry = '[' + r.marker + '] ' + r.id + ' ' + r.description
    if (r.note) entry += '\n    ' + r.note
    lines.push(entry)
  }
  console.log(lines.join('\n'))
}

// dispatch
const { htmlPath, profileName, params } = parseArgs(process.argv.slice(2))
const html = fs.readFileSync(htmlPath, 'utf8')
const profile = loadProfile(profileName)
const rules = indexRules(RULES_DIR)

const results = []
for (const id of profile.rules) {
  const rule = rules[id]
  if (!rule) {
    results.push({ id, description: '(rule file missing)', marker: '!', note: 'NOT FOUND' })
    continue
  }
  const r = runRule(rule, html, params)
  results.push(Object.assign({ id: rule.id, description: rule.description }, r))
}

emit(htmlPath, profileName, results)
process.exit(0)
