
const https = require('https')
const URL = require('url')

// NodeJs boilerplate
const main = module.exports = async () => {
  const payload = JSON.parse(process.argv[2])

  console.log(payload)

  const { ticket_id, ticket_status, ticket_subject } = payload.freshdesk_webhook
  const value = await new Promise((resolve, reject) => {

    const url = new URL(process.env.GCHAT_WEBHOOK_URL)

    const options = {
      host: url.host,
      path: url.path + url.search,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    const req = new https.request(options, (res) => {
      let data = ''

      res.on('data', d => {
        data = data + d
      })

      res.on('end', () => {
        const value = JSON.parse(data)
        console.log(value)
        resolve(value)
      })
    })

    req.on('error', error => {
      console.error(error)
      reject(error)
    })
    req.write( JSON.stringify({ text: `nuevo ticket ${ticket_id} en freshdesk. asunto: ${ticket_subject}` }) )
    req.end()
  })

  return { data: value }
}
