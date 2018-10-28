// const center = require('center-align')
const { parse } = require('node-html-parser')
const colors = require('colors')
const len = require('string-length')
const ansiSubstr = require('ansi-substring')
const ansiAlign = require('ansi-align')
const terminalLink = require('terminal-link')

const ansiPadEnd = (string, length, delimiter = ' ') => {
  if (len(string) > length) {
    return string
  }
  let rest = length - len(string)
  return `${string}${delimiter.repeat(rest)}`
}
const ansiPadStart = (string, length, delimiter = ' ') => {
  if (len(string) > length) {
    return string
  }
  let rest = length - len(string)
  return `${delimiter.repeat(rest)}${string}`
}

const center = (text, length) => {
  const all = [ ...text, ' '.repeat(length) ]
  const highest = Math.max(...all.map(i => len(i)))
  const res = ansiAlign.center(all)
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
        if (len(endMatch[0]) > len(startMatch[0])) {
          line = line.slice(len(line) - (endMatch[0] - startMatch[0]))
        }
      }
      lines.push(line)
      continue
    }
    const [spacesStart] = startMatch
    let amount = highest - len(line)
    lines.push(`${line}${' '.repeat(amount > len(spacesStart) ? len(spacesStart) : amount )}`)
  }
  return lines
}

const brackets = {
  tl: '┌',
  tr: '┐',
  bl: '└',
  br: '┘',
  vertical: '│',
  horizontal: '─'
}

const trimBySpaces = (text, index, getIndex = false) => {
  const spaces = text
    .split('')
    .reduce((accumulator, current, i) => current === ' ' ? accumulator.concat(i) : accumulator, [])
    .filter(i => i >= index)
  const match = spaces.length === 0 ? text : text.slice(0, spaces[0])
  if (getIndex) {
    return { match, spaces }
  }
  return match
}

const spreadAcrossLines = (text, count = 0) => {
  let lineCount = Math.floor(len(text) / count)
  let lines = new Array(lineCount)
  let workingIndex = 0
  for (let i = 0; i < lineCount; i++) {
    const out = trimBySpaces(ansiSubstr(text, workingIndex), count, true)
    lines[i] = out.match
    const { spaces } = out
    if (spaces.length === 0) break
    workingIndex = spaces[0]
  }
  return lines.join('\n')
}

const box = (lines = '', title = '', noSpace = false, centered = false) => {
  const padding = noSpace ? 0 : 2
  let length = Math.max(...lines.split('\n').concat(title).map(line => len(line)))
  let print = text => ansiPadEnd(text, length + padding)
  let titleNeedsPadding = len(title) === length
  let extra = titleNeedsPadding ? brackets.horizontal.repeat(padding) : ''
  const titleLength = titleNeedsPadding ? length : length + padding * 2
  length += padding * 2
  if (centered) {
    if (padding === 0) {
      return box(center(lines.split('\n'), length + padding).join('\n'), `${extra}${title}${extra}`, true, false)
    }
    return box(
      center(lines.split('\n'), length + padding)
        .join('\n'),
      `${extra}${title}${extra}`,
      true,
      false
    )
  }
  return `${brackets.tl}${extra}${ansiPadEnd(title.toString(), titleLength + padding, brackets.horizontal)}${extra}${brackets.tr}
${lines.split('\n').map(line => `${brackets.vertical}${print(line)}${brackets.vertical}`).join('\n')}
${brackets.bl}${brackets.horizontal.repeat(length + padding)}${brackets.br}`
}

const joinLines = setOfLines => {
  const wip = []
  const lengths = []
  setOfLines.forEach((lines, lineIndex) => lines.split('\n').forEach((line, index) => {
    if (wip.length < index + 1) {
      if (lineIndex !== 0) {
        line = ansiPadStart(line, lengths[index - 1])
      }
      wip.push(line)
      lengths.push(len(line))
    } else {
      wip[index] += line
      lengths[index] += len(line)
    }
  }))
  return wip.join('\n')
}

