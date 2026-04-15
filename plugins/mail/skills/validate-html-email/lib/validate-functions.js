const SPECIAL_CHARACTERS = [
  '&rsquo;',
  '&reg;',
  '&copy;',
  '®',
  '©',
  '&#169;',
  '&#8212;',
]

const INVALID_SPECIAL_CHARACTERS = ['®', '©',]

const REPLACE_SPECIAL_CHARACTERS = {
  '®': '&reg;',
  '©': '&copy;',
  '&nbsp;': ' ',
  '<br>': ' '
}

const whiteListHrefs = ['%%profile_center_URL%%']
const isWhiteListLink = link => (
  link.includes('https://fonts.googleapis.com') ||
  whiteListHrefs.includes(link)
)
const whitelistOther = [
  '%%view_email_url%%',
  '%%profile_center_URL%%',
  'https://www.facebook.com/HondaPowersports',
  'http://instagram.com/honda_powersports_us/',
  'https://twitter.com/HondaPowersprts/',
  'https://www.youtube.com/user/HondaPowersportsUS',
  'https://www.honda.com/privacy/privacy-policy.pdf',
]



const getQueryFromFullPath = (fullPath = '') => {
  const splittedFullPathArr = fullPath.split('?')
  return (splittedFullPathArr[splittedFullPathArr.length - 1] || '').split('&').reduce((resultObj, queryStr) => {
    const splittedQueryArr = queryStr.split('=')
    const key = splittedQueryArr[0]
    splittedQueryArr.splice(0, 1)
    resultObj[key] = splittedQueryArr.join('=')
    return resultObj
  }, {})
}

const getReplacedText = text => {
  let replacedText = allTrim(text)
  for (const key in REPLACE_SPECIAL_CHARACTERS) {
    replacedText = replacedText.replaceAll(key, REPLACE_SPECIAL_CHARACTERS[key])
  }
  return replacedText
}

const getTextCurrentTagOfPattern = (html, pattern, findTimes = 2, options = {}) => {
  const { boldPattern = true } = options
  let stringIndex
  const trimmedHtml = allTrim(html)
  let findIndexHtml = trimmedHtml
  for (let i = 0; i < findTimes; i++) {
    stringIndex = (stringIndex ? (stringIndex + pattern.length) : 0) + findIndexHtml.indexOf(pattern)
    if (stringIndex === -1) {
      return ''
    }

    findIndexHtml = trimmedHtml.substring(stringIndex + pattern.length, trimmedHtml.length - 1)
  }
  if (stringIndex === -1) {
    return ''
  }
  let startIndex = stringIndex
  let lastIndex = startIndex + pattern.length
  for (let i = startIndex - 1; i >= 0; i--) {
    if (trimmedHtml[i] === '>') {
      startIndex = i + 1
      break
    }
  }
  for (let i = lastIndex; i < trimmedHtml.length; i++) {
    if (trimmedHtml[i] === '<') {
      lastIndex = i
      break
    }
  }
  let result = trimmedHtml.substring(startIndex, lastIndex)
  if (boldPattern) {
    result = result.replace(pattern, `<b>${pattern}</b>`)
  }
  return result
}

const focusEl = selector => {
  document.querySelector(selector).focus()
}

const uniq = arr => [...new Set(arr)];

const getContentsByTag = (html, tagName) => {
  const regex = new RegExp(`<${tagName}.*?<\/${tagName}>`)
  const trimmedHtml = allTrim(html)
  return trimmedHtml.match(regex) || []
}

const getAllLinksFromHtml = html => {
  const all = (allTrim(html).replace(/<!-->|<!--|-->|]>|<!/gm, '').match(/<[^<>]+>/gm) || [])
  const allLinks = []
  all.forEach(tag => {
    const attrObj = getAttrObj(tag)
    if (attrObj.href) {
      allLinks.push({
        href: attrObj.href,
        alias: attrObj.alias,
        target: attrObj.target
      })
    }
  })
  return allLinks
}

const updateDayDateformattoAMPScript = html => {
  const bodyContent = getContentsByTag(html, 'body')[0]
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' }
  }
  const textFormat1 = '%%=format(Now(),"yyyy")=%%'
  const passed = bodyContent.includes(textFormat1)
  let message
  if (passed) {
    let includeText
    if (bodyContent.includes(textFormat1)) {
      includeText = textFormat1
      message = `Html contains ${textFormat1}`
    }
    message += `in "....${getTextCurrentTagOfPattern(bodyContent, includeText)}...."`

  } else {
    message = 'Missing variable: <b>%%=format(Now(),"yyyy")=%%</b>'
  }
  const warnings = []
  const matchedFormat1 = (bodyContent).match(/\d{4}/g)
  if (matchedFormat1) {
    warnings.push(`<div>Have some text with format YYYY: ${uniq(matchedFormat1).map(e => `<b>${e}</b>`).join(', ')}</div>`)
  }
  const matchedFormat2 = (bodyContent).match(/\d{4}, (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g)
  if (matchedFormat2) {
    warnings.push(`<div>Have some text with format YYYY, MMM: ${uniq(matchedFormat2).map(e => `<b>${e}</b>`).join(', ')}</div>`)
  }
  const matchedFormat3 = (bodyContent).match(/\d{4}, (January|February|March|April|May|June|July|August|September|October|November|December)/g)
  if (matchedFormat3) {
    warnings.push(`<div>Have some text with format YYYY, MMMM(Full month): ${uniq(matchedFormat3).map(e => `<b>${e}</b>`).join(', ')}</div>`)
  }
  const matchedFormat4 = (bodyContent).match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g)
  if (matchedFormat4) {
    warnings.push(`<div>Have some text with format MMM: ${uniq(matchedFormat4).map(e => `<b>${e}</b>`).join(', ')}</div>`)
  }
  const matchedFormat5 = (bodyContent).match(/(January|February|March|April|May|June|July|August|September|October|November|December)/g)
  if (matchedFormat5) {
    warnings.push(`<div>Have some text with format MMMM(Full month): ${uniq(matchedFormat5).map(e => `<b>${e}</b>`).join(', ')}</div>`)
  }
  return {
    passed,
    message,
    warning: warnings.join('')
  }
}

const addOpenTrackingCodeToEmail = html => {
  // TODO: trim spaces, sort attribute, close tag
  const bodyContent = getContentsByTag(html, 'body')[0] || ''
  const errorMessages = []
  let passed = true
  if (!bodyContent) {
    passed = false
    errorMessages.push('Missing body tag')
  }
  const patternCustomTag = /(<custom name="opencounter" type="tracking" ?\/>)|(<custom type="tracking" name="opencounter" ?\/>)|(<custom name="opencounter" type="tracking" ?> ?<\/custom>)|(<custom type="tracking" name="opencounter" ?> ?<\/custom>)/g
  const tagTexts = `<b>&lt;custom name="opencounter" type="tracking" /></b> or <b>&lt;custom name="opencounter" type="tracking">&lt;/custom></b>`
  const matchedPatternCustomTag = bodyContent.match(patternCustomTag)
  if (!matchedPatternCustomTag) {
    errorMessages.push(`<div>Missing Tag: ${tagTexts}</div>`)
  }
  if (isPatternInComment(bodyContent, patternCustomTag)) {
    passed = false
    errorMessages.push('<div>Custom tag <b>&lt;custom name="opencounter" type="tracking" /></b> is in comment</div>')
  }
  if (matchedPatternCustomTag?.length > 1) {
    passed = false
    errorMessages.push('<div>Custom tag <b>&lt;custom name="opencounter" type="tracking" /></b> is dupplicating</div>')
  }
  return {
    passed,
    message: passed ? ('Html Contain' + tagTexts) : errorMessages.join('')
  }
}

const ensureAllLinksHaveAliasAttributeApplied = html => {
  let passed = true
  const allLinks = getAllLinksFromHtml(html)
  const allLinkAlias = []
  const missingAliasHrefs = []
  const dupplicateAlias = []
  for (const linkObj of allLinks) {
    const { alias, href } = linkObj
    if (!isWhiteListLink(href)) {
      if (!alias) {
        passed = false
        missingAliasHrefs.push(href)
      }
      if (allLinkAlias.includes(alias)) {
        passed = false
        if (alias && !dupplicateAlias.includes(alias)) {
          dupplicateAlias.push(alias)
        }
      }
      allLinkAlias.push(alias)
    }
  }
  const message = (passed ? ['All links have alias and all alias is uniqued'] : [
    missingAliasHrefs.length ? `<div><b>Hrefs missing alias:</b> ${missingAliasHrefs.map((href, index) => `<div><b>${index + 1}</b>: ${href}</div>`).join('')}</div>` : '',
    dupplicateAlias.length ? `<div class="mt-2"><b>Alias is dupplicating:</b> ${dupplicateAlias.map((alias, index) => `<div><b>${index + 1}</b>: ${alias}</div>`).join('')}</div>` : ''
  ].join(''))
  return {
    passed,
    message
  }
}

const updateViewAsWebURL = html => {
  const allLinks = getAllLinksFromHtml(html)
  const countLinkValidHref = allLinks.filter(e => e.href === '%%view_email_url%%').length
  const passed = !!countLinkValidHref
  return {
    passed,
    message: passed ? `Html have ${countLinkValidHref} link with href = %%view_email_url%%` : 'Mising link have href: %%view_email_url%%'
  }
}

const oldCustomAmpscript = html => {
  const bodyContent = getContentsByTag(html, 'body')[0]
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' }
  }
  const customAmpscriptString = `<\!--CUSTOM AMPSCRIPT--> <\!--%%[ /*ENCODES EMAIL TO BASE64 FOR USE IN THE PROFILE CENTER URL. IF YOU REMOVE THIS IT COULD BREAK THE PREFERENCE CENTER LINK*/ SET @EmailID = Base64Encode(EMAIL) /* SET RECIPIENTID BY CONCATENATING 3 SYSTEM STRINGS*/ SET @recipientID = concat(jobid,subscriberid,_JobSubscriberBatchID) ]%% -->`
  const passed = bodyContent.includes(customAmpscriptString)
  return {
    passed,
    message: passed ? `Html contain <pre>
&lt;!--CUSTOM AMPSCRIPT-->
  &lt;!--%%[
  /*ENCODES EMAIL TO BASE64 FOR USE IN THE PROFILE CENTER URL. IF YOU REMOVE THIS IT COULD BREAK THE PREFERENCE CENTER LINK*/
      SET @EmailID = Base64Encode(EMAIL)
  /* SET RECIPIENTID BY CONCATENATING 3 SYSTEM STRINGS*/
      SET @recipientID = concat(jobid,subscriberid,_JobSubscriberBatchID)
  ]%%
-->
</pre>` : `Missing CUSTOM AMSCRIPT String<pre>
&lt;!--CUSTOM AMPSCRIPT-->
  &lt;!--%%[
  /*ENCODES EMAIL TO BASE64 FOR USE IN THE PROFILE CENTER URL. IF YOU REMOVE THIS IT COULD BREAK THE PREFERENCE CENTER LINK*/
      SET @EmailID = Base64Encode(EMAIL)
  /* SET RECIPIENTID BY CONCATENATING 3 SYSTEM STRINGS*/
      SET @recipientID = concat(jobid,subscriberid,_JobSubscriberBatchID)
  ]%%
-->
</pre>`
  }
}

