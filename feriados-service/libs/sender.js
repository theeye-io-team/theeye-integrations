require('dotenv').config({ path: '../.env' })

const nodemailer = require('nodemailer')
const senderConfig = require('../config/mailbot-transport.json')

const main = module.exports = async (bcc, content) => {

  const transport = nodemailer.createTransport(senderConfig.transport)
  console.log('sending email')
  return await transport.sendMail({
    from: senderConfig.from,
    subject: 'Actualizacion de Feriados',
    bcc,
    html: JSON.stringify(content)
  })
}

if(require.main === module) {
    main(process.argv[2]).then(console.log).catch(console.error)
}
