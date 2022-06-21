// error and output handlers must go first.

/**
 * @param {Object}
 * @prop {Mixed} data
 * @prop {Array} components
 * @prop {Object} next
 */
const successOutput = ({ data, components, next }) => {
  // https://documentation.theeye.io/core-concepts/scripts/#passing-arguments-in-workflow
  const output = {
    state: "success",
    data,
    components, // https://documentation.theeye.io/core-concepts/tasks/script_type/#components
    next
  }
  console.log( JSON.stringify(output) )
  process.exit(0)
}

/**
 * @param {Error} err
 */
const failureOutput = (err) => {
  console.error(err)
  const output = {
    state: "failure",
    data: {
      message: err.message,
      code: err.code,
      data: err.data
    }
  }
  console.error( JSON.stringify(output) )
  process.exit(1)
}

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p)
  failureOutput(reason)
})

process.on('uncaughtException', err => {
  console.error(err, 'Uncaught Exception thrown')
  failureOutput(err)
})


const https = require('https')
const URL = require('url')

// NodeJs boilerplate
const main = async () => {
  const payload = JSON.parse(process.argv[2])

  console.log(payload)

  const { ticket_id, ticket_status, ticket_subject } = payload.freshdesk_webhook
  const value = await new Promise((resolve, reject) => {

    const url = new URL.parse(process.env.GCHAT_WEBHOOK_URL)

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

module.exports = () => {
  // invoke main and capture result output
  main().then(successOutput).catch(failureOutput)
}
