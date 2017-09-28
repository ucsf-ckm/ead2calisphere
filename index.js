'use strict'

const path = require('path')
const eadRaw = require('fs').readFileSync(path.join(__dirname, '/aids-rp.xml'), 'utf-8')

const htmlparser2 = require('htmlparser2')

let tagStack = []
let fileLevelTagStack = []
let dataMapStack = []
let dataMap = new Map()
let collectionNumber = ''
let creator = ''
let creatorType = ''
let creatorSource = 'local'
let language = {}
let languageStack = []

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
    (rv, value) => {
      if (value.get('unittitle')) {
        return rv + `${value.get('unittitle')}: `
      }
      return rv
    },
    ''
  )

  output.push(`${unittitlePrefix}${data.get('unittitle')}`)

  // Alternative title: leave blank
  output.push('')

  // Identifier: leave blank
  output.push('')

  // Local identifier
  const container = data.get('container').replace(':', '_')
  if (!container) {
    throw new Error('no container found')
  }
  output.push(`${collectionNumber}_${container}`.toLowerCase())

  // Type: leave blank
  output.push('')

  // Campus/unit: leave blank
  output.push('')

  // Date
  output.push(data.get('unitdate'))

  // Date type: always "created"
  output.push('created')

  // Single: leave blank
  output.push('')

  // Inclusive Start: leave blank
  output.push('')

  // Inclusive End: leave blank
  output.push('')

  // Publication/origin: leave blank
  output.push('')

  // Creator 1 Name
  // Our finding aids only seem to have one creator.
  output.push(creator)

  // Creator 1 Name Type
  output.push(creatorType)

  // Creator 1 Role: leave blank
  output.push('')

  // Creator 1 Source
  output.push(creatorSource)

  // Creator 1 Authority ID: leave blank (for now at least)
  output.push('')

  // Leave Creator 2 * blank
  output.push('') // name
  output.push('') // name type
  output.push('') // role
  output.push('') // source
  output.push('') // authority id

  // Leave Contributor * blank
  output.push('') // name
  output.push('') // name type
  output.push('') // role
  output.push('') // source
  output.push('') // authority id

  // Leave format/physical description blank; needs to be filled out manually
  output.push('')

  // Leave description notes and types blank
  output.push('') // Description 1 Note
  output.push('') // Description 1 Type
  output.push('') // Description 2 Note
  output.push('') // Description 2 Type
  output.push('') // Description 3 Note
  output.push('') // Description 3 Type

  // Extent
  output.push(data.get('extent'))

  // Language
  output.push(language.text)

  // Language code
  output.push(language.attribs.langcode)

  // Temporary restrictions: leave blank
  output.push('')

  // Transcription: leave blank
  output.push('')

  // Access restriction: leave blank
  output.push('')

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
    if (name === 'language') {
      language = {name, attribs, text: ''}
      languageStack.push(language)
    }
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
      if (thisTag.name === 'unitid' && thisTag.attribs.label === 'Collection number') {
        collectionNumber = text.trim().replace(/\s+/g, '')
      }
      if (thisTag.name === 'language') {
        language.text += text
      }
    }
    if (tagStack.filter((tag) => { return tag.name === 'origination' && tag.attribs.label === 'Creator' }).length > 0) {
      creator += text.trim()
      if (['corpname', 'famname', 'persname'].includes(thisTag.name)) {
        creatorType = thisTag.name
        if (thisTag.attribs.source === 'lcnaf') {
          creatorSource = 'naf'
        }
      }
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
    if (tagname === 'language') {
      language = languageStack.pop()
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
