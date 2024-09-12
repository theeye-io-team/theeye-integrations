const puppeteer = require('puppeteer')
const baseUrl = process.env.FERIADOS_WEBBOT_BASEURL
const { DateTime } = require('luxon')
const { GCHAT } = require('./google-chat')

if (!process.env.FERIADOS_WEBBOT_BASEURL) throw new Error('Env FERIADOS_WEBBOT_BASEURL not defined.')


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

const main = module.exports = async (year) => {
    if (!year) {
        year = DateTime.now().toFormat('yyyy')
    }

    const url = `${baseUrl}${year}`

    const browser = await puppeteer.launch(browserOptions)
    const page = await browser.newPage()
    await page.goto(url)

    try {
        const payload = await page.evaluate((year) => {
            const getMonth = (month) => {
                const months = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ]

                const index = months.findIndex((m) => m === month.toLowerCase()) + 1

                if(index < 0) throw new Error('wrong month definition, check ids')

                return index
            }

            const extractNumbers = (str) => {
                const regex = /^([0-9]*(\s|,)?)*./
                const matches = str.match(regex)
                const numbers = matches[0].replace('.', '').split(',')
                return numbers.map(Number)
            }

            const eles = []

            const calendarContainer = document.getElementById('calendar-container')
            if (!calendarContainer) throw new Error('cannot find calendar container')

            const holidaysDiv = calendarContainer.querySelectorAll('div.holidays')

            for (const div of holidaysDiv) {
                const parentElement = div.parentElement
                const textMonth = parentElement.id.substring(1)
                const holidays = div.querySelectorAll('p')

                for (const p of holidays) {
                    const text = p.innerText
                    if (/\([a|b|c]\)$/.test(text) === false) {
                        if (text) {
                            const days = extractNumbers(text)
                            for (const day of days) {
                                if (day !== 0) {
                                    const month = getMonth(textMonth)
                                    eles.push(`${String(day).length === 1 ? `0${day}` : day}-${month.length === 1 ? `0${month}` : month}-${year}`)
                                }
                            }
                        }
                    }
                }

            }

            return eles
        }, year)

        return payload
    } catch (err) {
        await new GCHAT().sendMessage(JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
        throw err
    }
}

if (require.main === module) {
    main().then(console.log).catch(console.error)
}