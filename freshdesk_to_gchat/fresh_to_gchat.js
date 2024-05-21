const axios = require('axios')
const { convert } = require('html-to-text');
const moment = require('moment')

const main = module.exports = async () => {
  const payload = JSON.parse(process.argv[2])
  console.log(payload)

  const { ticket_id, ticket_status, ticket_subject, ticket_description } = payload.freshdesk_webhook

  const thread_text = convert(ticket_description, {
    wordwrap: false
  });

  const url = process.env.GCHAT_WEBHOOK_URL + '&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD'
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  const thread_id = moment().toISOString()

  const body = JSON.stringify({ text: `nuevo ticket ${ticket_id} en freshdesk. asunto: ${ticket_subject}`, thread: {"threadKey":thread_id}})
  await axios.post(url, body, { headers: headers})
  
  const thread_body = JSON.stringify({ text: thread_text, thread: {"threadKey":thread_id} })
  await axios.post(url, thread_body, { headers: headers})
}

if(require.main === module) {
  main().then(console.log).catch(console.error)
}
