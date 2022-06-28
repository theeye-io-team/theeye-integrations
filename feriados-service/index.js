require('dotenv').config({ path: './.env' })

if(!process.env.FERIADOS_WEBBOT_BASEURL) throw new Error('Env FERIADOS_WEBBOT_BASEURL not defined.')
if(!process.env.SERVICES_HUB_TOKEN) throw new Error('Env SERVICES_HUB_TOKEN not defined.')

const crypto = require('crypto')
const Files = require('./libs/file')
const webbot = require('./libs/webbot')
const sendEmail = require('./libs/sender')
Files.access_token = process.env.SERVICES_HUB_TOKEN
Files.customer = JSON.parse(process.env.THEEYE_ORGANIZATION_NAME)
const serviceCustomers = require('./config/service-customers.json')

const generateFingerprint = (string) => {
  const hash = crypto.createHash('sha1')
  hash.update(string)
  return hash.digest('hex')
}

const checkForChanges = async (feriados) => {
  if(!feriados.length) {
    throw new Error('Failure fetching Feriados from page')
  }

  const fileData = {
    filename: 'feriados.json',
    description: `Automatically generated on ${new Date().toISOString()}`,
    mimetype: 'application/json',
    content: JSON.stringify(feriados, null, 2)
  }

  const files = await Files.GetByFilename('feriados.json')

  if(!files.length) {
    await Files.Upsert(fileData)
    return fileData
  } else if (files.length === 1) {
    const fileContent = await Files.Download(files[0].id)
    const fileFingerprint = generateFingerprint(JSON.stringify(fileContent))
    const newFileFingerprint = generateFingerprint(JSON.stringify(feriados))

    if(fileFingerprint !== newFileFingerprint) {
      await Files.Upsert(fileData)
      return fileData
    }

  } else {
    throw new Error('Multiple files with the same name...')
  }

  throw new Error('No changes')
}

const processCustomers = async (feriados) => {
  
  const updates = {
    webhook:0,
    email:0,
    skipped:0
  }

  for(const customer of serviceCustomers) {
    if(customer.enabled) {
      if(customer.type === 'webhook') {
        Files.customer = customer.customer_name
        Files.access_token = customer.target
        await checkForChanges(feriados)
        updates.webhook++
      }

      if(customer.type === 'email') {
        await sendEmail(customer.target, feriados)
        updates.email++
      }

    } else {
      console.log(`customer ${customer.customer_name} disabled via service-customers config`)
      updates.skipped++
    }
  }

  return updates
}

const main = module.exports = async () => {
  
  const feriados = await webbot(process.env.FERIADOS_YEAR)
  await checkForChanges(feriados)
  return await processCustomers(feriados)
}

if(require.main === module) {
    main().then(console.log).catch(console.error)
}
