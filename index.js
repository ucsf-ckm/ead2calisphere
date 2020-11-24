'use strict'

const fs = require('fs')
const path = require('path')
const convert = require('./lib/convert')

if (!process.argv[2]) {
  console.error(`ead2calisphere ${require('./package.json').version}`)
  console.error('Usage: ead2calisphere input.xml [output.tsv]')
  process.exit(1)
}

const eadRaw = fs.readFileSync(path.resolve(process.cwd(), process.argv[2]), 'utf-8')

const outputFile = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : ''
if (outputFile) {
  try {
    fs.unlinkSync(outputFile)
  } catch (e) {
    // file probably didn't exist
  }
}

let tsvOutput
try {
  tsvOutput = convert(eadRaw)
} catch (e) {
  console.warn(e.message)
  process.exit(1)
}

if (tsvOutput) {
  if (outputFile) {
    fs.writeFileSync(outputFile, `${tsvOutput}\n`, { flag: 'a' })
  } else {
    console.log(tsvOutput)
  }
}
