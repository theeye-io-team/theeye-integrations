import requests
import json
import os

def updateTicket(url, id):
  api_key = os.environ.get('FRESHDESK_KEY')
  password = 'x'
  headers = {
      "Content-Type": "application/json" 
  }
  query = '{ "custom_fields" : { "cf_si": "'+url+'"} }'
  
  r = requests.put('https://theeye.freshdesk.com/api/v2/tickets/' + str(id), auth = (api_key, password), data = query, headers=headers)


def main(id, name, group, source):
  token = os.environ.get('CLICKUP_TOKEN')
  folderId = os.environ.get('FOLDER_ID')

  headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }

  listas = {}

  request_list = requests.get('https://api.clickup.com/api/v2/folder/'+folderId+'/list', headers=headers)
  
  result_list = json.loads(request_list.content.decode('utf-8'))

  for i in result_list['lists']:
    listas[i['name']] = i['id']

  if group == 'Banco Comafi' and source == 'Email':
    return None

  subject = str(id) +' - '+ str(name) 
  goto = ''

  for i in listas:
    if i.lower() in group.lower():
      goto = listas[i]

  values = json.dumps({
      "name": subject,
      "description": "New Task Description",
      "assignees": [

      ],
      'tags': [
        {
          'name': 'soporte',
          'tag_fg': '#FF4081',
          'tag_bg': '#FF4081',
          'creator': 42935313
        }
      ],
      "status": "Open",
      "priority": None,
      "due_date_time": False,
      "start_date_time": False,
      "notify_all": True,
      "check_required_custom_fields": False
  })

  request = requests.post('https://api.clickup.com/api/v2/list/'+ goto +'/task', data=values, headers=headers)

  result = json.loads(request.content.decode('utf-8'))
  url = result['url']

  updateTicket(url, id)