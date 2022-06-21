
const https = require('https')

// NodeJs boilerplate
const main = module.exports = async () => {
  const payload = JSON.parse(process.argv[2])

  console.log(payload)

  const { ticket_id, ticket_status, ticket_subject } = payload.freshdesk_webhook
  const value = await new Promise((resolve, reject) => {

    const options = {
      host: 'chat.googleapis.com',
      path: '/v1/spaces/AAAAvjrZDUg/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=fQDYKhF4-zQDwttRHWKmV7yeJa7qSoB4QDh310hr0p4%3D',
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
