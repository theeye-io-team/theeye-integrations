import requests
import json
import os
import re

token = os.environ.get('CLICKUP_TOKEN')
folder_id = os.environ.get('FOLDER_ID')
api_key = os.environ.get('FRESHDESK_KEY')
password = os.environ.get('FRESHDESK_PASS')

skip_patterns = re.compile(
    r'(out of office|fuera de oficina|vacaciones|ooo|no reply|noreply|respuesta autom[aá]tica|automatic reply|auto.?reply)',
    re.IGNORECASE
)

members_path = os.path.join(os.path.dirname(__file__), 'members.json')
with open(members_path) as f:
    members_data = json.load(f)

members_by_email = {}
for m in members_data['members']:
    members_by_email[m['email']] = m['id']

service_tag_map = {
    'concilia': 'concilia',
    'digitai': 'digitai',
    'rpa': 'rpa',
    'approvals': 'approvals',
}

service_assignee_rules = [
    ('concilia', ['guidoher@theeye.io', 'agustin.demarco@theeye.io']),
    ('approvals', ['damian@theeye.io']),
]

group_assignee_rules = [
    ('newsan', ['santiago.laplume@theeye.io', 'agustin.demarco@theeye.io']),
    ('exolgan', ['agustin.demarco@theeye.io', 'facugon@theeye.io']),
    ('kavak', ['santiago.laplume@theeye.io', 'maria@theeye.io']),
    ('la segunda', ['facugon@theeye.io', 'maria@theeye.io']),
    ('rapicuotas', ['guidoher@theeye.io', 'agustin.demarco@theeye.io']),
    ('kompass', ['guidoher@theeye.io']),
    ('corteva', ['guidoher@theeye.io']),
    ('nxt', ['agustin.demarco@theeye.io']),
    ('vetanco', ['santiago.laplume@theeye.io', 'damian@theeye.io']),
    ('consorcio abierto', ['facugon@theeye.io', 'maria@theeye.io']),
    ('abbfpw', ['santiago.laplume@theeye.io', 'agustin.demarco@theeye.io'])
]

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

def get_assignees(servicio, group):
  default_uid = members_by_email.get('agustin.demarco@theeye.io')
  assignee_ids = [default_uid] if default_uid else []
  servicio_lower = servicio.lower()
  group_lower = group.lower()

  for keyword, emails in service_assignee_rules:
    if keyword in servicio_lower:
      for email in emails:
        uid = members_by_email.get(email)
        if uid and uid not in assignee_ids:
          assignee_ids.append(uid)

  for keyword, emails in group_assignee_rules:
    if keyword in group_lower:
      for email in emails:
        uid = members_by_email.get(email)
        if uid and uid not in assignee_ids:
          assignee_ids.append(uid)

  return assignee_ids

def get_tags(servicio):
  tags = [
    {
      'name': 'soporte',
      'tag_fg': '#FF4081',
      'tag_bg': '#FF4081',
      'creator': 42935313
    }
  ]
  servicio_lower = servicio.lower()
  for keyword, tag_name in service_tag_map.items():
    if keyword in servicio_lower:
      tags.append({'name': tag_name})
  return tags

def main(id, name, group, source, servicio):
  if skip_patterns.search(name):
    return None

  if group == 'Banco Comafi' and source == 'Email':
    return None

  headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }
  description = get_description(id)
  clickup_folder = {}
  subject = str(id) +' - '+ str(name)

  request_list = requests.get('https://api.clickup.com/api/v2/folder/'+folder_id+'/list', headers=headers)

  result_list = json.loads(request_list.content.decode('utf-8'))

  for i in result_list['lists']:
    clickup_folder[i['name']] = i['id']

  company_folder = clickup_folder['Default']

  assignees = get_assignees(servicio, group)
  tags = get_tags(servicio)

  values = json.dumps({
      "name": subject,
      "description": description,
      "assignees": assignees,
      'tags': tags,
      "status": None,
      "priority": None,
      "due_date_time": False,
      "start_date_time": False,
      "notify_all": True,
      "check_required_custom_fields": False,
      "custom_fields": [
          {
              "id": "3fad5160-2049-4e74-ad6b-ea6a13f2f1aa",
              "value": group
          },
          {
              "id": "3f7c2ea7-03a1-4d09-b6b7-37879f1c2be5",
              "value": "https://theeye.freshdesk.com/a/tickets/" + str(id)
          }
      ]
  })

  request = requests.post('https://api.clickup.com/api/v2/list/'+ company_folder +'/task', data=values, headers=headers)

  result = json.loads(request.content.decode('utf-8'))
  url = result['url']

  updateTicket(url, id)
