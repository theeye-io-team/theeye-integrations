import requests
import json
from datetime import datetime
import csv
from dateutil.parser import isoparse

def convertMillis(millis):
  millis = int(millis)
  minutes = int((millis/(1000*60))%60)/60
  hours = int((millis/(1000*60*60))%24)
  total = hours + minutes
  return ('%.2f' %total).replace('.',',')

def convertTime(timestamp):
  timestamp = int(timestamp)/1000
  return datetime.utcfromtimestamp(timestamp).strftime('%H:%M:%S')

def convertStamp(date):
  return isoparse(date).timestamp()

def convertDate(timestamp):
  timestamp = int(timestamp)/1000
  return datetime.utcfromtimestamp(timestamp).strftime('%d-%m-%Y')

def main(fromDate, toDate, id, filename)
  with open('config.json', encoding='utf-8') as jsonf:
    config = json.load(jsonf)

  token = config['credenciales_click']['token']
  headers = {
    'Authorization': token
  }

  start_date = str(convertStamp(fromDate))
  end_date = str(convertStamp(toDate))
  list_id = str(id) 
  assignees = '42912747,42913437,42917149,42935313,42951995,42951996,42963494,42963495,42963497,42963500,42963502,43057293,43133669,43151767,43627923'

  request = requests.get('https://api.clickup.com/api/v2/team/30919240/time_entries?start_date='+ start_date +'&end_date='+ end_date +'&assignee='+assignees+'&include_task_tags=true&include_location_names=false&space_id=&folder_id=&list_id='+ list_id +'&custom_task_ids=false', headers=headers)
    
  response_body = request
  result = json.loads(request.content.decode('utf-8'))

  with open(filename, 'w', encoding='UTF8', newline='') as f:
    writer = csv.writer(f, delimiter=';')
    header = ['name','status','user','date','tags','start_time','end_time','duration']
    writer.writerow(header)
    for i in result['data']:
      export = []
      export.append(i['task']['name']) 
      export.append(i['task']['status']['status'])
      export.append(i['user']['username']) 
      export.append(convertDate(i['start']))
      export.append(i['tags'])
      export.append(convertTime(i['start']))
      export.append(convertTime(i['end'])) 
      export.append(convertMillis(i['duration']))
      
      writer.writerow(export)