const newCustomAmpscript = html => {
  const bodyContent = getContentsByTag(html, 'body')[0]
  const mapData = []
  /** DETECT MAIL TYPE */
  const aTagMatched = getTagAttr(bodyContent, { 'aTag': '<a[^>]*(alias)+[^>]*>' }).aTag
  var mailType = undefined /** Khác loại **/
  aTagMatched.some(({ href }) => {
    mailType = /^(https:\/\/powersports.honda.com)/.test(href) ? 'HPS' :
      /^(https:\/\/powerequipment.honda.com)/.test(href) ? 'HPE' :
        /^(https:\/\/marine.honda.com)/.test(href) ? 'MARINE' :
          /^(https:\/\/engines.honda.com)/.test(href) ? 'ENGINES' :
            /^(https:\/\/automobiles.honda.com)/.test(href) ? 'HONDA' :
              /^(https:\/\/www.acura.com)/.test(href) ? 'ACURA' : undefined
    return mailType
  })
  mapData.push(`<h1 class="ml-1 text-danger">Mail Type: ${mailType || 'UNKNOW'}</h1>`)
  let passedOnetrust = false
  if (!bodyContent) {
    return { passedOnetrust: false, message: 'Missing body tag' }
  }

  const powersportsScript = `<!--POWERSPORTS ONETRUST OPT OUT--><!--%%[SET @emailaddress = AttributeValue("email")SET @offercode = AttributeValue("offercode")SET @pageURL = CloudPagesUrl(6107, 'email',@emailaddress, 'offercode',@offercode)SET @pageURLALL = CloudPagesUrl(6107, 'email',@emailaddress, 'offercode','optoutall')]%%--><!--POWERSPORTS ONETRUST OPT OUT-->`

  const peMarineEnginesScript = `<!--PE/MARINE/ENGINES ONETRUST OPT OUT--><!--%%[SET @emailaddress = AttributeValue("email")SET @offercode = AttributeValue("offercode")SET @pageURL = CloudPagesUrl(6112, 'email',@emailaddress, 'offercode',@offercode)SET @pageURLALL = CloudPagesUrl(6112, 'email',@emailaddress, 'offercode','optoutall')]%%--><!--PE/MARINE/ENGINES ONETRUST OPT OUT-->`

  const standardCode = mailType === 'HPS' ?
    `&lt;!--POWERSPORTS ONETRUST OPT OUT--&gt;
    &lt;!--%%[
      SET @emailaddress = AttributeValue("email")
      SET @offercode = AttributeValue("offercode")
      SET @pageURL = CloudPagesUrl(6107, 'email',@emailaddress, 'offercode',@offercode)
      SET @pageURLALL = CloudPagesUrl(6107, 'email',@emailaddress, 'offercode','optoutall')
    ]%%--&gt;
  &lt;!--POWERSPORTS ONETRUST OPT OUT--&gt;` :
    `&lt;!--PE/MARINE/ENGINES ONETRUST OPT OUT--&gt;
    &lt;!--%%[
      SET @emailaddress = AttributeValue("email")
      SET @offercode = AttributeValue("offercode")
      SET @pageURL = CloudPagesUrl(6112, 'email',@emailaddress, 'offercode',@offercode)
      SET @pageURLALL = CloudPagesUrl(6112, 'email',@emailaddress, 'offercode','optoutall')
    ]%%--&gt;
  &lt;!--PE/MARINE/ENGINES ONETRUST OPT OUT--&gt;`

  if (mailType === 'HPS') {
    const bodyContentNoSpaces = bodyContent.replace(/\s+/g, '')
    const scriptNoSpaces = powersportsScript.replace(/\s+/g, '')
    passedOnetrust = bodyContentNoSpaces.includes(scriptNoSpaces)
  } else if (['HPE', 'MARINE', 'ENGINES'].includes(mailType)) {
    const bodyContentNoSpaces = bodyContent.replace(/\s+/g, '')
    const scriptNoSpaces = peMarineEnginesScript.replace(/\s+/g, '')
    passedOnetrust = bodyContentNoSpaces.includes(scriptNoSpaces)
  }

  return {
    passed: passedOnetrust,
    message: `${passedOnetrust ? 'Passed' : 'Failed' + standardCode}` + mapData.join('')
  }
}

const addTrackingToLinks = html => {
  const allLinks = getAllLinksFromHtml(html)
  const whitelistLinks = whitelistOther
  const variables = {
    pgrcd: '%%PROGID%%',
    cmpcd: '%%CAMPAIGNCODE%%',
    ofrcd: '%%OFFERCODE%%'
  }
  let passed = true
  const warnings = []
  const messages = []

  const CFCCodeCID = checkFormatCampaignCodeCID(html)
  isWhiteListCIDLink = href => href && CFCCodeCID && CFCCodeCID.CIDLink && CFCCodeCID.CIDLink === href
  for (const linkObj of allLinks) {
    const { href } = linkObj
    const isWhite = !isInternalLink(href) ||
      whitelistLinks.includes(href) ||
      href.includes('?email=%%=v(@EmailID)=%%') ||
      href.includes('https://fonts.googleapis.com') ||
      isWhiteListCIDLink(href)
    if (isWhite) {
      // warnings.push(`<div>Link <b>${href}</b> is skipped</div>`)
    } else {
      const query = getQueryFromFullPath(href)
      const invalidKeys = []
      for (const key in variables) {
        if (!query[key] || query[key] !== variables[key]) {
          passed = false
          invalidKeys.push(key)
        }
      }
      if (invalidKeys.length) {
        messages.push(`${href}: <b>${invalidKeys.map(key => `${key}=${query[key] || ''}`).join(', ')}</b>`)
      }
    }
  }
  let message
  if (passed) {
    message = 'All links contain valid query. <b>pgrcd=%%PROGID%%&cmpcd=%%CAMPAIGNCODE%%&ofrcd=%%OFFERCODE%%</b>'
  } else {
    message = `Have some link contain not valid query: ${messages.map((e, index) => `<div><b>${index + 1}</b> ${e}</div>`).join('')}`
  }
  return {
    passed,
    message,
    warning: warnings.join('')
  }
}

const ensureThePreviewTextInTheHTMLMatchesPreviewTextOnCopyDeck = (html, options = {}) => {
  const { previewText } = options
  if (!previewText) {
    return {
      passed: false,
      message: `Please input preview Text for check this case. <button class="btn btn-sm btn-primary" onclick="focusEl('#input-preview-text')">Click here to focus</button>`
    }
  }
  const bodyContent = getContentsByTag(html, 'body')[0]
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' }
  }
  if (!/<!-- ?Preview Text is handled in SFMC interface ?-->/.test(bodyContent)) {
    return {
      passed: false,
      message: 'Missing <b><!-- Preview Text is handled in SFMC interface --></b> line'
    }
  }
  const splitted1 = bodyContent.split('Preview Text is handled in SFMC interface')[1] || ''
  const splitted2 = splitted1.split('</div>')[0] || ''
  if (!splitted2.includes(previewText)) {
    return {
      passed: false,
      message: `<div>Preview Text is not matching.</div>`
    }
  }
  const splitted3 = splitted2.split(previewText)[1] || ''
  const matched = splitted3.match(/&zwnj;&nbsp;/g)
  let warning
  if (!matched || (matched && matched.length <= 100)) {
    // passed = false
    warning = `Need more than 100 character <b>&amp;zwnj;&amp;nbsp;</b> after preview text`
  }
  return {
    passed: true,
    message: 'Preview text is matching with text copy',
    warning
  }
}

const checkPhysicalAddress = (html) => {
  const bodyTags = regexMatchContent(/<body[^>]*>(?:.|\n|\r)+?<\/body>/gm, allTrim(removeCommentSafe(html)))
  const bodyContent = (Array.isArray(bodyTags) && bodyTags.length && bodyTags[0]) || ''
  const mapData = []
  let passed = true

  // Check required variables
  const variables = ['CHI-5', '1919 Torrance Blvd', 'Torrance', 'CA', '90501-2746', 'U.S']
  let sourceEmail = bodyContent

  variables.forEach((variable, index) => {
    const isPassItem = sourceEmail.includes(variable)
    sourceEmail = sourceEmail.replace(variable, '')
    if (isPassItem) {
      mapData.push(`<div><b>${index + 1}</b><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">${variable}</span></div>`)
    } else {
      passed = false
      mapData.push(`<div><b>${index + 1}</b><span class="ml-1 badge badge-danger">Missing</span><span class="ml-1 text-danger">${variable}</span></div>`)
    }
  })

  // Check physical address format
  const addressRegex = /American Honda Motor Co\., Inc\.<br> Att: Customer Service &ndash; Unsubscribe<br> Mail Stop: CHI-5<br> 1919 Torrance Blvd.<br>Torrance, CA 90501-2746, U.S./
  const hasAddress = addressRegex.test(bodyContent)

  if (hasAddress) {
    mapData.push(`
      <div>
        <b>${mapData.length + 1}</b>
        <span class="ml-1 badge badge-success">Physical address format OK</span>
      </div>`)
  } else {
    passed = false
    mapData.push(`
      <div>
        <b>${mapData.length + 1}</b>
        <span class="ml-1 badge badge-danger">Invalid physical address format</span>
        <span class="ml-1 text-danger">&lt;p style="margin: 0;"&gt;American Honda Motor Co., Inc.&lt;br&gt; Att: Customer Service &ndash; Unsubscribe&lt;br&gt; Mail Stop: CHI-5&lt;br&gt; 1919 Torrance Blvd.&lt;br&gt; Torrance, CA 90501-2746, U.S.&lt;/p&gt;></span&lt;p></span>
      </div>`)
  }

  // Check copyright text
  const copyrightRegex = /&#169; %%=format\(Now\(\),"yyyy"\)=%% American Honda Motor Co., Inc. \("AHM"\)/
  const hasCopyright = copyrightRegex.test(bodyContent)

  if (hasCopyright) {
    mapData.push(`
      <div>
        <b>${mapData.length + 1}</b>
        <span class="ml-1 badge badge-success">Copyright text OK</span>
      </div>`)
  } else {
    passed = false
    mapData.push(`
      <div>
        <b>${mapData.length + 1}</b>
        <span class="ml-1 badge badge-danger">Invalid copyright text</span>
        <span class="ml-1 text-danger">Expected format: &#169; %%=format(Now(),"yyyy")=%% American Honda Motor Co., Inc. ("AHM"). All information contained herein applies only to products and services sold in the U.S. See our</span>
      </div>`)
  }

  return { passed, message: mapData.join('\n') }
}