const quote = {
  test: text => text.startsWith('<div class="quote">') && (/#comment\d+_\d+/).test(text),
  replace: text => {
    const root = parse(text)
    const comment = root.querySelector('.quote').childNodes[0].rawText.replace(/\n/g, ' ').replace('&mdash;', '-')
    const author = root.querySelector('a').childNodes[0].rawText
    const { href: url } = root.querySelectorAll('a')[1].rawAttributes
    let u = new URL(url)
    const urls = {
      'meta.stackexchange.com': 'Meta Stack Exchange',
      'stackoverflow.com': 'Stack Overflow',
      'pt.stackoverflow.com': 'Stack Overflow em Português',
      'meta.pt.stackoverflow.com': 'Meta Stack Overflow em Português',
      'es.stackoverflow.com': 'Stack Overflow en español',
      'meta.es.stackoverflow.com': 'Meta Stack Overflow en español',
      'ru.stackoverflow.com': 'Stack Overflow на русском',
      'meta.ru.stackoverflow.com': 'Meta Stack Overflow на русском',
      'ja.stackoverflow.com': 'スタック・オーバーフロー',
      'meta.ja.stackoverflow.com': 'Meta スタック・オーバーフロー',
      'askubuntu.com': 'Ask Ubuntu',
      'meta.askubuntu.com': 'Ask Ubuntu',
      'mathoverflow.net': 'Math Overflow',
      'meta.mathoverflow.net': 'Meta Math Overflow',
      'serverfault.com': 'Server Fault',
      'meta.serverfault.com': 'Meta Server Fault',
      'superuser.com': 'Super User',
      'meta.superuser.com': 'Meta Super User',
    }
    const sites = {
      'codereview': 'Code Review',
      'codegolf': 'Code Golf',
      'anime': 'Anime & Manga',
      'apple': 'Ask Different',
      'english': 'English Language & Usage',
      'ell': 'English Language Learners',
      'gamedev': 'Game Development',
      'graphicdesign': 'Graphic Design',
      'diy': 'Home Improvement',
      'security': 'Information Security',
      'japanese': 'Japanese Language',
      'magento': 'Magento',
      'mathematica': 'Mathematica',
      'math': 'Mathematics',
      'judaism': 'Mi Yodeya',
      'movies': 'Movies & TV',
      'music': 'Music: Practice & Theory',
      'networkengineering': 'Network Engineering',
      'money': 'Personal Finance & Money',
      'photo': 'Photography',
      'physics': 'Physics',
      'puzzling': 'Puzzling',
      'quantumcomputing': 'Quantum Computing',
      'raspberrypi': 'Raspberry Pi',
      'rpg': 'Role-playing Games',
      'salesforce': 'Salesforce',
      'scifi': 'Science Fiction & Fantasy',
      'sharepoint': 'Sharepoint',
      'dsp': 'Signal Processing',
      'skeptics': 'Skeptics',
      'softwareengineering': 'Software Engineering',
      'softwarerecs': 'Software Recommendations',
      'tex': 'TeX - LaTeX',
      'workplace': 'The Workplace',
      'cstheory': 'Theoretical Computer Science',
      'travel': 'Travel',
      'unix': 'Unix & Linux',
      'ux': 'User Experience',
      'webapp': 'Web Applications',
      'webmasters': 'Webmasters',
      'wordpress': 'WordPress Development',
      'worldbuilding': 'Worldbuilding',
    }
    for (const [name, site] of Object.entries(sites)) {
      sites[`meta.${name}`] = `Meta ${site}`
    }
    const hostname = u.hostname.split('.').reverse().slice(0, 2).reverse().join('.')
    let place = ''
    let match = Object.keys(urls).find(url => u.hostname.startsWith(url))
    if (match !== null) {
      place = urls[match]
    } else if (hostname === 'stackexchange.com') {
      let site = u.hostname.replace(`.${hostname}`, '')
      place = `${sites.hasOwnProperty(site) ? sites[site] : site} SE`
    } else {
      place = urls[hostname]
    }
    const [, questionName] = text.match(/questions\/\d+\/([^#]+)/)
    return '\n' + box(`${comment.trim().white} ${author.trim().red}`, `Comment from ${place} - ${questionName}`.blue, false, true)
  }
}

const postOnebox = {
  test: text => text.startsWith('<div class="onebox ob-post">'),
  replace: text => {
    const root = parse(text)
    let votes = root.querySelector('.ob-post-votes').rawText
    const title = root.querySelector('.ob-post-title').rawText
    const { title: user } = root.querySelector('.ob-post-body img').rawAttributes
    const body = root.querySelector('.ob-post-body').text
    const tags = root.querySelectorAll('.ob-post-tags .ob-post-tag').map(tag => tag.rawText)
    const { title: site } = root.querySelector('.ob-post-siteicon').rawAttributes
    const { href: url } = root.querySelector('.ob-post-title a').attributes
    const [, id] = url.match(/questions\/(\d+)\//)
    const fixedBody = body.replace(/\n/g, ' ')
    let thinTitle = trimBySpaces(title, 35)
    thinTitle += len(thinTitle) >= 35 ? '...' : ''
    let thinBody = trimBySpaces(fixedBody, 75)
    thinBody = len(thinBody) >= 35 ? spreadAcrossLines(thinBody, 35) : thinBody
    return '\n' + box(`
${joinLines([box(votes, 'votes'.red, true, true), box(thinBody, 'text'.red, false, true)])}
${joinLines([box(tags.map(t => t.bold).join(', '), 'tags'.green, false, true), box(user.underline, 'user'.green, false, true), box(id.toString().underline, 'qID'.green, true, true)])}
`, `${site.bold} - ${thinTitle.blue}`, false, true)
  }
}

const matchReplace = (regex, string, callback, two = false) => {
  let wip = string
  wip = wip.replace(regex, (...args) => {
    if (two) return callback(args[1], args[2])
    return callback(args[1])
  })
  return wip
}

const italic = {
  test: text => (/_[^_]+_/).test(text),
  replace: text => matchReplace(/_([^_]+)_/g, text, str => str.italic)
}
const bold = {
  test: text => (/\*\*[^*]+\*\*/).test(text),
  replace: text => matchReplace(/\*\*([^*]+)\*\*/g, text, str => str.bold)
}
const italicAsterisk = {
  test: text => (/\*[^*]+\*/).test(text),
  replace: text => matchReplace(/\*([^*]+)\*/g, text, str => str.italic)
}

const boldHTML = {
  test: text => (/<b>[^<>]+<\/b>/).test(text),
  replace: text => matchReplace(/<b>([^<>]+)<\/b>/g, text, str => str.bold)
}
const italicHTML = {
  test: text => (/<i>[^<>]+<\/i>/).test(text),
  replace: text => matchReplace(/<i>([^<>]+)<\/i>/g, text, str => str.italic)
}
const codeHTML = {
  test: text => (/<code>[^<>]+<\/code>/).test(text),
  replace: text => matchReplace(/<code>([^<>]+)<\/code>/g, text, str => str.inverse)
}
const linkHTML = {
  test: text => (/<a href="([^"]+)"(?: rel="nofollow noopener noreferrer")?>([^<>]+)<\/a>/).test(text),
  replace: text => matchReplace(/<a href="([^"]+)"(?: rel="nofollow noopener noreferrer")?>([^<>]+)<\/a>/g, text, (link, title) => terminalLink(title, link.replace(/^\/\//, 'https://')), true)
}

const all = {
  postOnebox,
  quote,
  bold,
  boldHTML,
  italic,
  italicHTML,
  italicAsterisk,
  codeHTML,
  linkHTML
}

function test(text) {
  let wip = text
  for (const [name, type] of Object.entries(all)) {
    const isMatch = type.test(wip)
    if (isMatch && !type.replace) {
      console.log(`Text matched ${name} type but no replacement function exists`)
    } else if (isMatch) {
      wip = type.replace(wip)
    }
  }
  return wip
}

function fix(text) {
  const replacement = test(text)
  // if (replacement === null) {
  //   // console.log('no parser found for text')
  //   return text
  // }
  return replacement || text
}

module.exports = fix
