require('dotenv').config({ path: './.env' })

if(!process.env.FERIADOS_WEBBOT_BASEURL) throw new Error('Env FERIADOS_WEBBOT_BASEURL not defined.')
if(!process.env.THEEYE_ACCESS_TOKEN) throw new Error('Env THEEYE_ACCESS_TOKEN not defined.')

const crypto = require('crypto')
const Files = require('./libs/file')
const webbot = require('./libs/webbot')
const sendEmail = require('./libs/sender')
const Request = require('./libs/req')
const serviceCustomers = require('./config/service-customers.json')

const generateFingerprint = (string) => {
  const hash = crypto.createHash('sha1')
  hash.update(string)
  return hash.digest('hex')
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

const processCustomers = (feriados) => {

  const promiseArray = []
  
  for(const customer of serviceCustomers) {
    const customerData = {customer_name: customer.customer_name, customer_type: customer.type}
    if(customer.enabled) {
      if(customer.type === 'file') {
        promiseArray.push(checkForChanges(feriados, customer.customer_name, customer.target)
        .then(()=>customerData)
        .catch(err=>err))
      }

      if(customer.type === 'email') {
        promiseArray.push(
          sendEmail(customer.target, feriados)
          .then(()=>customerData)
          .catch(err=>err))
      }

      if(customer.type === 'webhook') {
        const options = customer.target
        options.json = {
          task_arguments:[feriados]
        }

        promiseArray.push(
          Request(customer.target)
          .then(()=>customerData)
          .catch(err=>err))
      }
    } else {
      // promiseArray.push(Promise.reject(Object.assign({err:new Error(`customer ${customer.customer_name} disabled via service-customers config`)}, customerData)))
    }
  }

  return Promise.allSettled(promiseArray)
}

const main = module.exports = async () => {
  
  const feriados = await webbot(process.env.FERIADOS_YEAR)
  await checkForChanges(feriados)
  return processCustomers(feriados)
}

if(require.main === module) {
    main().then(console.log).catch(console.error)
}
