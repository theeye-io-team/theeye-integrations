const axios = require('axios')
const { convert } = require('html-to-text');
const moment = require('moment')

const main = module.exports = async (data) => {
  const payload = data
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
  const main_res = await axios.post(url, body, { headers: headers})
  console.log(main_res)
  
  const thread_body = JSON.stringify({ text: thread_text, thread: {"threadKey":thread_id} })
  const thread_res = await axios.post(url, thread_body, { headers: headers})
  console.log(thread_res)
}

if(require.main === module) {
  main(data).then(console.log).catch(console.error)
}
