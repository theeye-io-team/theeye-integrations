const https = require('https')
const http = require('http')
const { URL } = require('url')

module.exports = (options) => {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url)
    let requestBody

    const request = (url.protocol === 'https:' ? https : http).request

    if (!options.headers) {
      options.headers = {}
    }

    if (options.formData) {
      options.headers = Object.assign(
        {},
        options.headers,
        options.formData.getHeaders()
      )
    }

    // json body.
    // it requires header: content-type: application/json
    // also JSON.stringify is required. don't trust the user
    if (options.json) {
      if(!Object.keys(options.headers).filter((header)=>header.toUpperCase()==='content-type'.toUpperCase()).length) {
        options.headers['content-type'] = 'application/json'
      }
      options.headers['content-length'] = Buffer.byteLength(JSON.stringify(options.json))
      requestBody = JSON.stringify(options.json)
    }

    const requestOptions = Object.assign({}, options, {
      port: url.port,
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`
    })

    const req = request(requestOptions)

    req.on('response', res => {
      const data = []

      res.on('data', chunk => {
        data.push(chunk)
      })

      res.on('end', () => {
        let payload
        const buffer = Buffer.concat(data).toString()

        // assuming that the response is always JSON.
        // But better would be to check the response content-type header
        //if (/json/.test(res.headers['content-type'])) {
        try {
          payload = JSON.parse(buffer)
        } catch (e) {
          payload = buffer
        }
        //}
        res.body = payload

        if (res.statusCode >= 400) {
          const err = new Error(`${res.statusCode}: ${res.body?.message||res.body}`)
          err.response = res
          err.request = req
          reject(err)
          return
        }

        // return the response object.
        // assign the body to a response property body
        resolve(res)
      })
    })

    req.on('error', reject)

    if (options.formData) {
      options.formData.pipe(req)
    } else {
      if (requestBody) {
        req.write(requestBody)
      }
      req.end()
    }
  })
}