const path = require('path')
const dotenv = (process.env.DOTENV_PATH || path.resolve(__dirname, '.env'))
require('dotenv').config({ path: dotenv })
const debug = require('debug')('hostMonitor');
const axios = require('axios')
const {customers} = require('./config/config')
const {DateTime} = require('luxon')

const fetchMonitor = async ({integration_token}) => {
    const options = {
        method: 'GET',
        url: `https://supervisor.theeye.io/monitor`,
        headers: {
            'Authorization': `Bearer ${integration_token}`
        }
    }

    const res = await axios(options)

    return res.data
}

const main = module.exports = async (customerName) => {

    const customer = customers.find((conf) => conf.customer === customerName)

    if(!customer) throw new Error(`customer ${customerName} not found in config file`)

    for(const host of customer.hosts) {
        const monitors = await fetchMonitor(host)

        const monitor = monitors.find((mon) => mon.host_id === host.host_id && mon.type === 'host')

        debug(monitor.state)

        const timezone = host.timezone || 'America/Argentina/Cordoba'

        const now = DateTime.now().setZone(timezone)

        const startTime = DateTime.now().setZone(timezone).set({
            hour: host.timeframe.start.hour,
            minute: host.timeframe.start.minute
        })

        const stopTime = DateTime.now().setZone(timezone).set({
            hour: host.timeframe.stop.hour,
            minute: host.timeframe.stop.minute
        })

        if(monitor.state !== 'normal' && (now >= startTime && now <= stopTime)) {
            debug('host is offline, rebooting...')
        } else {
            debug('host is online, skipping...')
        }
    }
}

if (require.main === module) {
    const customer = 'kavak-patentes-mexico'
    main(customer).then(console.log).catch(console.error)
}
