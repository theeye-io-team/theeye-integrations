require('dotenv').config({ path: './.env' })
const {checkForChanges} = require('./libs/helpers')


const main = module.exports = async (feriados) => {
  return await checkForChanges(feriados)
}

if (require.main === module) {
  const payload = [
    '01-01-2023', '20-02-2023',
    '21-02-2023', '24-03-2023',
    '02-04-2023', '06-04-2023',
    '07-04-2023', '01-05-2023',
    '25-05-2023', '26-05-2023',
    '17-06-2023', '20-06-2023',
    '19-06-2023', '09-07-2023',
    '21-08-2023', '17-08-2023',
    '08-08-2023', '13-10-2023',
    '16-10-2023', '12-10-2023',
    '10-10-2023', '20-11-2023',
    '08-12-2023', '25-12-2023'
  ]
  main(payload).then(console.log).catch(console.error)
}
