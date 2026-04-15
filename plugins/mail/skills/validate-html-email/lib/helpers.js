// const backgroundImageRegex = /( )*background( )*\:( )*url\((\ |\"|\'|\`)*(.*?)(\ |\"|\'|\`)*\)|( )*background-image( )*\:( )*url\((\ |\"|\'|\`)*(.*?)(\ |\"|\'|\`)*\)/gm
const backgroundImageRegex = /background(?:-image)?:\s*[^;]*url\(['"]?(.*?)['"]?\)/gmi

const allTrim = string => {
  if (typeof string !== 'string') {
    string = String(string)
  }

  return string.trim().replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/, '')
}

const getAttrObj = (attrs) => {
  const arrAttrs = {}
  let attrMatch
  let attrMatchCount = 0
  const regAttr = /\s*([^\s"'>\/=\x00-\x0F\x7F\x80-\x9F]+)(?:\s*=\s*(?:(")([^"]*)"|(')([^']*)'|([^\s"'>]*)))?/g

  while ((attrMatch = regAttr.exec(attrs))) {
    const name = attrMatch[1]
    const quote = attrMatch[2]
      ? attrMatch[2]
      : attrMatch[4]
        ? attrMatch[4]
        : ''
    const value = attrMatch[3]
      ? attrMatch[3]
      : attrMatch[5]
        ? attrMatch[5]
        : attrMatch[6]
          ? attrMatch[6]
          : ''
    if (name in arrAttrs) {
      if (!arrAttrs.dublicate) {
        arrAttrs.dublicate = []
      }
      arrAttrs.dublicate.push(name)
    }

    if (typeof arrAttrs[name] === 'string' && typeof value === 'string') {
      arrAttrs[name] += ' ' + value
    } else if (['null', 'undefined'].includes(typeof arrAttrs[name])) {
      arrAttrs[name] = value
    }
    attrMatchCount += attrMatch[0].length
  }
  return arrAttrs
}

const getTagAttr = (html, option) => {
  const trimmedHtml = allTrim(html)
  const res = {}
  if (Object.keys(option).length) {
    for (const tagName in option) {
      res[tagName] = []
      const tagReg = new RegExp(option[tagName], 'gm')
      const arrMatch = trimmedHtml.match(tagReg)
      if (Array.isArray(arrMatch) && arrMatch.length) {
        for (const matchedString of arrMatch) {
          res[tagName].push(
            Object.assign(getAttrObj(matchedString), {
              raw: matchedString /** support get parent */
            })
          )
        }
      }
    }
  }
  return res
}

var encodedStr = rawStr => rawStr.replace(/[u00A0-u9999<>&]/gim, function (i) {
  return '&#' + i.charCodeAt(0) + ';'
})

const getRegex = (html, regex) => {
  let m;
  let matched = []
  while ((m = regex.exec(html)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match, groupIndex) => {
      match && match.trim() && matched.push(match)
    });
  }
  return matched.filter(m => m && !regex.test(m))
}

const isAbsoluteUrl = (urlStr) => {
  let res = false
  try {
    const urlIns = new URL(urlStr)
    res = true // valid syntax
    if (!['https:', 'http:'].includes(urlIns.protocol)) { // valid protocol
      res = false
    }
    if (!urlIns.hostname) { // valid hostname
      res = false
    }
    if (!urlIns.host) { // valid host
      res = false
    }
    if (urlIns.password) { // valid hostname
      res = false
    }
    if (urlIns.username) { // valid hostname
      res = false
    }
  } catch (error) { }
  return res
}

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function () {
    console.log('Async: Copying to clipboard was successful!');
    $('.toast').toast('show');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}

const getAllLinksIncludeBackground = html => {
  return [...getRegex(html, /href="(.*?)"|src="(.*?)"|href='(.*?)'|src='(.*?)'/gm), ...getRegex(html, backgroundImageRegex)]
}

function countOccurences(string, word) {
  return string.split(word).length - 1;
}

/**
 * Cách ly StartIF Tag, EndIf Tag, SafeComment Tag, Comment Content
 * Tìm thấy đoạn Real html để check
 * 
 */
function removeCommentSafe(html) {
  const safeIf = /<!(-| )*>/gm
  const startIf = /<!--( )*\[[^\]]*\]( )*>( )*(-->)*/gm
  const endIf = /(<!--)*( )*<!\[[^\]]*\]( )*-->/gm
  const commentContent = /<!--(?:.|\n|\r)+?-->/gm
  const res = html
    /** Cách ly If in OutLook */
    .replace(startIf, 'startIf')
    .replace(endIf, 'endIf')
    .replace(safeIf, 'safeIf')
    /** Remove comment */
    .replace(commentContent, '')

  /** Debug */
  console.log('--', res.includes('--'))
  if (res.includes('--')) {
    console.log(res)
  }
  return res
}

function isInternalLink(link) {
  const inHosts = [
    'marine.honda.com',
    'powersports.honda.com',
    'automobiles.honda.com',
    'honda.com',
    'powerequipment.honda.com',
  ].map(inHost => `^(https|http)*(:\/\/)*(www\.)*${inHost}`).join('|')
  const regExp = new RegExp(inHosts, 'gm')
  return regExp.test(link)
}

function aliasValidFormat(alias) {
  if (typeof alias === 'string' && alias.length) {

    const acc = regexMatchContent(/^([A-Z0-9]+-[A-Z0-9]+)/gm, alias)
    const campaignCode = (Array.isArray(acc) && acc.length && acc[0]) || ''

    const re = []
    for (let i = 0; i < alias.length; i++) {
      var reg = null
      if (!campaignCode.length) reg = null
      else if (i < campaignCode.length) reg = /[\-0-9a-zA-Z]/gm
      else reg = /[0-9a-zA-Z_]/gm
      if (String(alias[i]).match(reg)) {
        re.push(`<span class="text-success">${alias[i] || '?'}</span>`)
      } else {
        if (alias[i] === ' ')
          re.push(`<pre class="bg-danger lead d-inline">${alias[i]}</pre>`)
        else
          re.push(`<pre class="bg-danger text-white d-inline">${alias[i]}</pre>`)
      }
    }
    return re.join('')
  }
  return alias
}

// https://stackoverflow.com/questions/5796718/html-entity-decode
function decodeHtmlEntities(html) {
  const element = $('<textarea />').html(html)
  const text = (element.text() || '').replaceAll(' ', ' ')
  element.remove()
  return text
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions?retiredLocale=vi
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function findByRegex(text, regex) {
  let m
  const found = []

  while ((m = regex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      match && match.trim() && found.push(match)
    })
  }
  return found
}