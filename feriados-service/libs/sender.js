require('dotenv').config({ path: '../.env' })

const Files = require('/.file')
const nodemailer = require('nodemailer')
const senderConfig = require('../config/mailbot-transport.json')

Files.access_token = process.env.SERVICES_HUB_TOKEN

const main = module.exports = async (bcc) => {
  const files = await Files.GetByFilename('feriados.json')
    const fileContent = await Files.Download(files[0].id)

    const transport = nodemailer.createTransport(senderConfig.transport)
    console.log('sending email')
    return await transport.sendMail({
      from: senderConfig.from,
      subject: 'Actualizacion de Feriados',
      bcc,
      html: JSON.stringify(fileContent)
    })
}

if(require.main === module) {
    main(process.argv[2]).then(console.log).catch(console.error)
}
