const path = require('path')
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

const handleWhitelabelAddress = () => {
    const whitelabel = config.output.email_contact_us.whitelabel_url

    for(const {url,address_to} of whitelabel) 
        if(url === processParams.origin) return address_to

    // Fallback
    return config.output.email_contact_us.address_to
}

const validateParams = async () => {

    if (!processParams.text || !processParams.subject || !processParams.access_token) throw new Error('Missing text/subject/token')

    try {
        const session = await axios({
            method: 'get',
            url: 'https://app.theeye.io/api/session/profile',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': `Bearer ${processParams.access_token}`
            }
        })

        return session.data
    } catch (err) {
        throw new Error('invalid session token')
    }

}

const main = module.exports = async (payload) => {
    let userData

    // Validación de parámetros
    try {
        processParams = payload
        userData = await validateParams()
    } catch (err) {
        throw new ClientError(err, { statusCode: 400 })
    }

    userData.name = userData.username || userData.email
    userData.default_language = 'es'

    const attachments = [{
        filename: 'TheEye_isologotipo.png',
        path: path.join(process.env.BASE_PATH, 'templates', 'images', 'TheEye_isologotipo.png'),
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
        handleWhitelabelAddress()
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
        user: "damian",
        subject: "Other",
        text: "sadsafsafsaf",
        customer: "theeye-services-hub",
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhbWlhbkB0aGVleWUuaW8iLCJ1c2VybmFtZSI6ImRhbWlhbiIsInVzZXJfaWQiOiI1ZmYzMTQxMWE0NjhjMzAwMTI3ZjM0MTMiLCJvcmdfdXVpZCI6InRoZWV5ZS1zZXJ2aWNlcy1odWIiLCJpYXQiOjE2OTEwODQ5MDksImV4cCI6MTY5MTE3MTMwOX0.GNhIGrutR1WSklTovtAXmGGn71n-PdudMTV3IgPTzOQ",
        origin: "https://tr-digitai.theeye.io"
    }

    main(payload).then(console.log).catch(console.error)
}