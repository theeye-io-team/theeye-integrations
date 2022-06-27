require('dotenv').config({ path: './.env' })

const Files = require('./libs/file')
Files.access_token = process.env.SERVICES_HUB_TOKEN
const { DateTime } = require('luxon')
const crypto = require('crypto')
const puppeteer = require('puppeteer')
const baseUrl = process.env.FERIADOS_WEBBOT_BASEURL

const browserOptions = {
  headless: false,
  handleSIGINT: true,
  handleSIGTERM: true,
  handleSIGHUP: true,
  // executablePath: '/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--disable-features=site-per-process',
    '--disable-gpu',
    '--window-size=1920,1024'
  ]
}

const generateFingerprint = (string) => {
    const hash = crypto.createHash('sha1')
    hash.update(string)
    return hash.digest('hex')
  }

const main = module.exports = async (year) => {
  if (!year) {
    year = DateTime.now().toFormat('yyyy')
  }

  const url = `${baseUrl}${year}`

  const browser = await puppeteer.launch(browserOptions)
  const page = await browser.newPage()
  await page.goto(url)

  const feriados = await page.evaluate((year)=> {
    const eles=[]

    document.getElementById('calendar-container')
      .querySelectorAll('div.cont').forEach( (ccc, index) => { 
      ccc.querySelectorAll('p').forEach(p => {
        const text = p.innerText
        if (/\([a|b|c]\)$/.test(text) === false) {
          const day = Number(text.split('.')[0])
          if(text || day!==0) {
            const month = String(index + 1)
            eles.push(`${String(day).length === 1 ? `0${day}` : day}-${month.length === 1 ? `0${month}` : month}-${year}`)
          }
        }
      })
    })

    return eles
  }, year)
  
  if(!feriados.length) {
    throw new Error('Failure fetching Feriados from page')
  }

  const fileData = {
    filename: 'feriados.json',
    description: `Automatically generated on ${new Date().toISOString()}`,
    mimetype: 'application/json',
    content: JSON.stringify(feriados, null, 2)
  }

  const files = await Files.GetByFilename('feriados.json')

  if(!files.length) {
    return Files.Upsert(fileData)
  } else if (files.length === 1) {
    const fileContent = await Files.Download(files[0].id)
    const fileFingerprint = generateFingerprint(JSON.stringify(fileContent))
    const newFileFingerprint = generateFingerprint(JSON.stringify(feriados))

    if( fileFingerprint !== newFileFingerprint) {
      return Files.Upsert(fileData)
    }

  } else {
    throw new Error('Multiple files with the same name...')
  }

  throw new Error('No changes')
}

if(require.main === module) {
    main(process.argv[2]).then(console.log).catch(console.error)
}
