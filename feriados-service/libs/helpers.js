
const crypto = require('crypto')
const Files = require('./file')
const serviceCustomers = require('../config/service-customers.json')
const Transports = require('./constants')
const sendEmail = require('./sender')
const Request = require('./req')
if(!process.env.THEEYE_ACCESS_TOKEN) throw new Error('Env THEEYE_ACCESS_TOKEN not defined.')


const checkForChanges = async (feriados, customer, access_token) => {
    if(!feriados.length) throw new Error('Failure fetching Feriados from page')

    const fileData = {
        filename: 'feriados.json',
        description: `Automatically generated on ${new Date().toISOString()}`,
        mimetype: 'application/json',
        content: JSON.stringify(feriados, null, 2)
    }
    
    const files = await Files.GetByFilename('feriados.json', customer, access_token)
    
    if(!files.length) {
        await Files.Upsert(fileData, customer, access_token)
        return {
        data: [feriados],
        event_name: 'file_created',
        }
    } else if (files.length === 1) {
        const fileContent = await Files.Download(files[0].id, customer, access_token)
        const fileFingerprint = generateFingerprint(JSON.stringify(fileContent))
        const newFileFingerprint = generateFingerprint(JSON.stringify(feriados))
    
        if(fileFingerprint !== newFileFingerprint) {
        await Files.Upsert(fileData, customer, access_token)
        return {
            data: [feriados],
            event_name: 'file_updated',
        }
        }
    
    } else {
        return {
            data: [],
            event_name: 'error_multiple',
        }
    }
    
    return {
        data: [],
        event_name: 'file_no_changes',
    }      
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
        promiseArray.push({ customer, message: 'disabled' })
        }
    }
    
    return Promise.allSettled(promiseArray)
}


const generateFingerprint = (string) => {
    const hash = crypto.createHash('sha1')
    hash.update(string)
    return hash.digest('hex')
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

module.exports = {
    checkForChanges,
    processCustomers
  }