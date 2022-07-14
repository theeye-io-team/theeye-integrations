import requests
import json
import os

def main(folderId, id, name, group):
  with open('config.json', encoding='utf-8') as jsonf:
    config = json.load(jsonf)

  token = os.environ.get('CLICKUP_TOKEN')

  headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }

  listas = {}

  request_list = requests.get('https://api.clickup.com/api/v2/folder/'+folderId+'/list', headers=headers)
  
  result_list = json.loads(request_list.content.decode('utf-8'))

  for i in result_list['lists']:
    listas[i['name']] = i['id']

  subject = id +' - '+ name #webhook
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