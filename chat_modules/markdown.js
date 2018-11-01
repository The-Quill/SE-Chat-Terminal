// const center = require('center-align')
const { parse } = require('node-html-parser')
require('colors')
const terminalLink = require('terminal-link')
const { AllHtmlEntities: Entities } = require('html-entities')
const Ansi = require('./ansi')
 
const entities = new Entities();

const quote = {
  test: text => text.startsWith('<div class="quote">') && (/#comment\d+_\d+/).test(text),
  replace: text => {
    const root = parse(text)
    const comment = entities.decode(root.querySelector('.quote').childNodes.filter(node => !node.rawAttributes || !node.rawAttributes.hasOwnProperty('rel')).map(node => node.rawText).join('').replace(/\n/g, ' ').replace('&mdash;', ''))
    const author = root.querySelector('a').childNodes[0].rawText
    const { href: url } = root.querySelectorAll('a').filter(a => a.rawAttributes.hasOwnProperty('rel'))[1].rawAttributes
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
      'meta.superuser.com': 'Meta Super User'
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
      'worldbuilding': 'Worldbuilding'
    }
    for (const [name, site] of Object.entries(sites)) {
      sites[`meta.${name}`] = `Meta ${site}`
    }
    const hostname = u.hostname.split('.').reverse()
      .slice(0, 2)
      .reverse()
      .join('.')
    let place = ''
    let match = Object.keys(urls).find(domain => u.hostname.startsWith(domain))
    if (match !== null) {
      place = urls[match]
    } else if (hostname === 'stackexchange.com') {
      let site = u.hostname.replace(`.${hostname}`, '')
      place = `${sites.hasOwnProperty(site) ? sites[site] : site} SE`
    } else {
      place = urls[hostname]
    }
    const [, questionName] = text.match(/questions\/\d+\/([^#]+)/)
    const spreadComment = Ansi.spreadAcrossLines(comment.trim(), 60)
    return '\n' + Ansi.box(spreadComment, terminalLink(`Comment from ${place}`.blue, url), false, true)
  }
}

const postOnebox = {
  test: text => text.startsWith('<div class="onebox ob-post">'),
  replace: text => {
    const TITLE_LENGTH = 35
    const BODY_LENGTH = 75
    const root = parse(text)
    let votes = root.querySelector('.ob-post-votes').rawText
    const title = root.querySelector('.ob-post-title').rawText
    const { title: user } = root.querySelector('.ob-post-body img').rawAttributes
    const body = root.querySelector('.ob-post-body').text
    const tags = root.querySelectorAll('.ob-post-tags .ob-post-tag').map(tag => tag.rawText)
    const { title: site } = root.querySelector('.ob-post-siteicon').rawAttributes
    let { href: url } = root.querySelector('.ob-post-title a').attributes
    url = url.replace(/^\/\//, 'https://')
    const [, id] = url.match(/questions\/(\d+)\//)
    const fixedBody = body.replace(/\n/g, ' ')
    let thinTitle = Ansi.trimBySpaces(title, TITLE_LENGTH)
    thinTitle += Ansi.len(thinTitle) >= TITLE_LENGTH ? '...' : ''
    let thinBody = Ansi.trimBySpaces(fixedBody, BODY_LENGTH)
    thinBody = Ansi.len(thinBody) >= TITLE_LENGTH ? Ansi.spreadAcrossLines(thinBody, TITLE_LENGTH) : thinBody
    return '\n' + Ansi.box(`
${Ansi.joinLines([Ansi.box(votes, 'votes'.red, true, true), Ansi.box(thinBody, 'text'.red, false, true)])}
${Ansi.joinLines([Ansi.box(tags.map(t => t.bold).join(', '), 'tags'.green, false, true), Ansi.box(user.underline, 'user'.green, false, true), Ansi.box(terminalLink(id.toString().underline, url), 'qID'.green, true, true)])}
`, `${entities.decode(site).bold} - ${entities.decode(thinTitle).blue}`, false, true)
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

const tagHTML = {
  test: text => (/<a href="([^"]+)"><span class="ob-post-tag"/).test(text),
  replace: text => matchReplace(/<a href="([^"]+)"><span class="ob-post-tag" style="[^"]+">([^<]+)<\/span><\/a>/g, text, (link, title) => `[${terminalLink(title, link.replace(/^\/\//, 'https://')).white}]`, true)
}

const arrow = {
  test: text => text.includes('&rarr;'),
  replace: text => text.replace(/&rarr;/g, '→')
}

let a = '\u001b]8;;https://chat.meta.stackexchange.com/transcript/message/7335865#7335865\u00076 mins ago, by Jon Ericson\u001b]8;;\u0007'

const oneboxMessage = {
  test: text => (/<div class="onebox ob-message"><a rel="noopener noreferrer" class="roomname"/g).test(text),
  replace: (text, context) => {
    const root = parse(text)
    const { href } = root.querySelector('a').rawAttributes
    const age = root.querySelector('a').rawText
    const author = root.querySelector('.user-name').rawText
    const body = root.querySelector('div.quote').rawText
    return '\n' + Ansi.box(` | ${body}`, terminalLink(`${age}, by ${author}`.blue, `https://chat.${context.domain}.com${href}`), false, false)
  }
}

const oneboxImage = {
  test: text => (/^<div class="onebox ob-image">/).test(text),
  replace: text => {
    const root = parse(text)
    const { href } = root.querySelector('a').rawAttributes
    return '\n' + Ansi.box(terminalLink(href.green, href), 'Image'.blue, true, false)
  }
}

const all = {
  postOnebox,
  oneboxMessage,
  oneboxImage,
  quote,
  bold,
  boldHTML,
  italic,
  italicHTML,
  italicAsterisk,
  codeHTML,
  linkHTML,
  tagHTML,
  arrow,
}

function test(text, context) {
  let wip = text
  for (const [name, type] of Object.entries(all)) {
    const isMatch = type.test(wip)
    if (isMatch && !type.replace) {
      console.log(`Text matched ${name} type but no replacement function exists`)
    } else if (isMatch) {
      wip = type.replace(wip, context)
    }
  }
  for (const [name, type] of Object.entries(all)) {
    const isMatch = type.test(wip)
    if (isMatch && !type.replace) {
      console.log(`Text matched ${name} type but no replacement function exists`)
    } else if (isMatch) {
      wip = type.replace(wip, context)
    }
  }
  return wip
}

function fix(text, context) {
  const replacement = test(text, context)
  // if (replacement === null) {
  //   // console.log('no parser found for text')
  //   return text
  // }
  return replacement || text
}

module.exports = fix
