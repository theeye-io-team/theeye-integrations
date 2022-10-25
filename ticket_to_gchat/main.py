import requests
import json
import os

api_key = os.environ.get('FRESHDESK_KEY') 
domain = os.environ.get('FRESHDESK_DOMAIN') 
password = os.environ.get('FRESHDESK_PSW') 

# Abierto (2) | Pendiente (3) | Resuelto (4) | Closed (5) | Waiting on customer (6) | En proceso (8) | Pruebas usuarios (9) | 
status = {
    1:'Abierto',
    3:'Pendiente',
    4:'Resuelto',
    6:'Waiting on customer',
    8:'En proceso',
    9:'Pruebas usuarios'
}

r = requests.get('https://'+ domain +'.freshdesk.com/api/v2/search/tickets?query="status:2%20OR%20status:4%20OR%20status:6%20OR%20status:8%20OR%20status:9%20OR%20status:3"', auth = (api_key, password))

tktList = {}
output = ''

def main():
    if r.status_code == 200:
        result = json.loads(r.content.decode('utf-8'))
        txt = result
        for i in result['results']:
            temp = ''
            for x in status:
                if x == i['status']:
                    temp = status[x] 
            if i['custom_fields']['cf_owner'] in tktList:
                tktList[i['custom_fields']['cf_owner']] += [i['subject'] + ' - #' + str(i['id']) + ' - ' + temp]
            else:
                tktList[i['custom_fields']['cf_owner']] = [i['subject'] + ' - #' + str(i['id']) + ' - ' + temp]
            
        for x in tktList:
            output += ('<*'+str(x)+'*>')
            output += '\n'
            for y in tktList[x]:
                output += str(y)
                output += '\n'
    else:
        print ("Failed to read tickets, errors are displayed below,")
        print ("Status Code : " + str(r.status_code))
    return output