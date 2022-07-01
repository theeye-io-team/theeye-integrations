require('dotenv').config({ path: './.env' })

if(!process.env.FERIADOS_WEBBOT_BASEURL) throw new Error('Env FERIADOS_WEBBOT_BASEURL not defined.')
if(!process.env.THEEYE_ACCESS_TOKEN) throw new Error('Env THEEYE_ACCESS_TOKEN not defined.')

const crypto = require('crypto')
const Files = require('./libs/file')
const webbot = require('./libs/webbot')
const sendEmail = require('./libs/sender')
const Request = require('./libs/req')
const serviceCustomers = require('./config/service-customers.json')
const Transports = require('./constants')

const main = module.exports = async () => {
  
  const feriados = await webbot(process.env.FERIADOS_YEAR)
  await checkForChanges(feriados)
  return processCustomers(feriados)
}

const checkForChanges = async (feriados, customer, access_token) => {
  if(!feriados.length) {
    throw new Error('Failure fetching Feriados from page')
  }

  const fileData = {
    filename: 'feriados.json',
    description: `Automatically generated on ${new Date().toISOString()}`,
    mimetype: 'application/json',
    content: JSON.stringify(feriados, null, 2)
  }

  const files = await Files.GetByFilename('feriados.json', customer, access_token)

  if(!files.length) {
    await Files.Upsert(fileData, customer, access_token)
    return fileData
  } else if (files.length === 1) {
    const fileContent = await Files.Download(files[0].id, customer, access_token)
    const fileFingerprint = generateFingerprint(JSON.stringify(fileContent))
    const newFileFingerprint = generateFingerprint(JSON.stringify(feriados))

    if(fileFingerprint !== newFileFingerprint) {
      await Files.Upsert(fileData, customer, access_token)
      return fileData
    }

  } else {
    throw new Error('Multiple files with the same name...')
  }

  throw new Error('No changes')
}

const generateFingerprint = (string) => {
  const hash = crypto.createHash('sha1')
  hash.update(string)
  return hash.digest('hex')
}

const processCustomers = (feriados) => {
  const promiseArray = []
  for (const customer of serviceCustomers) {
    if (customer.enabled) {
      const transport = TransportFactory[ customer.type ]({ feriados, customer })
      promiseArray.push(
        transport
          .then(result => {
            return customer
          })
          .catch(err => {
            err.customer = customer
            throw err
          })
      )
    } else {
      promiseArray({ customer, message: 'disabled' })
    }
  }

  return Promise.allSettled(promiseArray)
}

const TransportFactory = { }

TransportFactory[ Transports.WEBHOOK_TRANSPORT ] = ({ feriados, customer }) => {
  const options = customer.target
  options.json = {
    task_arguments:[feriados]
  }

  return Request(customer.target)
}

TransportFactory[ Transports.EMAIL_TRANSPORT ] = ({ feriados, customer }) => {
  return sendEmail(customer.target, feriados)
}

TransportFactory[ Transports.THEEYE_FILE_TRANSPORT ] = ({ feriados, customer }) => {
  return checkForChanges(feriados, customer.customer_name, customer.target)
}

if (require.main === module) {
  main().then(console.log).catch(console.error)
}
