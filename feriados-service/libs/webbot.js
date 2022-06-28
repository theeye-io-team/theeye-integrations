const puppeteer = require('puppeteer')
const baseUrl = process.env.FERIADOS_WEBBOT_BASEURL
const { DateTime } = require('luxon')

const browserOptions = {
    headless: true,
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

const main = module.exports = async (year) => {
if (!year) {
    year = DateTime.now().toFormat('yyyy')
    }

    const url = `${baseUrl}${year}`

    const browser = await puppeteer.launch(browserOptions)
    const page = await browser.newPage()
    await page.goto(url)

    return await page.evaluate((year)=> {
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
}

if(require.main === module) {
    main().then(console.log).catch(console.error)
}