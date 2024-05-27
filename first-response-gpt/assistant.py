from openai import OpenAI
import traceback
import requests
import time
import json
import os

with open(os.environ['CONFIG_PATH']) as config_file:
  config = json.load(config_file)

client = OpenAI(api_key=os.environ['API_KEY'])
gchat_url = os.environ['GCHAT_URL']

def runThread(assistant_id, data):
  # Step 1: Create a Thread
  thread = client.beta.threads.create()

  # Step 2: Add a Message to a Thread
  message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content=data
  )

  # Step 3: Run the Assistant
  run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant_id
  )

  # Step 4: Wait for the run to be completed
  limit = 0
  while True and limit < 30:
    run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
    if run_status.status == "completed":
        break
    elif run_status.status == "failed":
        print("Run failed:", run_status.last_error)
        break
    limit += 1
    print('esperando... ' + str(limit))
    time.sleep(2)  # wait for 2 seconds before checking again

  # Step 5: Parse the Assistant's Response and Print the Results
  messages = client.beta.threads.messages.list(
    thread_id=thread.id
  )

  # Step 6: Delete the thread
  thread = client.beta.threads.delete(thread.id)

  output = ''
  for message in reversed(messages.data):
    role = message.role
    for content in message.content:
      if content.type == 'text' and role == 'assistant':
        output = content.text.value
        
  print(f'\nrequest: {output}')

  return output

def sendResponse(res, ticket_id):
  url = gchat_url + '&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD'
  text = 'Posible primera respuesta para el ticket: \n' + res
  values = json.dumps({ "text": text, "thread": {"threadKey": str(ticket_id)} })
  headers = {'Accept': 'application/json','Content-Type': 'application/json'}
  req = requests.post(url, data=values, headers=headers)
  print(req)
  return req

def main(payload):
  assistants = config['assistants']
  assist_id = ''

  print(assistants)
  if not config['always_default']:
    for key in assistants:
      if key in payload['freshdesk_webhook']['ticket_company_name'].lower():
        assist_id = assistants[key]

  if assist_id == '': assist_id = assistants['default']

  print('assistant:', assist_id)
  try:
    gpt_res = runThread(assist_id, payload['freshdesk_webhook']['ticket_description'])
    sendResponse(gpt_res, payload['freshdesk_webhook']['ticket_id'])
  except:
    traceback.print_exc()

if __name__ == "__main__":
  payload = {"freshdesk_webhook":{"ticket_id":3695,"ticket_subject":"Prueba segunda parte","ticket_status":"Open","ticket_source":"Phone","ticket_company_name":"Banco Comafi","ticket_description":"<div style=\"font-family:-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif; font-size:14px\">\n<div dir=\"ltr\">estas tareas nunca se ejecutaron<br>y el resto de los workflows nunca iniciarion<br>estan reclamando justo por comprobantes del 17 cuando dejo de funcionar<br><br>Santiago Laplume<br>,<br>12:42 PM<br>, Edited<br>como si el agente nunca las hubiese tomado, el monitor está up</div>\n<div dir=\"ltr\"><br></div>\n<div dir=\"ltr\"><img src=\"https://attachment.freshdesk.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NzAwOTQwNjc2MTksImRvbWFpbiI6InRoZWV5ZS5mcmVzaGRlc2suY29tIiwiYWNjb3VudF9pZCI6MTg4Nzg3NH0.jDPPQe5mcPU0fSW4OEbiZ0fw0sjiWxWK6ZO8-klqihs\" style=\"width: auto\" class=\"fr-fic fr-fil fr-dib\" data-id=\"70094067619\"></div>\n<div dir=\"ltr\">\n<br>evo ticket 3687 en freshdesk. asunto: ERROR CEDEARS<br><br>Freshdesk - TheEye, App<br>,<br>Fri 1:59 PM<br>nuevo ticket 3688 en freshdesk. asunto: RE: [EXT] Re: Central de pasajes - no reconoce ninguna plantilla DIGITAI - ERP<br><br><br>Freshdesk - TheEye, App<br>,<br>Fri 4:21 PM<br>nuevo ticket 3689 en freshdesk. asunto: RV: PROVINCIA: </div>\n</div>"}}
  main(payload)