require('dotenv').config({ path: './.env' })
const webbot = require('./libs/webbot')

const main = module.exports = async () => {
  return await webbot(process.env.FERIADOS_YEAR)
}

if (require.main === module) {
  main().then(console.log).catch(console.error)
}
