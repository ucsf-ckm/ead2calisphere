'use strict'

const path = require('path')
const eadRaw = require('fs').readFileSync(path.join(__dirname, '/aids-rp.xml'), 'utf-8')

const htmlparser2 = require('htmlparser2')

let tagStack = []
let fileLevelTagStack = []
let dataMapStack = []
let dataMap = new Map()
let collectionNumber = ''

const displayData = (data) => {
  if (data.get('DONOTDISPLAY')) { return }

  if (!collectionNumber) {
    throw new Error('no collection number found')
  }

  const output = []
  // File path: leave blank
  output.push('')

  // Title
  const unittitlePrefix = dataMapStack.reduce(
    (rv, value) => rv + `${value.get('unittitle')}: `,
    ''
  )
  output.push(`${unittitlePrefix}${data.get('unittitle')}`)
  // output.push(data.get('unittitle'));

  // Alternative title: leave blank
  output.push('')

  // Identifier: leave blank
  output.push('')

  // Local identifier
  // Should look like mss96-33_1_2_bctv
  // <unitid>_ <c#><did><container type="box">_<c#><did><container type="folder">_titleabbreviation
  output.push(`${collectionNumber}_`.toLowerCase())

  console.log(output.join(`\t`))
}

const handlers = {
  /*
    See possible events at:
      https://github.com/fb55/htmlparser2/wiki/Parser-options#events
    See fields we need at:
      https://docs.google.com/spreadsheets/d/1zmJVEZtdJ_6cwmdyWYR7dXMGYFKp_TGiyRV9zQgGbXE/edit
    See desired output format at:
      https://docs.google.com/spreadsheets/d/1zmJVEZtdJ_6cwmdyWYR7dXMGYFKp_TGiyRV9zQgGbXE/edit?usp=sharing
   */
  onopentag: function (name, attribs) {
    tagStack.push({name, attribs})
    if (attribs.level === 'file') {
      if (dataMap.size > 0) {
        // This map encloses another map, so do not display on line by itself.
        dataMap.set('DONOTDISPLAY', true)
        dataMapStack.push(dataMap)
        dataMap = new Map()
      }
      fileLevelTagStack.push(name)
    }
  },
  ontext: function (text) {
    const thisTag = tagStack[tagStack.length - 1]
    if (thisTag) {
      if (thisTag.name === 'unitid' && thisTag.attribs.label === 'Collection number') { collectionNumber = text.trim().replace(/\s+/g, '') }
    }
    if (fileLevelTagStack.length === 0) { return }
    const trimmedText = text.trim().replace(/\s+/g, ' ')
    if (trimmedText.length > 0) {
      if (tagStack.length === 0) {
        throw new Error(`found text outside of tags: ${trimmedText}`)
      }

      tagStack.forEach((tag, index) => {
        const soFar = dataMap.get(tagStack[index].name)
        if (soFar === undefined) {
          return dataMap.set(tag.name, trimmedText)
        }
        if (/[A-Za-z0-9]$/.test(soFar)) {
          return dataMap.set(tag.name, `${soFar} ${trimmedText}`)
        }
        return dataMap.set(tag.name, `${soFar}${trimmedText}`)
      })
    }
  },
  onclosetag: function (tagname) {
    const expectedTag = tagStack.pop()
    if (expectedTag.name !== tagname) { throw new Error(`Invalid XML: Expected closing tag ${expectedTag.name} but saw ${tagname}`) }
    if (tagname === fileLevelTagStack[fileLevelTagStack.length - 1]) {
      fileLevelTagStack.pop()

      displayData(dataMap)
      dataMap = dataMapStack.pop() || new Map()
    }
  }
}

const options = {
  decodeEntities: true,
  xmlMode: true
}

const parser = new htmlparser2.Parser(handlers, options)
parser.write(eadRaw) // passed through handlers
parser.end()
