'use strict'

const assert = require('assert')
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const inputFiles = fs.readdirSync(path.join(__dirname, 'input'))

inputFiles.forEach((fileName) => {
  const expected = fs.readFileSync(path.join(__dirname, 'output', `${path.basename(fileName, '.xml')}.tsv`))
  const results = spawnSync(process.argv[0], [path.join(__dirname, '..', 'index.js'), path.join('test', 'input', fileName)])
  if (results.error) {
    throw results.error
  }
  if (results.stderr.toString()) {
    throw new Error(results.stderr.toString())
  }
  assert.strictEqual(expected.toString(), results.stdout.toString(), `output for ${fileName} is different than expected`)
})
