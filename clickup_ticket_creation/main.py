import requests
import json
import os

token = os.environ.get('CLICKUP_TOKEN')
folder_id = os.environ.get('FOLDER_ID')
api_key = os.environ.get('FRESHDESK_KEY')
password = os.environ.get('FRESHDESK_PASS')

def updateTicket(url, id):
  headers = {
    "Content-Type": "application/json" 
  }
  query = '{ "custom_fields" : { "cf_si": "'+url+'"} }'
  
  r = requests.put('https://theeye.freshdesk.com/api/v2/tickets/' + str(id), auth = (api_key, password), data = query, headers=headers)

def get_description(id):
  headers = {
    "Content-Type": "application/json" 
  }

  r = requests.get('https://theeye.freshdesk.com/api/v2/tickets/' + str(id), auth = (api_key, password), headers=headers)
  result = json.loads(r.content.decode('utf-8'))
  
  return result['description_text']

def main(id, name, group, source):
  if group == 'Banco Comafi' and source == 'Email': 
    return None

  headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }
  description = get_description(id)
  clickup_folder = {}
  company_folder = ''
  subject = str(id) +' - '+ str(name) 

  request_list = requests.get('https://api.clickup.com/api/v2/folder/'+folder_id+'/list', headers=headers)
  
  result_list = json.loads(request_list.content.decode('utf-8'))
  
  for i in result_list['lists']:
    clickup_folder[i['name']] = i['id']

  for i in clickup_folder:
    if i.lower() in group.lower():
      company_folder = clickup_folder[i]

  if company_folder == '': 
    company_folder = clickup_folder['Default'] 

  values = json.dumps({
      "name": subject,
      "description": description,
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
      "status": None,
      "priority": None,
      "due_date_time": False,
      "start_date_time": False,
      "notify_all": True,
      "check_required_custom_fields": False
  })

  request = requests.post('https://api.clickup.com/api/v2/list/'+ company_folder +'/task', data=values, headers=headers)

  result = json.loads(request.content.decode('utf-8'))
  url = result['url']

  updateTicket(url, id)