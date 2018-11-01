const lenFunc = require('string-length')
const ansiSubstr = require('ansi-substring')

const stripAnsiURL = str => str.replace(/\u001b]8;;.+\u0007(.+)\u001b]8;;\u0007/g, (...args) => args[1])

module.exports = class Ansi {
  static get brackets (){
    return {
      tl: '┌',
      tr: '┐',
      bl: '└',
      br: '┘',
      vertical: '│',
      horizontal: '─'
    }
  }
  static len(string){
    return lenFunc(stripAnsiURL(string))
  }
  static joinLines(setOfLines) {
    const wip = []
    const lengths = []
    setOfLines.forEach((lines, lineIndex) => lines.split('\n').forEach((line, index) => {
      let modifiedLine = line
      if (wip.length < index + 1) {
        if (lineIndex !== 0) {
          modifiedLine = this.padStart(line, lengths[index - 1])
        }
        wip.push(modifiedLine)
        lengths.push(this.len(modifiedLine))
      } else {
        wip[index] += modifiedLine
        lengths[index] += this.len(modifiedLine)
      }
    }))
    return wip.join('\n')
  }
  static halfDiff (maxWidth, curWidth) {
    return Math.floor((maxWidth - curWidth) / 2)
  }
  static fullDiff (maxWidth, curWidth) {
    return maxWidth - curWidth
  }
  static padEnd(string, length, delimiter = ' '){
    if (this.len(string) > length) {
      return string
    }
    let rest = length - this.len(string)
    return `${string}${delimiter.repeat(rest)}`
  }
  static padStart(string, length, delimiter = ' '){
    if (this.len(string) > length) {
      return string
    }
    let rest = length - this.len(string)
    return `${delimiter.repeat(rest)}${string}`
  }
  static align(text, opts) {
    if (!text) return text
    opts = opts || {}
    const align = opts.align || 'center'

    // short-circuit `align: 'left'` as no-op
    if (align === 'left') return text

    const split = opts.split || '\n'
    const pad = opts.pad || ' '
    const widthDiffFn = align !== 'right' ? this.halfDiff : this.fullDiff

    let returnString = false
    if (!Array.isArray(text)) {
      returnString = true
      text = String(text).split(split)
    }

    let width
    let maxWidth = 0
    text = text.map(str => {
      str = String(str)
      width = this.len(str)
      maxWidth = Math.max(width, maxWidth)
      return { str, width }
    }).map(obj => new Array(widthDiffFn(maxWidth, obj.width) + 1).join(pad) + obj.str)

    return returnString ? text.join(split) : text
  }
  static alignCenter (text) {
    return this.align(text, { align: 'center' })
  }
  static box (lines = '', title = '', noSpace = false, centered = false) {
    const padding = noSpace ? 0 : 2
    let length = Math.max(...lines.split('\n').concat(title)
      .map(line => this.len(line)))
    let print = text => this.padEnd(text, length + padding)
    let titleNeedsPadding = this.len(title) === length
    let extra = titleNeedsPadding ? this.brackets.horizontal.repeat(padding) : ''
    const titleLength = titleNeedsPadding ? length : length + padding * 2
    length += padding * 2
    if (centered) {
      if (padding === 0) {
        return this.box(this.center(lines.split('\n'), length + padding).join('\n'), `${extra}${title}${extra}`, true, false)
      }
      return this.box(
        this.center(lines.split('\n'), length + padding)
          .join('\n'),
        `${extra}${title}${extra}`,
        true,
        false
      )
    }
    return `${this.brackets.tl}${extra}${this.padEnd(title.toString(), titleLength + padding, this.brackets.horizontal)}${extra}${this.brackets.tr}
${lines.split('\n').map(line => `${this.brackets.vertical}${print(line)}${this.brackets.vertical}`)
      .join('\n')}
${this.brackets.bl}${this.brackets.horizontal.repeat(length + padding)}${this.brackets.br}`
  }
  static center (text, length) {
    const all = [...text, ' '.repeat(length)]
    const allSizes = all.map(i => this.len(i))
    const highest = Math.max(...allSizes)
    const res = this.alignCenter(all)
    res.pop()
    let lines = []
    for (let line of res) {
      if (!line.includes(' ')) {
        lines.push(line)
        continue
      }
      const startMatch = line.match(/^\s+/)
      const endMatch = line.match(/\s+$/)
      if (!startMatch || endMatch) {
        if (startMatch && endMatch) {
          if (this.len(endMatch[0]) > this.len(startMatch[0])) {
            line = line.slice(this.len(line) - (endMatch[0] - startMatch[0]))
          }
        }
        lines.push(line)
        continue
      }
      const [spacesStart] = startMatch
      let amount = Math.abs(highest - this.len(line))
      lines.push(`${line}${' '.repeat(amount > this.len(spacesStart) ? this.len(spacesStart) : amount)}`)
    }
    return lines
  }
  static trimBySpaces (text, index, getIndex = false) {
    const allSpaces = text
      .split('')
      .reduce((accumulator, current, i) => current === ' ' ? accumulator.concat(i) : accumulator, [])
    
    const spaces = allSpaces
      .filter(i => i >= index)
    const match = spaces.length === 0 ? text : text.slice(0, spaces[0])
    if (getIndex) {
      return { match, spaces }
    }
    return match
  }
  static spreadAcrossLines (text, count = 0) {
    let lineCount = Math.ceil(this.len(text) / count)
    let lines = new Array(lineCount)
    let workingIndex = 0
    let i = 0
    while (true) {
      const out = this.trimBySpaces(ansiSubstr(text, workingIndex), count, true)
      const { spaces } = out
      lines[i++] = out.match.trim()
      if (spaces.length === 0) break
      workingIndex += spaces[0]
    }
    return lines.filter(line => line.length > 0).join('\n')
  }
}