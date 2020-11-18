'use strict'

const dropZone = document.getElementById('body')
dropZone.addEventListener('drop', dropHandler)
dropZone.addEventListener('dragover', dragOverHandler)

function dropHandler (ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault()

  if (ev.dataTransfer.files.length) {
    processFile(ev.dataTransfer.files)
  }
}

function dragOverHandler (ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault()
}

const gallery = document.getElementById('gallery')

function processFile (files) {
  gallery.innerHTML = ''
  const file = files[0]
  const reader = new window.FileReader()
  reader.readAsText(file)
  reader.onloadend = function () {
    const div = document.createElement('div')
    div.setAttribute('class', 'gallery-container')
    const pre = document.createElement('pre')
    const warnings = []
    pre.textContent = window.convert(reader.result, { warn: (txt) => { warnings.push(txt) } })
    div.appendChild(pre)
    gallery.appendChild(div)
    if (warnings.length) {
      window.alert(warnings.join('\n'))
    }
  }
}
