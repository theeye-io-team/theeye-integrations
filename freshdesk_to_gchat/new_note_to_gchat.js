const axios = require('axios')

const main = module.exports = async (data) => {
  const payload = data
  console.log(payload)

  const { ticket_id, latest_public_comment } = payload.freshdesk_webhook

  const url = process.env.GCHAT_WEBHOOK_URL + '&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD'
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  const thread_id = ticket_id.toString()
  
  const body = JSON.stringify({ text: latest_public_comment, thread: {"threadKey":thread_id} })
  const res = await axios.post(url, thread_body, { headers: headers})
  console.log(res)
}

if(require.main === module) {
  main(data).then(console.log).catch(console.error)
}
