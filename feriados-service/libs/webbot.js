const puppeteer = require('puppeteer')
const baseUrl = process.env.FERIADOS_WEBBOT_BASEURL
const { DateTime } = require('luxon')
const { GCHAT } = require('./google-chat')

if(!process.env.FERIADOS_WEBBOT_BASEURL) throw new Error('Env FERIADOS_WEBBOT_BASEURL not defined.')

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

    try {
        return await page.evaluate((year)=> {
            extractNumbers = (str) => {
                const regex = /^([0-9]*(\s|,)?)*./
                const matches = str.match(regex)
                const numbers = matches[0].replace('.','').split(',')
                return numbers.map(Number)
            }
    
            const eles = []
    
            const calendarContainer = document.getElementById('calendar-container')
            if(!calendarContainer) throw new Error('cannot find calendar container')

            const holidaysDiv = calendarContainer.querySelectorAll('div.holidays')
            // if(holidaysDiv.length !== 12) throw new Error('holidays monthly div differes from expected value')

            holidaysDiv.forEach( (ccc, index) => { 
                ccc.querySelectorAll('p').forEach(p => {
                const text = p.innerText
                if (/\([a|b|c]\)$/.test(text) === false) {
                    if(text) {
                        const days = extractNumbers(text)
                        console.log(text, days)
                        for(const day of days) {
                            if(day !== 0) {
                                const month = String(index + 1)
                                eles.push(`${String(day).length === 1 ? `0${day}` : day}-${month.length === 1 ? `0${month}` : month}-${year}`)        
                            }
                        }
                    }
                }
                })
            })
            return eles
        }, year)
    } catch(err) {
        await new GCHAT().sendMessage(JSON.stringify({message: err.message, stack: err.stack},null,2))
        throw err
    }
}

if(require.main === module) {
    main().then(console.log).catch(console.error)
}