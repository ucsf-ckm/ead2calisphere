'use strict'

const path = require('path')

if (!process.argv[2]) {
  console.error('Usage: ead2calisphere input.xml')
  process.exit(1)
}

const eadRaw = require('fs').readFileSync(path.join(__dirname, process.argv[2]), 'utf-8')

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
let collectionTitle = ''
let containerDisplay = ''

const subjectName = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
let subjectNameIndex = 0

const subjectTopic = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
let subjectTopicIndex = 0

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
  const container = data.get('container')
  if (!container) {
    throw new Error('no container found')
  }
  const containers = container.split(/[ :]/)
  const containersPadded = containers.map((val) => val.padStart(3, '0'))
  output.push(`${collectionNumber.trim().replace(/\s+/g, '')}_${containersPadded.join('_')}_0000`.toLowerCase())

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

  // Temporal coverage: leave blank
  output.push('')

  // Transcription: leave blank
  output.push('')

  // Access restriction: leave blank
  output.push('')

  // Copyright Status: leave blank
  output.push('')

  // Copyright Statement: leave blank
  output.push('')
  // Copyright Holder Name Type: leave blank
  output.push('')
  // Copyright Holder Name: leave blank
  output.push('')
  // Copyright Holder Source: leave blank
  output.push('')
  // Copyright Holder Authority ID: leave blank
  output.push('')
  // Copyright Contact: leave blank
  output.push('')
  // Copyright Notice: leave blank
  output.push('')
  // Copyright Determination Date: leave blank
  output.push('')
  // Copyright Start Date: leave blank
  output.push('')
  // Copyright End Date: leave blank
  output.push('')
  // Copyright Jurisdiction: leave blank
  output.push('')
  // Copyright Note: leave blank
  output.push('')

  // Collection 1: leave blank
  output.push('')

  // Collection 2: leave blank
  output.push('')

  // Related Resource: leave blank
  output.push('')

  // Source
  output.push(`${collectionTitle}, ${collectionNumber}, ${containerDisplay}`)

  subjectName.forEach((val) => {
    output.push(val.name || '')
    output.push(val.type || '')
    output.push(val.role || '')
    output.push(val.source || '')
    output.push(val.authorityId || '')
  })

  // We think places are all blank
  for (let i = 0; i < 12; i++) {
    output.push('')
  }

  subjectTopic.forEach((val) => {
    output.push(val.heading || '')
    output.push(val.headingType || '')
    output.push(val.source || '')
    output.push(val.authorityId || '')
  })

  // We think form/genre are all blank
  for (let i = 0; i < 9; i++) {
    output.push('')
  }

  // Provenance: leave blank
  output.push('')

  // Physical location: leave blank
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
    if (/^language$/i.test(name)) {
      language = {name, attribs, text: ''}
      languageStack.push(language)
    }
    if (/^file$/i.test(attribs.level)) {
      if (dataMap.size > 0) {
        // This map encloses another map, so do not display on line by itself.
        dataMap.set('DONOTDISPLAY', true)
        dataMapStack.push(dataMap)
        dataMap = new Map()
      }
      fileLevelTagStack.push(name.toLowerCase())
      containerDisplay = ''
    }
  },
  ontext: function (text) {
    const thisTag = tagStack[tagStack.length - 1]
    if (thisTag) {
      const prevTag = tagStack[tagStack.length - 2]
      const prevPrevTag = tagStack[tagStack.length - 3]
      if (/^unittitle$/i.test(thisTag.name) && /^did$/i.test(prevTag.name) && /^archdesc$/i.test(prevPrevTag.name)) {
        collectionTitle += text
      }
      if (/^unitid$/i.test(thisTag.name) && /^did$/i.test(prevTag.name) && /^archdesc$/i.test(prevPrevTag.name) && /^collection$/i.test(prevPrevTag.attribs.level)) {
        collectionNumber += text
      }
      if (/^language$/i.test(thisTag.name)) {
        language.text += text
      }
      if (/^container$/i.test(thisTag.name)) {
        const types = thisTag.attribs.type.split(':')
        const texts = text.split(':')
        const pieces = types.map((type, idx) => `${type} ${texts[idx]}`)
        containerDisplay += pieces.join(', ')
      }
    }
    if (tagStack.filter((tag) => { return /^origination$/i.test(tag.name) && /^creator$/i.test(tag.attribs.label) }).length > 0) {
      creator += text.trim()
      if (['corpname', 'famname', 'persname'].includes(thisTag.name)) {
        creatorType = thisTag.name
        if (/^lcnaf$/i.test(thisTag.attribs.source)) {
          creatorSource = 'naf'
        }
      }
    }
    if (tagStack.filter((tag) => /^controlaccess$/i.test(tag.name)).length > 0) {
      if (['corpname', 'famname', 'persname'].includes(thisTag.name)) {
        if (subjectNameIndex === subjectName.length) {
          throw new Error(`Too many Names! Max: ${subjectName.length}`)
        }
        const mine = subjectName[subjectNameIndex]
        subjectNameIndex++
        mine.name = text.trim() // This assumes no nested tags in the names
        mine.type = thisTag.name
        mine.role = ''
        mine.source = /^lcnaf$/i.test(thisTag.attribs.source) ? 'naf' : 'local'
        mine.authrityId = ''
      }
      if (['subject'].includes(thisTag.name)) {
        if (subjectTopicIndex === subjectTopic.length) {
          throw new Error(`Too many Topics! Max: ${subjectTopic.length}`)
        }
        const mine = subjectTopic[subjectTopicIndex]
        subjectTopicIndex++
        mine.heading = text.trim() // This assumes no nested tags in topics
        mine.headingType = 'topic'
        mine.source = /^lcsh$/i.test(thisTag.attribs.source) ? 'lcsh' : 'local'
        mine.authorityId = ''
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
    if (tagname.toLowerCase() === fileLevelTagStack[fileLevelTagStack.length - 1]) {
      fileLevelTagStack.pop()

      displayData(dataMap)
      dataMap = dataMapStack.pop() || new Map()
    }
    if (/^language$/i.test(tagname)) {
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