// Line 37. Hide default Profile Center
const checkHideDefaultProfileCenter = (htmlSrc) => {
  const bodyTags = regexMatchContent(/<body[^>]*>(?:.|\n|\r)+?<\/body>/gm, htmlSrc)
  const bodyContent = (Array.isArray(bodyTags) && bodyTags.length && bodyTags[0]) || ''

  const PCC_arr = [
    `<!--HIDE THIS BECAUSE WE DON'T USE THE DEFAULT PREFERENCE CENTER-->`,
    `<!--HIDE THIS BECAUSE WE DO NOT USE THE DEFAULT PREFERENCE CENTER-->`,
    `<!--HIDE THIS BECAUSE WE ISN'T USE THE DEFAULT PREFERENCE CENTER-->`,
    `<!--HIDE THIS BECAUSE WE IS NOT USE THE DEFAULT PREFERENCE CENTER-->`,
    `<!--HIDE THIS BECAUSE THE DEFAULT PREFERENCE CENTER ISN'T WORKING-->`,
    `<!--HIDE THIS BECAUSE THE DEFAULT PREFERENCE CENTER ISN'T UTILIZED AND SFMC REQUIRES A 'PHYSICAL ADDRESS'-->
`
  ]
  const pass1 = PCC_arr.find(sample => bodyContent.includes(sample))

  const PCU = `<span style="font-size:0px; display:none;"><a href="%%profile_center_URL%%" style="font-size:0px;display:none;"> %%Member_Busname%% %%Member_Addr%% %%Member_City%%, %%Member_State%%, %%Member_PostalCode%%, %%Member_Country%%</a></span>`
  const bodyContentNoComment = bodyContent.replace(/<!--[\s\S]*?-->/gm, '')
  const spanTags = regexMatchContent(/<span [^>]*>( )*<a (href="%%profile_center_URL%%")+( )*[^>]*>(.*?)<\/a>( )*<\/span>/gm, allTrim(bodyContentNoComment))
  const spanContent = (Array.isArray(spanTags) && spanTags.length && spanTags[0]) || ''

  const tagsObj = getTagAttr(spanContent, { span: '<span[^>]*>', a: '<a[^>]*>' })
  const spanTag = Array.isArray(tagsObj.span) && tagsObj.span.length === 1 && tagsObj.span[0]
  const aTag = Array.isArray(tagsObj.a) && tagsObj.a.length === 1 && tagsObj.a[0]

  const pass2 = spanTag && aTag &&
    (spanTag.style.toLowerCase().match(/display( )*:( )*none[; ]+/gm) || spanTag.style.toLowerCase().match(/font-size( )*:( )*0px[; ]+/gm)) &&
    (aTag.style.toLowerCase().match(/display( )*:( )*none[; ]+/gm) || aTag.style.toLowerCase().match(/font-size( )*:( )*0px[; ]+/gm))

  const memberVariables = ['%%Member_Busname%%', '%%Member_Addr%%', '%%Member_City%%', '%%Member_State%%', '%%Member_PostalCode%%', '%%Member_Country%%']
  const pass3 = memberVariables.every(variable => spanContent.includes(variable)) && spanContent.includes(',')

  const message = []
  if (pass1) {
    message.push(`<div><b>${1}</b><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">${encodedStr(pass1)}</span></div>`)
  } else {
    message.push(`<div><b>${1}</b><span class="ml-1 badge badge-danger">Missing</span><span class="ml-1 text-danger">${encodedStr(PCC_arr[0])}</span></div>`)
  }
  if (pass2 && pass3) {
    message.push(`<div><b>${1}</b><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">${encodedStr(spanContent)}</span></div>`)
  } else {
    message.push(`<div><b>${1}</b><span class="ml-1 badge badge-danger">Missing</span><span class="ml-1 text-danger">${encodedStr(PCU)}</span></div>`)
  }
  return { passed: pass1 && pass2 && pass3, message: message.join('\n') }
}

const getTags = (sourceEmail) => {
  const allTags = (allTrim(sourceEmail).replace(/<!-->|<!--|-->|]>|<!/gm, '').match(/<[^<>]+>/gm) || [])
    .map(tag => {
      const tagName = tag.replace(/!|<|>|\//gm, '').split(' ')[0]
      const isStart = !tag.includes('</')
      const isEnd = tag.includes('</') || tag.includes('/>') || !!tagName.match(/area|base|br|col|command|embed|hr|img|input|keygen|source|link|meta|param|track|wbr|doctype/)
      return { tag, tagName, isEnd, isStart }
    })
  return allTags
}

// Line 42. • Ensure tagging issue fix is applied to this email and all emails moving forward
const checkErrorHtmlSyntax = (sourceEmail) => {
  let allTags = getTags(sourceEmail)
  const countAllObj = allTags.reduce((res, tag) => {
    if (!tag.tagName.includes('--')) {
      if (!res[tag.tagName]) {
        res[tag.tagName] = { countStart: 0, countEnd: 0 }
      }
      if (tag.isStart) {
        res[tag.tagName].countStart++
      }
      if (tag.isEnd) {
        res[tag.tagName].countEnd++
      }
    }
    return res
  }, {})

  const tagError = []
  for (const tag in countAllObj) {
    if (countAllObj[tag].countStart !== countAllObj[tag].countEnd) {
      tagError.push(`${tag} start: ${countAllObj[tag].countStart}, End: ${countAllObj[tag].countEnd}`)
    }
  }

  let ifOpen = countOccurences(sourceEmail, `<!--[if`)
  let endIF = countOccurences(sourceEmail, `endif]-->`)

  if (ifOpen !== endIF) {
    tagError.push(`If Else on Outlook start: ${ifOpen}, End: ${endIF}`)
  }
  const passed = !tagError.length
  const message = tagError.length ? `<ol>${tagError.map((e, index) => `<div><b>${index + 1}</b>: ${e}</div>`).join('')}</ol>` : 'HTML Syntax is ok'
  return { passed, message }
}

// Line 46. • Make sure tagging URLs do not have '25' added, this has been an issue in past emails where we've had to fix, so just keep an eye out for these please
const checkRedundancy25 = (sourceEmail) => {
  const passed = !(sourceEmail && sourceEmail.includes('%25'))
  const message = !passed ? 'Contain "%25" string' : 'Redundancy %25 is ok.'
  return { passed, message }
}

const checkIncludeTexts = (html, options = {}) => {
  let passed = true
  const messages = []
  const { includeTexts = [] } = options
  const valueDecodeHtmlEntities = decodeHtmlEntities(html)
  for (const text of includeTexts) {
    const replacedText = decodeHtmlEntities(text).replace(/[-[\]/{}()*+?.\\^$|]/gm, '\\$&')
    const newReg = new RegExp(replacedText.replace(/ |\n|\r/gm, '(<[^>]*>| |\n|\r)*'), 'gi')
    if (newReg.test(valueDecodeHtmlEntities)) {
      messages.push(`<div class="text-success">Text "${text}" is including in html</div>`)
    } else {
      messages.push(`<div class="text-danger">Text "${text}" is not including in html</div>`)
      passed = false
    }
  }
  return {
    passed,
    message: messages.join('')
  }
}

