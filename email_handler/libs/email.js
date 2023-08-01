// email.js
// Librería gestionar los envios por email

const path = require('path')
const nodemailer = require('nodemailer')
const config = require(path.join('..', 'config', 'config.json'))

exports.getEmailTransporter = () => {
    // Basic info
    let transportData = {
        host: config.output.email.host,
        port: config.output.email.port
    }

    // Authentication
    if (config.output.email.user && config.output.email.user !== "" && config.output.email.password && config.output.email.password !== "") {
        transportData.auth = {
            user: config.output.email.user,
            pass: config.output.email.password
        }
        transportData.secureConnection = false
    }

    if (config.output.email.secured && config.output.email.secured === true) {
        transportData.tls = {
            ciphers: 'SSLv3'
        }
        transportData.requireTLS = true
    }

    let transporter = nodemailer.createTransport(transportData)
    return transporter
}


exports.sendEmail = async (emailOptions) => {
    const transporter = this.getEmailTransporter()
    const info = await transporter.sendMail(emailOptions)
    return `Message sent: ${info.messageId}`
}

exports.prepareEmailOptions = (attachments, subject, body, sendTo, sendFrom = null, nameFrom = null) => {
    let resultAttachment = []
    if (!attachments) {
        resultAttachment = []
    } else {
        for (const attachment of attachments) {
            // Preparamos el attachment que puede ser
            //  1) Con content, que es un contenido binario
            //  2) Con path, que es un path absoluto
            //  3) Con Cid para poder embeberlo en el HTML 
            let attachmentData = null
            // Attachment via Content
            if (attachment.content) {
                attachmentData = {
                    filename: attachment.filename,
                    content: attachment.content
                }
            }
            // Attachment via Path
            if (attachment.path) {
                attachmentData = {
                    filename: attachment.filename,
                    path: attachment.path
                }
            }
            // Verificamos CID
            if (attachment.cid) {
                attachmentData.cid = attachment.cid
            }

            resultAttachment.push(attachmentData)
        }
    }
    sendFrom = sendFrom ? sendFrom : config.output.email.address_from
    nameFrom = nameFrom ? nameFrom : config.output.email.name_from
    
    return {
        from: `"${nameFrom}" <${sendFrom}>`,
        to: sendTo,
        cc: '',
        bcc: '',
        subject: subject,
        html: body,
        attachments: resultAttachment
    }
}