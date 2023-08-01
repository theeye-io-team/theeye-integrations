const fs = require('fs')
const Handlebars = require('handlebars')
const i18next = require('i18next')
const HandlebarsI18n = require("handlebars-i18n")
const translationTemplate = require('../templates/translation.json')

const TEMPLATE_EMAILS_REGISTRATION_CONTACT_US_CUSTOMER = 'template-emails-registration-contact-us-customer.html'
const TEMPLATE_EMAILS_REGISTRATION_CONTACT_US_THEEYE = 'template-emails-registration-contact-us-theeye.html'

// CONTACT US - CUSTOMER
exports.generateHtmlRegistrationContactUsCustomer = (userData, subject, text, language) => {
    i18next.init(translationTemplate)
    HandlebarsI18n.init()
    // SI HAY UN CONFIGURE, VA ACA
    const htmlTemplate = fs.readFileSync(`../templates/${TEMPLATE_EMAILS_REGISTRATION_CONTACT_US_CUSTOMER}`, "utf8")
    let compiled = Handlebars.compile(htmlTemplate)
    i18next.changeLanguage(language)

    const data = {
        userName: userData.name,
        subject: subject,
        text: text
    }
    const htmlResults = compiled(data)
    return htmlResults
}

// CONTACT US - THEEYE
exports.generateHtmlRegistrationContactUsTheEye = (userData, subject, text, language) => {
    i18next.init(translationTemplate)
    HandlebarsI18n.init()
    // SI HAY UN CONFIGURE, VA ACA
    const htmlTemplate = fs.readFileSync(`../templates/${TEMPLATE_EMAILS_REGISTRATION_CONTACT_US_THEEYE}`, "utf8")
    let compiled = Handlebars.compile(htmlTemplate)
    i18next.changeLanguage(language)

    const data = {
        name: userData.name,
        userName: userData.username,
        subject: subject,
        text: text
    }
    const htmlResults = compiled(data)
    return htmlResults
}