const regexMatchContent = (regex, html) => {
  const res = []
  let m
  while ((m = regex.exec(html)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    m.forEach((match, groupIndex) => {
      res.push(match)
    })
  }
  return res
}

// IMAGE

// EXPORT + SHOW JSON ON UI + COPY
const copyImageJsonFromInput = () => {
  const html = document.getElementById('input-html').value || '';
  copyImageJson(html);
};

const copyImageJson = (html) => {
  const imagesMap = new Map();

  const bodyTags = regexMatchContent(
    /<body[^>]*>(?:.|\n|\r)+?<\/body>/gm,
    html
  ) || [];
  const bodyContent = bodyTags[0] || html;

  // <img src="">
  const imgs = getTagAttr(bodyContent, { img: '<img[^>]*>' }).img || [];
  imgs.forEach(({ src, alt }) => {
    if (!src) return;
    if (!imagesMap.has(src)) {
      imagesMap.set(src, {
        img: src,
        alt: alt || '',
        type: 'img'
      });
    }
  });

  // background-image: url(...) trong CSS
  const bgRegex = /background(?:-image)?\s*:\s*url\((['"]?)(.*?)\1\)/gi;
  let match;
  while ((match = bgRegex.exec(html)) !== null) {
    const src = match[2];
    if (!src) continue;
    if (!imagesMap.has(src)) {
      imagesMap.set(src, {
        img: src,
        alt: '',
        type: 'background'
      });
    }
  }

  // background="..." attribute trực tiếp trên tag HTML
  const bgAttrRegex = /background\s*=\s*(['"])(.*?)\1/gi;
  while ((match = bgAttrRegex.exec(html)) !== null) {
    const src = match[2];
    if (!src) continue;
    if (!imagesMap.has(src)) {
      imagesMap.set(src, {
        img: src,
        alt: '',
        type: 'background'
      });
    }
  }

  const json = JSON.stringify(
    [...imagesMap.values()].map((item, index) => ({
      index: index + 1,
      ...item
    })),
    null,
    2
  );

  document.getElementById('imageJsonOutput').value = json;
  copyTextToClipboard(json);
};

const checkAbsoluteImageLink = (html) => {
  const backgroundMatched = getRegex(html, backgroundImageRegex).map(src => ({ src, '<background': true }))
  const imageObj = getTagAttr(html, { img: '<img[^>]*>', 'v:image': '<v:image[^>]*>' })
  const error = [...imageObj.img, ...imageObj['v:image'], ...backgroundMatched].filter(({ src }) => !isAbsoluteUrl(src)).map(({ src }) => src)
  const passed = !error.length
  const message = error.length ? `<ol>${error.map((e, index) => `<div><b>${index + 1}</b>: ${e}</div>`).join('')}</ol>` : 'Absolute Image is ok'
  return { passed, message }
}

function getImageProperties(id, src, imageObj) {
  const img = new Image();
  img.addEventListener("load", function () {
    imageObj.rawWidth = this.width;
    imageObj.rawHeight = this.height;
    document.getElementById(id).innerHTML = `Raw: ${this.width}x${this.height}`;
    img.remove();
  });
  img.addEventListener("error", function () {
    document.getElementById(id).innerHTML = '<b class="text-danger">404</b>';
    img.remove();
  });
  img.src = src;
}

function getImageElementSize(html, imageSummary) {
  const check2x = (raw, rendered) =>
    raw && rendered ? raw / rendered >= 2 : null;

  const screens = [
    { name: 'Desktop', keyId: 'tagSizeDesktopId', width: '100%' },
    { name: 'Mobile', keyId: 'tagSizeMobileId', width: '414px' }
  ];

  screens.forEach(screen => {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      width: screen.width,
      height: '100%',
      position: 'absolute',
      left: '-9999px',
      border: 'none'
    });

    document.body.appendChild(iframe);

    iframe.onload = () => {
      const doc = iframe.contentWindow.document;
      doc.body.style.margin = '0';

      Object.values(imageSummary).forEach(image => {
        const el = document.getElementById(image[screen.keyId]);
        if (!el) return;

        const images = [...doc.querySelectorAll(`img[src="${image.path}"]`)];
        if (!images.length) {
          el.innerHTML = '';
          return;
        }

        const sizes = images.map(img => {
          const is2x = check2x(image.rawWidth, img.width);
          if (screen.name === 'Desktop') image.is2xDesktop = is2x;
          if (screen.name === 'Mobile') image.is2xMobile = is2x;

          return `
            ${img.width}x${img.height}
            ${
              is2x === null ? '' :
              is2x
                ? '<span class="badge badge-success ml-1">2x</span>'
                : '<span class="badge badge-danger ml-1">NOT 2x</span>'
            }
          `;
        }).join(', ');

        el.innerHTML = `${screen.name}: ${sizes}`;
      });

      iframe.remove();
    };

    iframe.srcdoc = html;
  });
}

const string2Hash = str => {
  var hash = 0, i, chr;
  if (str && str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

const checkIncludeImages = (html, options = {}) => {
  const copyBtnHtml = e => `<button class="btn btn-info btn-sm" onclick="copyTextToClipboard('${e}')">Copy</button>`;
  let passed = true;
  const messages = [];

  // Helper - reset or create summary info
  const initSummary = (path) => ({
    rawSizeId: `raw-size${string2Hash(path)}`,
    tagSizeDesktopId: `tag-size-desktop${string2Hash(path)}`,
    tagSizeMobileId: `tag-size-mobile${string2Hash(path)}`,
    path,
    isGif: /\.gif/.test(path),
    rawWidth: null,
    rawHeight: null,
    is2xDesktop: null,
    is2xMobile: null,
    "alt(img)": [],
    "alias(v:image)": [],
    background: [],
    Count: 0,
    href: []
  });
  

  const imageSummary = {};

  // -- HEAD Tag background images --
  const headTags = regexMatchContent(/<head[^>]*>(?:.|\n|\r)+?<\/head>/gm, html) || [];
  const headContent = headTags[0] || '';
  (getRegex(headContent, backgroundImageRegex) || []).forEach(path => {
    if (!imageSummary[path]) imageSummary[path] = initSummary(path);
    imageSummary[path].background.push(`<div><b>(${imageSummary[path].background.length + 1}).</b><span class="ml-1 badge badge-warning">In Head Tag</span></div>`);
    imageSummary[path].Count++;
  });

  // -- BODY Tag background images --
  const bodyTags = regexMatchContent(/<body[^>]*>(?:.|\n|\r)+?<\/body>/gm, html) || [];
  const bodyContent = bodyTags[0] || '';
  (getRegex(bodyContent, backgroundImageRegex) || []).forEach(path => {
    if (!imageSummary[path]) imageSummary[path] = initSummary(path);
    imageSummary[path].background.push(`<div><b>(${imageSummary[path].background.length + 1}).</b><span class="ml-1 badge badge-success">In Body Tag</span></div>`);
    imageSummary[path].Count++;
  });

  // -- <img> tags --
  (getTagAttr(bodyContent, { img: '<img[^>]*>' }).img || []).forEach(img => {
    const { src, alt, alias, raw } = img;
    if (!imageSummary[src]) imageSummary[src] = initSummary(src);
    // inject href if <a> is parent
    (getTagAttr(bodyContent, { a: `<a[^>]*>[^<]*(${raw})[^>]*<\/a>` }).a || []).forEach(({ href }) => {
      if (href) imageSummary[src].href.push(href);
    });
    const altLen = imageSummary[src]["alt(img)"].length + 1;
    imageSummary[src]["alt(img)"].push(
      alt ?
        `<div><b>(${altLen}).</b><span class="ml-1 badge badge-success">${alt}</span></div>` :
        `<div><b>(${altLen}).</b><span class="ml-1 badge badge-danger">missing alt</span></div>`
    );
    imageSummary[src].Count++;
  });

  // -- <v:image> tags --
  (getTagAttr(bodyContent, { vimage: '<v:image[^>]*>' }).vimage || []).forEach(vimage => {
    const { src, href, alias } = vimage;
    if (!imageSummary[src]) imageSummary[src] = initSummary(src);
    const aliasLen = imageSummary[src]["alias(v:image)"].length + 1;
    if (alias) {
      imageSummary[src]["alias(v:image)"].push(`<div><b>(${aliasLen}).</b><span class="ml-1 badge badge-success">${alias}</span></div>`);
    } else if (href) {
      imageSummary[src]["alias(v:image)"].push(`<div><b>(${aliasLen}).</b><span class="ml-1 badge badge-danger">missing alias</span></div>`);
    } else {
      imageSummary[src]["alias(v:image)"].push(`<div><b>(${aliasLen}).</b><span class="ml-1 badge badge-info">SKIP</span><i>(No Href)</i></div>`);
    }
    imageSummary[src].Count++;
  });

  // -- Render table header --
  messages.push('<h4 class="text-center"><b>ALL IMAGE</b></h4>');
  messages.push(`
    <div class="d-flex pb-1 border-bottom">
      <div class="col-1 font-weight-bold">STT</div>
      <div class="col-1 font-weight-bold">Preview</div>
      <div class="col-1 font-weight-bold">is Gif?</div>
      <div class="col-2 font-weight-bold d-flex justify-content-between">Url</div>
      <div class="col-2 font-weight-bold">Href</div>
      <div class="col-2 font-weight-bold">Alt (img)</div>
      <div class="col-1 font-weight-bold">Alias (v:image)</div>
      <div class="col-1 font-weight-bold">Background (style)</div>
      <div class="col-1 font-weight-bold text-center">Count</div>
    </div>`);

  // -- Prepare size and preview for each image
  let idx = 1;
  getImageElementSize(html, imageSummary);
  Object.values(imageSummary).forEach((img, i) => {
    getImageProperties(img.rawSizeId, img.path, img);
    // Preview & size loaders
    const previewHtml = `
      <a href="${img.path}" target="_blank"><img width="100%" class="border border-primary" src="${img.path}"></a>
      <div style="font-size:small;" id="${img.rawSizeId}">LOADING</div>
      <div style="font-size:small;" id="${img.tagSizeDesktopId}">LOADING</div>
      <div style="font-size:small;" id="${img.tagSizeMobileId}">LOADING</div>
    `;
    // Helper
    const getHrefHtml = hrefs => (hrefs || []).map(href =>
      `<div class="text-ellipsis" data-toggle="tooltip" data-placement="top" title="${href}">
        <a href="${href}" target="_blank">${href}</a>
      </div>
      <div>${copyBtnHtml(href)}</div>`
    ).join('');

    const arr2Html = arr => arr.join('');

    messages.push(`
      <div class="d-flex pb-1 border-bottom">
        <div class="col-1 font-weight-bold">${idx++}</div>
        <div class="col-1 font-weight-bold">${previewHtml}</div>
        <div class="col-1 font-weight-bold">${img.isGif ?
          `<span class="ml-1 badge badge-warning">YES</span>` :
          `<span class="ml-1 badge badge-success">NO</span>`}
        </div>
        <div class="col-2 d-flex justify-content-between">
          <div class="text-ellipsis" title="${img.path}">
            <a href="${img.path}" target="_blank">${img.path}</a>
          </div>
          <div>${copyBtnHtml(img.path)}</div>
        </div>
        <div class="col-2 d-flex justify-content-between">${getHrefHtml(img.href)}</div>
        <div class="col-2 font-weight-bold">${arr2Html(img['alt(img)'])}</div>
        <div class="col-1 font-weight-bold">${arr2Html(img['alias(v:image)'])}</div>
        <div class="col-1 font-weight-bold">${arr2Html(img.background)}</div>
        <div class="col-1 text-center">${img.Count}</div>
      </div>`);
  });

  return { passed, message: messages.join('') };
};

// END IMAGE

const checkIncludeLinks = (html, options = {}) => {
  let passed = true
  const messages = []
  const { includeLinks = [], isGetLinksStats } = options
  const allLinks = getAllLinksFromHtml(html)
  const allHrefs = allLinks.map(e => e.href)
  const matchedHrefs = []
  for (const link of includeLinks) {
    if (allHrefs.includes(link)) {
      matchedHrefs.push(link)
      messages.push(`<div class="text-success">Link "${link}" is including in html</div>`)
    } else {
      messages.push(`<div class="text-danger">Link "${link}" is not including in html</div>`)
      passed = false
    }
  }
  const result = {
    passed,
    message: messages.join('')
  }
  const mailType = document.querySelector('input[name="mailType"]:checked').value || 'default'

  if (isGetLinksStats) {
    const linksObj = allLinks.reduce((resultObj, link) => {
      const { href, alias } = link
      if (isWhiteListLink(href)) {
        return resultObj
      }
      if (!resultObj[href]) {
        resultObj[href] = {}
      }
      resultObj[href].count = (resultObj[href].count || 0) + 1
      resultObj[href].matched = href && matchedHrefs.includes(href)
      resultObj[href].aliases = (resultObj[href].aliases || [])
      resultObj[href].aliases.push(alias)
      return resultObj
    }, {})
    messages.push('<h4 id="linkStatistics" class="text-center"><b>Link Statistics</b></h4>')
    messages.push(`
    <div class="d-flex pb-1 border-bottom">
      <div class="col-${mailType === 'honda' ? '7' : '9'} font-weight-bold">Href</div>
      ${mailType === 'honda' ? '<div class="col-2 font-weight-bold">Alias(es)</div>' : ''}
      <div class="col-2 text-center font-weight-bold">Matched</div>
      <div class="col-1 text-center font-weight-bold">Count</div>
    </div>`)
    for (const href in linksObj) {
      const { matched, count, aliases } = linksObj[href]
      const aliasTextHtml = aliases.map((e, i) => `<div class="text-ellipsis" data-toggle="tooltip" data-placement="top" title="${e || 'Missing'}"><b>(${i + 1}).</b> ${e ? aliasValidFormat(e) : '<b class="text-danger">Missing</b>'}</div>`).join('')
      messages.push(`
      <div class="d-flex pb-1 border-bottom">
        <div class="col-${mailType === 'honda' ? '7' : '9'} d-flex justify-content-between">
          <div class="text-ellipsis" data-toggle="tooltip" data-placement="top" title="${href}">
            <a href="${href}" target="_blank">${href}</a>
          </div>
          <div>
            <button class="btn btn-info btn-sm" onclick="copyTextToClipboard('${href}')">
              Copy
            </button>
          </div>
        </div>
        ${mailType === 'honda' ? `<div class="col-2">${aliasTextHtml}</div>` : ''}
        <div class="col-2 text-center">${matched ? '<b class="text-success">Matched</b>' : '<b class="text-danger">Failed</b>'}</div>
        <div class="col-1 text-center">${count}</div>
      </div>`)
    }
    result.message = messages.join('')
  }
  return result
}

const checkAllAliasMatchingWithFormat = (html, options = {}) => {
  const { preAliasText } = options
  let passed = true
  let message

  if (preAliasText) {
    message = `All Links alias is matching with <b>${preAliasText}</b>`
    const messages = []
    const allLinks = getAllLinksFromHtml(html)
    const regex = new RegExp(`^(${preAliasText})`)
    for (const linkObj of allLinks) {
      const { href, alias } = linkObj
      if (!alias?.match(regex) && !isWhiteListLink(href) &&
        !(href === '%%=RedirectTo(@pageURLALL)=%%' && alias === '%%OFFERCODE%%_OptOut_ALL') &&
        !(href === '%%=RedirectTo(@pageURL)=%%' && alias === '%%OFFERCODE%%_OptOut_ThisType')) {
        passed = false
        messages.push(`<div><b>${messages.length + 1}</b>: ${href} - alias "<b>${alias}</b>"</div>`)
      }
    }
    if (!passed) {
      message = ['<div>Links is not matching with pre-alias</div>', ...messages].join('')
    }
  } else {
    passed = false
    message = `Please input Campaign code (Pre-alias Text) for check this case. Example: <b>A03730-T03713_...</b> <button class="btn btn-sm btn-primary" onclick="focusEl('#input-pre-alias-text')">Click here to focus</button>`
  }
  return {
    passed,
    message
  }
}

const checkAllCidQueryMatching = (html, options = {}) => {
  const { inputCid } = options
  let passed = true
  let message

  const CFCCodeCID = checkFormatCampaignCodeCID(html)
  isWhiteListCID = cid => {
    return cid && CFCCodeCID && CFCCodeCID.CID && CFCCodeCID.CID === cid
  }

  if (inputCid) {
    message = `All Links alias is matching with <b>${inputCid}</b>`
    const errorMessages = []
    const allLinks = getAllLinksFromHtml(html)
    for (const linkObj of allLinks) {
      const { href } = linkObj
      const query = getQueryFromFullPath(href)

      if (query.cid !== inputCid && isInternalLink(href) && !isWhiteListLink(href) && !whitelistOther.includes(href) && !isWhiteListCID(query.cid)) {
        passed = false
        errorMessages.push(`<div><b>${errorMessages.length + 1}</b>: ${href} - cid="<b>${query.cid}</b>"</div>`)
      }
    }
    if (!passed) {
      message = ['<div>Links is not matching with CID:</div>', ...errorMessages].join('')
    }
  } else {
    passed = false
    message = `Please input CID for check this case. <button class="btn btn-sm btn-primary" onclick="focusEl('#input-cid')">Click here to focus</button>`
  }
  return {
    passed,
    message
  }
}

const getAllComments = html => html.match(/\<\!\-\-(?:.|\n|\r)*?-->/g) || []
const getAllCommentStyles = html => html.match(/\/\*(?:.|\n|\r)*?\*\//g) || []

const isPatternInComment = (html, pattern, isCheckInStyle = false) => {
  const allComments = [...getAllComments(html), ...(isCheckInStyle ? getAllCommentStyles(html) : [])]
  for (const str of allComments) {
    if (pattern.test(str)) {
      return true
    }
  }
  return false
}

const ensureHtmlContainDarkmodeMetaTagStyles = html => {
  let passed = true
  const errorMessages = []
  const headContent = getContentsByTag(html, 'head')[0] || ''
  if (!headContent) {
    errorMessages.push('<div>Missing head tag</div>')
  }
  // <meta name="color-scheme" content="light dark" />
  const patternMetaColorScheme = /(<meta name="color-scheme" content="light dark" ?\/>)|(<meta content="light dark" name="color-scheme" ?\/>)/g
  const matchedPatternMetaColorScheme = (headContent.match(patternMetaColorScheme))
  if (!matchedPatternMetaColorScheme) {
    passed = false
    errorMessages.push('<div>Darkmode meta tag "<b>&lt;meta name="color-scheme" content="light dark" /></b>" is missing in head tag</div>')
  }
  if (matchedPatternMetaColorScheme?.length > 1) {
    passed = false
    errorMessages.push(`<div>Darkmode meta tag "<b>&lt;meta name="color-scheme" content="light dark" /></b>" is dupplicating <b>${matchedPatternMetaColorScheme.length}</b> times</div>`)
  }
  if (isPatternInComment(headContent, patternMetaColorScheme)) {
    passed = false
    errorMessages.push('<div>Darkmode meta tag "<b>&lt;meta name="color-scheme" content="light dark" /></b>" is in comment</div>')
  }

  // <meta name="supported-color-schemes" content="light dark" />
  const patternSupportedColorSchemes = /(<meta name="supported-color-schemes" content="light dark" ?\/>)|(<meta content="light dark" name="supported-color-schemes" ?\/>)/g
  const matchedPatternSupportedColorSchemes = (headContent.match(patternSupportedColorSchemes))
  if (!matchedPatternSupportedColorSchemes) {
    passed = false
    errorMessages.push('<div>Darkmode meta tag "<b>&lt;meta name="supported-color-schemes" content="light dark" /></b> is missing in head tag</div>')
  }
  if (matchedPatternSupportedColorSchemes?.length > 1) {
    passed = false
    errorMessages.push(`<div>Darkmode meta tag "<b>&lt;meta name="supported-color-schemes" content="light dark" /></b> is is dupplicating <b>${matchedPatternSupportedColorSchemes.length}</b> times</div>`)
  }
  if (isPatternInComment(headContent, patternSupportedColorSchemes)) {
    passed = false
    errorMessages.push('<div>Darkmode meta tag "<b>&lt;meta name="supported-color-schemes" content="light dark" /></b> is in comment</div>')
  }

  // :root { Color-scheme: light dark; supported-color-schemes: light dark; }
  const patternStyleDarkMode = /(:root { Color-scheme: light dark; supported-color-schemes: light dark; })|(:root { supported-color-schemes: light dark; Color-scheme: light dark; })/g
  const matchedPatternStyleDarkMode = (headContent.match(patternStyleDarkMode))
  if (!matchedPatternStyleDarkMode) {
    passed = false
    errorMessages.push(`<div>Darkmode <b>styles</b> <pre>
    :root {
      Color-scheme: light dark;
      supported-color-schemes: light dark;
    }</pre> is missing in head tag</div>`)
  }
  if (matchedPatternStyleDarkMode?.length > 1) {
    passed = false
    errorMessages.push(`<div>Darkmode <b>styles</b> <pre>
    :root {
      Color-scheme: light dark;
      supported-color-schemes: light dark;
    }</pre> is is dupplicating <b>${matchedPatternStyleDarkMode.length}</b> times</div>`)
  }
  if (isPatternInComment(headContent, patternStyleDarkMode, true)) {
    passed = false
    errorMessages.push(`<div>Darkmode <b>styles</b> <pre>
    :root {
      Color-scheme: light dark;
      supported-color-schemes: light dark;
    }</pre> is in comment</div>`)
  }
  return {
    passed,
    message: passed ? `Html is containing darkmode:
      <div>Meta tags: "<b>&lt;meta name="color-scheme" content="light dark" /></b>", "<b>&lt;meta name="supported-color-schemes" content="light dark" /></b></div>
      <div>Styles: <pre>
      :root {
        Color-scheme: light dark;
        supported-color-schemes: light dark;
      }</pre></div>` : errorMessages.join('')
  }
}
const noCarbon8Links = html => {
  const blacklist = [
    {
      textTitle: 'carbon8test',
      patternText: /carbon8test/gm,
      linkTitle: 'email.carbon8.info',
      parentLink: /^https:\/\/email.carbon8.info\//,
      imageTitle: 'email.carbon8.info',
      parentImage: /^https:\/\/email.carbon8.info\//
    },
    {
      textTitle: 'emailassets',
      patternText: /emailassets/gm,
      linkTitle: 'emailassets.gravityglobal.com',
      parentLink: /^https:\/\/emailassets.gravityglobal.com\//,
      imageTitle: 'emailassets.gravityglobal.com',
      parentImage: /^https:\/\/emailassets.gravityglobal.com\//
    },
  ]

  const allLinks = getAllLinksFromHtml(html)
  const foundGifs = []
  let reportTest = '', passed = true
  blacklist.forEach(({ textTitle, patternText, linkTitle, parentLink, imageTitle, parentImage }) => {
    const foundText = []
    const matchedText = html.match(patternText) || []
    for (let i in matchedText) {
      foundText.push(getTextCurrentTagOfPattern(html, textTitle, Number(i + 1), { boldPattern: false }))
    }

    const foundLinks = []
    const matchedLinks = allLinks.filter(link => parentLink.test(link.href))
    for (let i in matchedLinks) {
      foundLinks.push(matchedLinks[i].href)
    }

    const foundImages = []
    const matchedImages = getRegex(html, backgroundImageRegex).map(src => ({ src, '<background': true }))
    const imageObj = getTagAttr(html, { img: '<img[^>]*>', 'v:image': '<v:image[^>]*>' })
    const allImageLinks = [...imageObj.img, ...imageObj['v:image'], ...matchedImages]
    for (let i in allImageLinks) {
      if (parentImage.test(allImageLinks[i].src)) {
        foundImages.push(allImageLinks[i].src)
      }
    }

    // get all gif
    [
      ...allLinks.filter(link => /\.gif/.test(link.href)).map(link => link.href),
      ...allImageLinks.filter(link => /\.gif/.test(link.src)).map(link => link.src),
    ].forEach(gif => {
      if (!foundGifs.includes(gif)) {
        foundGifs.push(gif)
      }
    })

    if (foundText.length) {
      reportTest += `<h4 class="text-danger">Found <b>${foundText.length}</b> text "${textTitle}" in html</h4>`
      foundText.forEach((text, index) => {
        reportTest += `<div class="text-danger"><b>${index + 1}.</b> ${encodedStr(text)}</div>`
      })
    } else {
      reportTest += `<h4 class="text-success">Not found text "${textTitle}" in html</h4>`
    }
    if (foundLinks.length) {
      reportTest += `<h4 class="text-danger">Found <b>${foundLinks.length}</b> link "${linkTitle}" in html</h4>`
      foundLinks.forEach((text, index) => {
        reportTest += `<div class="text-danger"><b>${index + 1}.</b> ${encodedStr(text)}</div>`
      })
    } else {
      reportTest += `<h4 class="text-success">Not found link "${linkTitle}" in html</h4>`
    }
    if (foundImages.length) {
      reportTest += `<h4 class="text-danger">Found <b>${foundImages.length}</b> image "${imageTitle}" in html</h4>`
      foundImages.forEach((text, index) => {
        reportTest += `<div class="text-danger"><b>${index + 1}.</b> ${encodedStr(text)}</div>`
      })
    } else {
      reportTest += `<h4 class="text-success">Not found image "${imageTitle}" in html</h4>`
    }
    passed = !foundText.length && !foundLinks.length && !foundImages.length
  })

  if (foundGifs.length) {
    reportTest += `<h4 class="text-warning">Found <b>${foundGifs.length}</b> gif in html</h4>`
    foundGifs.forEach((text, index) => {
      reportTest += `<div class="text-warning"><b>${index + 1}.</b> ${encodedStr(text)}</div>`
    })
  } else {
    reportTest += `<h4 class="text-success">Not found gif in html</h4>`
  }
  return {
    passed,
    message: reportTest,
  }
}

const checkMultilineSinglelineTag = sourceEmail => {
  let allTags = getTags(sourceEmail)
  const countAllObj = allTags.reduce((res, tag) => {
    if (tag.tagName && !tag.tagName.includes('--') && /multiline|singleline/.test(tag.tagName.toLowerCase())) {
      if (!res[tag.tagName]) {
        res[tag.tagName] = { countStart: 0, countEnd: 0 }
      }
      if (tag.isStart) {
        res[tag.tagName].countStart++
      }
      if (tag.isEnd) {
        res[tag.tagName].countEnd++
      }
    }
    return res
  }, {})

  const tagError = []
  for (const tag in countAllObj) {
    tagError.push(`${tag} open: ${countAllObj[tag].countStart}, close: ${countAllObj[tag].countEnd} <span style="color:red">(should not be used)</span>`)
  }

  const passed = !tagError.length
  const message = tagError.length ? `<ol>${tagError.map((e, index) => `<div><b>${index + 1}</b>: ${e}</div>`).join('')}</ol>` : encodedStr('Not use <multiline> or <singleline>')
  return { passed, message }
}

const checkDublicateAttr = sourceEmail => {
  const error = []
  const all = (allTrim(sourceEmail).replace(/<!-->|<!--|-->|]>|<!/gm, '').match(/<[^<>]+>/gm) || [])
  all.forEach(tag => {
    const attrObj = getAttrObj(tag)
    const isDublicateAttr = Array.isArray(attrObj.dublicate) && !!(attrObj.dublicate.length)
    if (isDublicateAttr) {
      error.push(`<b style="color:red">${encodedStr(tag)}</b>dublicate attr: <b style="color:orange">${attrObj.dublicate.join(', ')}</b>`)
    }
  })
  const passed = !error.length
  const message = error.length ? `<ol>${error.map((e, index) => `<div><b>${index + 1}</b>: ${e}</div>`).join('')}</ol>` : 'Dublicate attr not found'
  return { passed, message }
}

const CheckCodeMarketo = sourceEmail => {
  const copyBtnHtml = e => `<button class="btn btn-info btn-sm" onclick="copyTextToClipboard('${e}')">Copy</button>`
  const getBadgeHtml = (text, classText = 'badge-danger') => `<span class="badge badge-pill ${classText}">${text}</span>`
  const classessMKT = ["mktNoTok", "mktoContainer", "mktoModule", "mktEditable", "mktoText", "mktoImg", "mktoSnippet", "mktoVideo", "mktoString", "mktoList", "mktoNumber", "mktoColor", "mktoBoolean", "mktoHTML"]
  const attrsMTK = ["mktolockimgsize", 'mktoName', 'mktoImgLink', 'mktoDefaultSnippetId']

  const warning = []
  const error = []
  const all = (allTrim(sourceEmail).replace(/<!-->|<!--|-->|]>|<!/gm, '').match(/<[^<>]+>/gm) || [])
  if (sourceEmail.includes('${')) {
    error.push(`${copyBtnHtml('${')}${getBadgeHtml('${', 'badge-danger')} <b class="text-danger">$\{</b>`)
  }
  all.forEach(tag => {
    const attrObj = getAttrObj(tag)
    for (attr in attrObj) {
      // check mtk attr
      if (attrsMTK.includes(attr)) {
        error.push(`${copyBtnHtml(attr)}${getBadgeHtml('attr-error', 'badge-danger')} <b class="text-danger">${attr}</b> from: ${encodedStr(tag)}`)
      } else if (attr && attr.toLowerCase().includes('mkt')) {
        warning.push(`${copyBtnHtml(attr)}${getBadgeHtml('attr-warning', 'badge-warning')} <b class="text-warning">${attr}</b> from: ${encodedStr(tag)}`)
      }

      // case removed (mkt, label="content", label="image", var $ in document)
      if (attr === 'label' && ['content', 'image'].includes(attrObj[attr].trim())) {
        error.push(`${copyBtnHtml(attr)}${getBadgeHtml('attr-error', 'badge-danger')} <b class="text-danger">${attr}</b> from: ${encodedStr(tag)}`)
      }

      // check mtk class
      if (attr === 'class' && attrObj[attr].length) {
        const classess = attrObj[attr].split(' ')
        classess.forEach(cla => {
          if (classessMKT.includes(cla)) {
            error.push(`${copyBtnHtml(cla)}${getBadgeHtml('class-error', 'badge-danger')} <b class="text-danger">${cla}</b> from: ${encodedStr(tag)}`)
          } else if (cla && cla.toLowerCase().includes('mkt')) {
            warning.push(`${copyBtnHtml(cla)}${getBadgeHtml('class-warning', 'badge-warning')} <b class="text-warning">${cla}</b> from: ${encodedStr(tag)}`)
          }
        })
      }
    }
  })
  const sumHtml = getBadgeHtml(`ERROR (${error.length}), `, 'badge-danger') + getBadgeHtml(`WARNING (${warning.length})`, 'badge-warning')
  const passed = !error.length && !warning.length
  const message = error.length || warning.length ?
    `${sumHtml}<ol>${[...error, ...warning].map((e, index) => `<div><b>${index + 1}</b>: ${e}</div>`).join('')}</ol>` :
    [
      ...classessMKT.map(a => 'Class: ' + a),
      ...attrsMTK.map(a => 'Attribute: ' + a),
      "Attribute: label='content'",
      "Attribute: label='image'",
    ].map((variable, index) => `<div><b>${index + 1}</b><span class="ml-1 badge badge-success">Removed</span><span class="ml-1 text-success">${variable}</span></div>`).join('\n')
  return { passed, message }
}

const allLinkMustNotContainSpaceAndSpecialSymbols = html => {
  const allLinks = getAllLinksIncludeBackground(html)
  let passed = true
  let message = 'All links is not contain space, "&&", no more than 2 "?" character.'
  let allErrorMessages = []
  for (const linkString of allLinks) {
    let linkErrorMessages = []
    let replacedLink = linkString
    if (linkString.includes(' ')) {
      passed = false
      linkErrorMessages.push('Contain <b>space</b>')
      replacedLink = replacedLink.replaceAll(' ', '<b>"_"</b>')
    }
    if (linkString.includes('&&')) {
      passed = false
      linkErrorMessages.push('Contain <b>"&&"</b> string')
      replacedLink = replacedLink.replaceAll('&&', '<b>&&</b>')
    }
    if (linkString.match(/\?/g)?.length > 1) {
      passed = false
      linkErrorMessages.push('Contain more than 2 <b>"?"</b> character')
      replacedLink = replacedLink.replaceAll('?', '<b>?</b>')
    }
    if (linkErrorMessages.length) {
      allErrorMessages.push(`
      <div class="mb-1">
        <b>${allErrorMessages.length + 1}.</b> ${replacedLink}: ${linkErrorMessages.join(', ')}.
        <button class="btn btn-info btn-sm" onclick="copyTextToClipboard('${linkString}')">
          Copy
        </button>
      </div>`)
    }
  }
  if (allErrorMessages.length) {
    message = `Have some links contain space, , "&&", no more than 2 "?" character: ${allErrorMessages.join('')}`
  }

  return {
    passed,
    message
  }
}

const ensureTitleIsMatching = (html, options = {}) => {
  const headContent = getContentsByTag(html, 'head')[0]
  if (!headContent) {
    return { passed: false, message: 'Missing head tag' }
  }
  const titleContent = getContentsByTag(headContent, 'title')[0]
  if (!titleContent) {
    return { passed: false, message: 'Missing title tag' }
  }
  const { titleText } = options
  if (!titleText) {
    return {
      passed: false,
      message: `Please input Title Text for check this case. <button class="btn btn-sm btn-primary" onclick="focusEl('#input-title-text')">Click here to focus</button>`
    }
  }
  const regex = new RegExp(`<title> ?${decodeHtmlEntities(escapeRegExp(titleText))} ?</title>`)
  if (!regex.test(decodeHtmlEntities(titleContent))) {
    return {
      passed: false,
      message: 'Title text is not matching with text copy'
    }
  }
  return {
    passed: true,
    message: 'Title text is matching with text copy'
  }
}

const checkOfficeDocumentSettingsOnOutlook = html => {
  var headContent = getContentsByTag(removeCommentSafe(html), 'head')[0]
  if (!headContent) {
    return { passed: false, message: 'Missing head tag' }
  }

  const officeDocumentString = `<xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml>`
  const countOfficeDocumentString = countOccurences(headContent, officeDocumentString)

  const hint = `<div class="bg-info text-white"><span class="font-italic">Hint: Đếm code Outlook nằm ngoài comment (ko tính if, endif), nếu === 1 thì pass ngược lại failed</span></div>`
  if (countOfficeDocumentString === 1) {
    return {
      passed: true,
      message: `
      <span class="ml-1 badge badge-success">Html Contain Office Document Settings On Outlook</span>
      <xmp>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </xmp>${hint}`
    }
  } else if (countOfficeDocumentString === 0) {
    return {
      passed: false,
      message: `<span class="ml-1 badge badge-danger">Missing Office Document Settings On Outlook String</span>
      <xmp>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </xmp>${hint}`
    }
  } else {
    return {
      passed: false,
      message: `<span class="ml-1 badge badge-danger">Appears ${countOfficeDocumentString} times</span>
      <xmp>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </xmp>${hint}`
    }
  }
}

const checkLinkShouldOpenNewTab = html => {
  let passed = true;
  let message = 'All Link contain attribute <b>target="_blank"</b>';
  let warning;
  const ignoredLinks = [];
  const invalidHrefs = [];

  // Extract body content
  const bodyContent = getContentsByTag(html, 'body')[0];
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' };
  }

  const allLinks = getAllLinksFromHtml(bodyContent);
  for (const linkObj of allLinks) {
    const { href, target } = linkObj;
    if (isWhiteListLink(href) || href.includes('honda.com')) {
      ignoredLinks.push(href);
    } else if (target !== '_blank') {
      invalidHrefs.push(href);
    }
  }
  if (ignoredLinks.length) {
    warning = `<div>Whitelist links:</div>${ignoredLinks.map((e, index) => `<div><b>${index + 1}</b> ${e}</div>`).join('')}`;
  }
  if (invalidHrefs.length) {
    passed = false;
    message = `<div>Some link not contain attribute <b>target="_blank"</b>:</div>${invalidHrefs.map((e, index) => `<div><b>${index + 1}</b> ${e}</div>`).join('')}`;
  }
  return {
    passed,
    message,
    warning
  };
}

const checkContainReferencesCampaignCode = html => {
  const text = 'Reference: %%CAMPAIGNCODE%%-%%OFFERCODE%%'
  const bodyContent = getContentsByTag(html, 'body')[0]
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' }
  }
  if (isPatternInComment(bodyContent, new RegExp(text))) {
    return { passed: false, message: `<b>${text}</b> is in comment` }
  }
  const passed = bodyContent.includes(text)
  return {
    passed,
    message: `${(passed ? `Html contain ` : 'Missing text')} <b>${text}</b>`
  }
}

const checkFormatCampaignCodeCID = (html) => {
  var passed = true;
  var message = [];
  var messageHintLength = 0;
  /** BODY */
  const bodyContent = getContentsByTag(html, 'body')[0];
  if (!bodyContent) {
    return { passed: false, message: 'Missing body tag' };
  }
  const aTagMatched = getTagAttr(bodyContent, { 'aTag': '<a[^>]*(alias)+[^>]*>' }).aTag;
  var mailType = undefined;
  aTagMatched.some(({ href }) => {
    mailType = /^(https:\/\/powersports.honda.com)/.test(href) ? 'HPS' :
      /^(https:\/\/powerequipment.honda.com)/.test(href) ? 'HPE' :
        /^(https:\/\/marine.honda.com)/.test(href) ? 'MARINE' :
          /^(https:\/\/engines.honda.com)/.test(href) ? 'ENGINES' :
            /^(https:\/\/automobiles.honda.com)/.test(href) ? 'HONDA' :
              /^(https:\/\/www.acura.com)/.test(href) ? 'ACURA' : undefined;
    return mailType;
  });
  message.push(`<h1 class="ml-1 badge badge-success">Mail Type: ${mailType || 'UNKNOW'}</h1>`);
  message.push(`<pre class="bg-info text-white font-italic">Hint: Check Campaign Code
  Đối với cả (HPS & HPE & Marine) format phải là *0[X...]-#0[X...] (phần số sau *0 và #0 phải giống nhau, 2 chữ cái đầu phải khác nhau)(ví dụ: T0345-C0345 hoặc T01234-B01234 đều đúng)</pre>`);
  message.push(`<pre class="bg-info text-white font-italic">Hint: Check link preference CID:
  đối với mail HPS, HPE & Marine thì link preference phải có format T0[X...] với phần số khớp với phần số của campaign code.</pre>`);
  messageHintLength = message.length - 1;
  aTagMatched.forEach(aTag => {
    const { href, alias } = aTag;
    const acc = regexMatchContent(/^([A-Z0-9]+-[A-Z0-9]+)/gm, alias);
    aTag.campaignCode = (Array.isArray(acc) && acc.length && acc[0]) || '';
    const cc = aTag.campaignCode;
    aTag.message = [];
    aTag.passed = true;

    // --- START: FLEXIBLE FORMAT LOGIC ---
    const checkFormatFlexible = () => {
      // Format: [A-Z][0-9+]-[A-Z][0-9+], phần số trái = phần số phải, 2 chữ đầu khác nhau
      const match = cc.match(/^([A-Z])([0-9]+)-([A-Z])([0-9]+)$/);
      if (!match) return false;
      const [, leftChar, leftNums, rightChar, rightNums] = match;
      return leftChar !== rightChar && leftNums === rightNums;
    };
    // --- END: FLEXIBLE FORMAT LOGIC ---

    // RULE 1: CHECK LENGTH — chấp nhận bất kỳ độ dài hợp lệ theo format mới
    const isOptOut =
      (href.includes('%%=RedirectTo(@pageURL)=%%') && alias.includes('%%OFFERCODE%%_OptOut_ThisType')) ||
      (href.includes('%%=RedirectTo(@pageURLALL)=%%') && alias.includes('%%OFFERCODE%%_OptOut_ALL'));

    if (!isOptOut) {
      const match = cc.match(/^([A-Z])([0-9]+)-([A-Z])([0-9]+)$/);
      if (match) {
        aTag.message.push(`<span class="ml-1 mr-1 badge badge-success">CAMPAIGN_CODE_LENGTH:${cc.length}</span>`);
      } else {
        aTag.passed = false;
        aTag.message.push(`<span class="ml-1 mr-1 badge badge-danger">CAMPAIGN_CODE_LENGTH:${cc.length || 0} (invalid format)</span>`);
      }
    }

    // RULE 2: FORMAT
    if (!isOptOut) {
      if (checkFormatFlexible()) {
        aTag.message.push(`<span class="ml-1 badge badge-success">CAMPAIGN_CODE_FORMAT: *0[X...]-#0[X...] (PASSED)</span>`);
      } else {
        aTag.passed = false;
        aTag.message.push(`<span class="ml-1 badge badge-danger">CAMPAIGN_CODE_FORMAT: FAILED</span>`);
      }
    }

    /** SESSION CID */
    const url_href = new URL(isAbsoluteUrl(href) ? href : 'https://abc.com/');
    const CID = url_href.searchParams.get('cid') || '';
    aTag.isCID = !!CID;
    aTag.CID = CID;
    aTag.CIDLink = href;

    // Lấy phần số động từ campaign code (sau ký tự đầu tiên)
    const ccNumsMatch = cc.match(/^[A-Z]([0-9]+)-/);
    const ccNums = ccNumsMatch ? ccNumsMatch[1] : '';

    // CID hợp lệ: bắt đầu bằng T0, phần số sau T0 khớp với phần số của campaign code
    const isPreferences = /^T0[0-9]+$/.test(CID) && CID.slice(2) === ccNums;
    aTag.isPreferences = isPreferences;

    if (isPreferences) {
      const CID_HPE_MARINE = [
        CID[0] === 'T',
        CID[1] === '0',
        ...Array.from(ccNums, (num, i) => /[0-9]/.test(CID[2 + i]) && CID[2 + i] === num),
      ];
      const CID_FF = Array.from(Array(CID.length), () => 0);
      // RULE 1: CHECK LENGTH
      if (['HPS', 'HPE', 'MARINE'].includes(mailType)) {
        if (CID.length === CID_HPE_MARINE.length) {
          aTag.message.push(`<span class="ml-1 mr-1 badge badge-success">PREFERENCE_CID_LENGTH:${CID_HPE_MARINE.length}</span>`);
        } else {
          aTag.message.push(`<span class="ml-1 mr-1 badge badge-danger">PREFERENCE_CID_LENGTH:${CID.length}</span>`);
          aTag.passed = false;
        }
      } else {
        aTag.message.push(`<span class="ml-1 mr-1 badge badge-danger">PREFERENCE_CID_LENGTH:${(CID_FF && CID_FF.length) || 0} (unknow mailType)</span>`);
        aTag.passed = false;
      }
      for (let i = 0; i < CID.length; i++) {
        const ICHPE_MARINE = CID_HPE_MARINE[i] ? `<span class="font-weight-bold text-success">${CID[i] || '?'}</span>` : `<span class="font-weight-bold text-danger">${CID[i] || '?'}</span>`;
        const ICFF = CID_FF[i] ? `<span class="font-weight-bold text-success">${CID[i] || '?'}</span>` : `<span class="font-weight-bold text-danger">${CID[i] || '?'}</span>`;
        if (['HPS', 'HPE', 'MARINE'].includes(mailType)) {
          aTag.message.push(ICHPE_MARINE);
          aTag.passed = !CID_HPE_MARINE[i] ? CID_HPE_MARINE[i] : aTag.passed;
        } else {
          aTag.passed = false;
          aTag.message.push(ICFF);
        }
      }
    }
    /** Additional Conditions for Specific href and alias */
    if (href.includes('%%=RedirectTo(@pageURL)=%%') && alias.includes('%%OFFERCODE%%_OptOut_ThisType')) {
      aTag.message.push(`<span class="ml-1 badge badge-info">Special Condition: OptOut_ThisType</span>`);
    }
    if (href.includes('%%=RedirectTo(@pageURLALL)=%%') && alias.includes('%%OFFERCODE%%_OptOut_ALL')) {
      aTag.message.push(`<span class="ml-1 badge badge-info">Special Condition: OptOut_ALL</span>`);
      aTag.passed = true;
    }
    /** SESSION END */
    if (aTag.passed) message.push(`
      <div><b>${message.length - messageHintLength}</b><span class="ml-1 badge badge-success">OK</span>
        <span class="bg-light">${aTag.message.join('')}</span>
        <p class="font-italic">${href}</p>
      </div>
    `);
    else message.push(`
      <div><b>${message.length - messageHintLength}</b><span class="ml-1 badge badge-danger">FAILED</span>
        <span class="bg-light">${aTag.message.join('')}</span>
        <p class="font-italic">${href}</p>
      </div>
    `);
    if (!aTag.passed) passed = false;
  });
  /** WHEN MISSING PREFERENCES */
  if (aTagMatched.some(aTag => aTag.isCID)) {
    if (!aTagMatched.some(aTag => aTag.isPreferences)) {
      message.push(`<div>
        <b>${message.length - messageHintLength}</b>
        <span class="ml-1 badge badge-danger">FAILED</span>
        <span class="ml-1 badge badge-danger">Incorrect campaign code of preference link</span>
        ${aTagMatched.filter(({ CID }) => !!CID).map(({ CID }) => `<span class="ml-1 badge badge-danger">${CID}</span>`).join('')}
      </div>`);
    }
  } else {
    message.push(`<div>
      <b>${message.length - messageHintLength}</b>
      <span class="ml-1 badge badge-danger">FAILED</span>
      <span class="ml-1 badge badge-danger">Missing campaign code of preference link</span>
    </div>`);
  }
  const { CID, CIDLink } = aTagMatched.find(aTag => aTag.isPreferences) || {};
  return { passed, CID, CIDLink, message: message.join('') || 'NOT FOUND CAMPAIGN CODE' };
};

const checkLitmusTrackingCode = (html) => {
  const getBadgeHtml = (text, classText = 'badge-danger') => `<span class="ml-1 badge badge-pill ${classText}">${text}</span>`
  const res = { passed: true, message: 'Litmus tracking (https://eoxe4ovw.emltrk.com) not found' }
  const regex = new RegExp(
    [
      `<[a-zA-Z][^>]*(eoxe4ovw\.emltrk\.com)+[^<]*>`, // case attribute
      `<[a-zA-Z][^>]*>[^>]*(eoxe4ovw\.emltrk\.com)[^>]*<\/[a-zA-Z][^>]*>` // case content style tag
    ].join('|'),
    'gm'
  )
  const splitName = ` ${new Date().getTime()} `
  const myhtml = html.replace(/\n/gm, splitName)
  const tagTrackingCodes = myhtml.match(regex)
  // console.log(tagTrackingCodes, 'tagTrackingCodes')
  if (tagTrackingCodes && tagTrackingCodes.length) {
    res.message = tagTrackingCodes.map((tag, index) => {
      return `<div><b>${index + 1}. </b>${getBadgeHtml('Litmus tracking code', 'badge-danger')} <pre>${encodedStr(tag.replace(new RegExp(splitName, 'gm'), '\n'))}</pre></div>`
    }).join('\n')
    res.passed = false
  }
  return res
}

const checExistHondaEmailTypeOther = (html) => {
  const res = { passed: true, messages: [] }
  const bodyTags = regexMatchContent(/<body[^>]*>(?:.|\n|\r)+?<\/body>/gm, allTrim(removeCommentSafe(html)))
  const bodyContent = (Array.isArray(bodyTags) && bodyTags.length && bodyTags[0]) || ''
  let mailType = ''
  const aTagMatched = getTagAttr(bodyContent, { 'aTag': '<a[^>]*(alias)+[^>]*>' }).aTag
  const hasUnsubscribeFromAllAHM = /<p[^>]*>.*Unsubscribe from All AHM.*<\/p>/i.test(bodyContent)

  aTagMatched.some(({ href }) => {
    mailType = /^(https:\/\/powersports.honda.com)/.test(href) ? 'HPS' :
      /^(https:\/\/powerequipment.honda.com)/.test(href) ? 'HPE' :
        /^(https:\/\/marine.honda.com)/.test(href) ? 'MARINE' :
          /^(https:\/\/engines.honda.com)/.test(href) ? 'ENGINES' :
            /^(https:\/\/automobiles.honda.com)/.test(href) ? 'HONDA' :
              /^(https:\/\/www.acura.com)/.test(href) ? 'ACURA' : undefined
    return mailType
  })

  if (mailType) {
    res.messages.push(`<div>
    <span class="ml-1 badge badge-success">OK</span>
    <span class="ml-1 text-success">Honda Email Type</span>
    <span class="ml-1 badge badge-success">${mailType}</span>
    </div>`)

    if (!hasUnsubscribeFromAllAHM) {
      const RgHPS = /.*hps.*/gmi
      const RgHPE = /.*hpe.*/gmi
      const RgMarine = /.*marine.*/gmi
      const rulesO = {
        HPS: [{ label: 'HPE', regex: RgHPE }, { label: 'Marine', regex: RgMarine }],
        HPE: [{ label: 'HPS', regex: RgHPS }, { label: 'Marine', regex: RgMarine }],
        MARINE: [{ label: 'HPS', regex: RgHPS }, { label: 'HPE', regex: RgHPE }],
      }
      const rules = rulesO[mailType]
      for (const { label, regex } of rules) {
        const matched = html.match(regex)
        if (matched && matched.length) {
          res.passed = false
          res.messages.push(
            ...matched.map(
              match => `<div><span class="ml-1 badge badge-danger">FOUND:${label}</span><span class="ml-1 text-danger">${encodedStr(match)}</span></div>`
            )
          )
        } else {
          res.messages.push(`<div><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">does not exist "${label}"</span></div>`)
        }
      }
    }
  } else {
    res.passed = false
    res.messages.push(`<div><span class="ml-1 badge badge-danger">FAILED</span><span class="ml-1 text-danger">missing Honda Email Type</span></div>`)
  }

  res.message = res.messages.join('\n')
  return res
}

const checkLinkAndAliasUnsubscribe = (html) => {
  const res = { passed: true, messages: [] }
  const bodyTags = regexMatchContent(/<body[^>]*>(?:.|\n|\r)+?<\/body>/gm, html)
  const bodyContent = (Array.isArray(bodyTags) && bodyTags.length && bodyTags[0]) || ''

  const link1 = '%%=RedirectTo(@pageURL)=%%'
  const link2 = '%%=RedirectTo(@pageURLALL)=%%'
  const alias1 = '%%OFFERCODE%%_OptOut_ThisType'
  const alias2 = '%%OFFERCODE%%_OptOut_ALL'

  const hasLink1WithAlias1 = bodyContent.includes(`${link1}`) && bodyContent.includes(`alias="${alias1}"`)
  const hasLink2WithAlias2 = bodyContent.includes(`${link2}`) && bodyContent.includes(`alias="${alias2}"`)

  if (hasLink1WithAlias1) {
    res.messages.push(`<div><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">Contains link: ${link1} with alias: ${alias1}</span></div>`)
  } else {
    res.passed = false
    res.messages.push(`<div><span class="ml-1 badge badge-danger">FAILED</span><span class="ml-1 text-danger">Missing link: ${link1} with alias: ${alias1}</span></div>`)
  }

  if (hasLink2WithAlias2) {
    res.messages.push(`<div><span class="ml-1 badge badge-success">OK</span><span class="ml-1 text-success">Contains link: ${link2} with alias: ${alias2}</span></div>`)
  } else {
    res.passed = false
    res.messages.push(`<div><span class="ml-1 badge badge-danger">FAILED</span><span class="ml-1 text-danger">Missing link: ${link2} with alias: ${alias2}</span></div>`)
  }

  res.message = res.messages.join('\n')
  return res
}

const allValidateFunctions = {
  updateDayDateformattoAMPScript,
  checkIncludeTexts,
  addOpenTrackingCodeToEmail,
  ensureAllLinksHaveAliasAttributeApplied,
  checkAllAliasMatchingWithFormat,
  checkAllCidQueryMatching,
  updateViewAsWebURL,
  oldCustomAmpscript,
  newCustomAmpscript,
  addTrackingToLinks,
  ensureThePreviewTextInTheHTMLMatchesPreviewTextOnCopyDeck,
  checkPhysicalAddress,
  checkHideDefaultProfileCenter,
  checkErrorHtmlSyntax,
  checkRedundancy25,
  checkAbsoluteImageLink,
  ensureHtmlContainDarkmodeMetaTagStyles,
  checkMultilineSinglelineTag,
  noCarbon8Links,
  checkDublicateAttr,
  CheckCodeMarketo,
  allLinkMustNotContainSpaceAndSpecialSymbols,
  ensureTitleIsMatching,
  checkOfficeDocumentSettingsOnOutlook,
  checkLinkShouldOpenNewTab,
  checkContainReferencesCampaignCode,
  checkFormatCampaignCodeCID,
  checkLitmusTrackingCode,
  checExistHondaEmailTypeOther,
  checkLinkAndAliasUnsubscribe
}

const defaultEmail = [
  {
    isDefault: true,
    text: 'Please make sure the <b>preview text</b> in the HTML matches <b>preview text</b> on Copy Deck and show more than spaces',
    function: 'ensureThePreviewTextInTheHTMLMatchesPreviewTextOnCopyDeck'
  },
  {
    isDefault: true,
    text: 'Check Html Syntax',
    function: 'checkErrorHtmlSyntax'
  },
  {
    isDefault: true,
    text: 'Check Redundancy %25',
    function: 'checkRedundancy25'
  },
  {
    isDefault: true,
    text: 'Check Absolute Image',
    function: 'checkAbsoluteImageLink'
  },
  {
    isDefault: true,
    text: 'Ensure Html contain darkmode meta tag, styles',
    function: 'ensureHtmlContainDarkmodeMetaTagStyles'
  },
  {
    isDefault: true,
    text: 'Check multiline singleline tag',
    function: 'checkMultilineSinglelineTag'
  },
  {
    text: 'Check Dublicate Attr',
    function: 'checkDublicateAttr',
    isDefault: true,
  },
  {
    isDefault: true,
    'text': 'No links to carbon8 server (Honda email) (https://email.carbon8.info/, https://emailassets.gravityglobal.com)',
    function: 'noCarbon8Links'
  },
  {
    isDefault: true,
    'text': 'Check Code Marketo',
    function: 'CheckCodeMarketo'
  },
  {
    isDefault: true,
    'text': 'All links must NOT CONTAIN space, "&&", no more than 2 "?" character',
    function: 'allLinkMustNotContainSpaceAndSpecialSymbols'
  },
  {
    isDefault: true,
    'text': 'Ensure Title is Matching with text copy',
    function: 'ensureTitleIsMatching'
  },
  {
    isDefault: true,
    'text': 'Check contain OfficeDocumentSettingsOnOutlook',
    function: 'checkOfficeDocumentSettingsOnOutlook'
  },
  {
    isDefault: true,
    'text': 'Check Litmus tracking code',
    function: 'checkLitmusTrackingCode'
  },

]

const emailTypes = {
  default: defaultEmail,
  honda: [
    ...defaultEmail,
    {
      text: 'Update Day / Date format to AMPScript (multiple areas in header and footer)',
      function: 'updateDayDateformattoAMPScript'
    },
    {
      text: 'Add Open Tracking Code to Email',
      function: 'addOpenTrackingCodeToEmail'
    },
    {
      text: `Ensure all links have 'alias' attribute applied`,
      function: 'ensureAllLinksHaveAliasAttributeApplied'
    },
    {
      text: `Check all alias is matching with format`,
      function: 'checkAllAliasMatchingWithFormat'
    },
    {
      text: 'Update View as Web URL',
      function: 'updateViewAsWebURL'
    },
    {
      text: 'Custom Ampscript (old)',
      function: 'oldCustomAmpscript'
    },
    {
      text: 'Custom Ampscript (new)',
      function: 'newCustomAmpscript'
    },
    {
      text: 'Add Tracking to Links (should has pgrcd=, cmpcd=, ofrcd=)',
      function: 'addTrackingToLinks'
    },
    {
      text: 'Check Physical Address',
      function: 'checkPhysicalAddress'
    },
    {
      text: 'Check Hide default Profile Center',
      function: 'checkHideDefaultProfileCenter'
    },
    {
      text: 'Check link should open new tab',
      function: 'checkLinkShouldOpenNewTab'
    },
    {
      text: `Check all cid query is matching`,
      function: 'checkAllCidQueryMatching'
    },
    {
      text: `Check HTML contain References text`,
      function: 'checkContainReferencesCampaignCode'
    },
    {
      'text': 'Check Format Campaign Code & CID',
      function: 'checkFormatCampaignCodeCID'
    },
    {
      'text': 'Check HTML does not exist text of Honda Email Type Other',
      function: 'checExistHondaEmailTypeOther'
    },
    {
      isDefault: true,
      'text': 'Check link and alias unsubscribe',
      function: 'checkLinkAndAliasUnsubscribe'
    },
  ],
}