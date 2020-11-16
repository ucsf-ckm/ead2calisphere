'use strict'

const assert = require('assert')
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test usage message
{
  const results = spawnSync(process.argv[0], [path.join(__dirname, '..', 'index.js')])
  assert.strictEqual(results.stdout.toString(), '')
  assert.match(results.stderr.toString(), /^ead2calisphere \d+\.\d+\.\d+\nUsage: ead2calisphere input.xml \[output.tsv\]$/m)
}

// Test processing
{
  const inputFiles = fs.readdirSync(path.join(__dirname, 'input'))

  inputFiles.forEach((fileName) => {
    const expected = fs.readFileSync(path.join(__dirname, 'output', `${path.basename(fileName, '.xml')}.tsv`))
    const expectedErr = fs.readFileSync(path.join(__dirname, 'output', `${path.basename(fileName, '.xml')}.err`))
    const results = spawnSync(process.argv[0], [path.join(__dirname, '..', 'index.js'), path.join('test', 'input', fileName)], { maxBuffer: 1024 * 1024 * 2 })
    if (results.error) {
      throw results.error
    }
    assert.strictEqual(results.stdout.toString(), expected.toString(), `output for ${fileName} is different than expected`)
    assert.strictEqual(results.stderr.toString(), expectedErr.toString(), `error for ${fileName} is different than expected`)
  })
}
