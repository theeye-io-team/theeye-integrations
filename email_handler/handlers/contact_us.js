const path = require('path')
let Validator = require('validatorjs')
const axios = require('axios')
const i18next = require('i18next')
const emailTemplates = require('../libs/templates-email')
const email = require('../libs/email')

const config = require('../config/config.json')

let processParams

const prepareGChatPayload = (payload) => {
    return {
        cards: [
            {
                header: {
                    title: payload.subject,
                    subtitle: `From: ${payload.user}`
                },
                sections: [
                    {
                        widgets: [
                            {
                                textParagraph: {
                                    text: `Subject: ${payload.subject}`
                                }
                            },
                            {
                                textParagraph: {
                                    text: `Inquiry: ${payload.text}`
                                }
                            },
                            {
                                keyValue: {
                                    topLabel: "Customer:",
                                    content: payload.customer
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}

console.log('processParams', processParams)

const validateParams = () => {
    return new Promise(async (resolve, reject) => {

        let validationRules = {
            subject: ['required'],
            text: ['required']
        }

        let validation = new Validator(processParams, validationRules)

        const passes = () => {
            resolve(true)
        }

        const fails = () => {
            reject(validation.errors)
        }

        validation.checkAsync(passes, fails)
    })
}

const main = module.exports = async (payload) => {

    // Validación de parámetros
    try {
        processParams = payload
        await validateParams()
    } catch (err) {
        throw new ClientError(err, { statusCode: 400 })
    }

    const userData = JSON.parse(process.env.THEEYE_JOB_USER)
    
    userData.name = userData.username || userData.email
    userData.default_language = 'es'

    // API -  Obtenemos el usuario
    console.log('userData', userData)

    const attachments = [{
        filename: 'TheEye_isologotipo.png',
        path: path.join(__dirname, '..', 'templates', 'images', 'TheEye_isologotipo.png'),
        cid: 'TheEye_isologotipo@cid'
    }]

    // EMAIL - Confirmación de email
    console.log('Email Contact US - CUSTOMER')
    const htmlEmailRegistrationEmailContactUsCustomer = emailTemplates.generateHtmlRegistrationContactUsCustomer(
        userData, 
        processParams.subject, 
        processParams.text, 
        userData.default_language
    )

    const emailOptionsContactUsCustomer = email.prepareEmailOptions(
        attachments, 
        i18next.t('email_contact_us_subject'), 
        htmlEmailRegistrationEmailContactUsCustomer, 
        userData.email
    )

    // EMAIL - Confirmación de email
    console.log('Email Contact US - THEEYE')
    const htmlEmailRegistrationEmailContactUsTheEye = emailTemplates.generateHtmlRegistrationContactUsTheEye(
        userData, 
        processParams.subject, 
        processParams.text, 
        userData.default_language
    )

    const emailOptionsContactUsTheEye = email.prepareEmailOptions(
        attachments, 
        i18next.t('email_contact_us_subject'), 
        htmlEmailRegistrationEmailContactUsTheEye, 
        config.output.email_contact_us.address_to
    )

    // CHAT - Webhook grupo soporte
    if (config.output.google_chat.enabled) {
        const data = `{"task_arguments":[${JSON.stringify(prepareGChatPayload(processParams))}]}`
        const url = `https://supervisor.theeye.io/task/${config.output.google_chat.task_id}/secret/${config.output.google_chat.secret}/job`
        await axios({
            method: 'post',
            url,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            data
        })
    }

    await Promise.all([
        email.sendEmail(emailOptionsContactUsCustomer),
        email.sendEmail(emailOptionsContactUsTheEye)
    ])

}

class ClientError extends Error {
    constructor(message, options) {
        super(message || 'Invalid Request')
        options || (options = {})
        Object.assign(this, options)
        this.name = this.constructor.name
        this.code = options.code || ''
        this.status = options.statusCode || 400
    }

    toJSON() {
        let alt = {}
        let storeKey = function (key) {
            if (key === 'stack') {
                if (process.env.NODE_ENV !== 'production') {
                    alt[key] = this[key]
                }
            } else {
                alt[key] = this[key]
            }
        }
        Object.getOwnPropertyNames(this).forEach(storeKey, this)
        return alt
    }
}

if (require.main === module) {
    const payload = {
        user: 'damian@theeye.io',
        subject: "Other",
        text: "test",
        customer: "theeye-services-hub"
    }

    process.env.THEEYE_JOB_USER = JSON.stringify({
        id: '5ff31411a468c300127f3413',
        email: 'damian@theeye.io',
        username: 'damian',
        name: 'damian',
        default_language: 'es'
    })
    
    main(payload).then(console.log).catch(console.error)
}