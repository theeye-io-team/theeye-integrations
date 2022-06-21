import requests
import json
import sys

def successOutput (data):
  output = { "state": "success", "data": data }
  print(json.dumps(output))
  pass

def failureOutput (error):
  output = {
    "state": "failure",
    "data": {
      "message": str(error),
      "type": str(type(error))
    }
  }
  print(json.dumps(output))
  pass

# captura global de los errores
# si tu script falla en cualquier momento , tenes que capturar el error y devolverlo con la funcion 
# failureOutput(err)

def main (args):
  with open('config.json', encoding='utf-8') as jsonf:
    config = json.load(jsonf)

  api_key = config['credenciales_fresh']['api_key']
  domain = config['credenciales_fresh']['domain']
  password = config['credenciales_fresh']['password']
  token = config['credenciales_click']['token']

  headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }

  listas = {}

  request_list = requests.get('https://api.clickup.com/api/v2/folder/98790471/list', headers=headers)
  
  result_list = json.loads(request_list.content.decode('utf-8'))

  for i in result_list['lists']:
    listas[i['name']] = i['id']

  subject = str(ticket['id']) +' - '+ ticket['subject'] #webhook
  tag = ticket['tags'][0] #webhook
  bot = ticket['custom_fields']['cf_bot'].lower() #webhook
  goto = ''

  if 'COMAFI' in tag:
    for i in listas:
      if bot in i.lower():
        goto = listas[i]
  else:
    for i in listas:
      if tag in i:
        goto = listas[i]


  values = json.dumps({
      "name": subject,
      "description": "New Task Description",
      "assignees": [

      ],
      "status": "Open",
      "priority": None,
      "due_date_time": False,
      "time_estimate": 8640000,
      "start_date": 1567780450202,
      "start_date_time": False,
      "notify_all": True,
      "check_required_custom_fields": False
  })

  request = requests.post('https://api.clickup.com/api/v2/list/'+ goto +'/task', data=values, headers=headers)

  response_body = request
  result = json.loads(request.content.decode('utf-8'))
  print(response_body)
  print(result)
  
  return args

try:
  result = main(sys.argv)
  successOutput(result)

except Exception as error:
  failureOutput(error)
