import requests
import json
import os
from datetime import datetime

api_key = os.environ.get('FRESHDESK_KEY')
domain = os.environ.get('FRESHDESK_DOMAIN')
password = os.environ.get('FRESHDESK_PSW')

def get_last_conversation_info(ticket_id):
    """Obtiene información de la última conversación de un ticket"""
    url = f'https://{domain}.freshdesk.com/api/v2/tickets/{ticket_id}/conversations'
    response = requests.get(url, auth=(api_key, password))

    if response.status_code == 200:
        conversations = response.json()
        if conversations:
            # La API devuelve ordenado de más antiguo a más nuevo, tomamos el último
            last_conv = conversations[-1]
            created_at = datetime.fromisoformat(last_conv['created_at'].replace('Z', '+00:00'))
            now = datetime.now(created_at.tzinfo)
            days_since = (now - created_at).days
            # incoming=True significa que viene del cliente
            origin = "Cliente" if last_conv.get('incoming', False) else "Soporte"
            return days_since, origin
    return None, None 

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

def main():
    output = ''
    if r.status_code == 200:
        result = json.loads(r.content.decode('utf-8'))
        txt = result
        for i in result['results']:
            temp = ''
            for x in status:
                if x == i['status']:
                    temp = status[x] 
            days_since, origin = get_last_conversation_info(i['id'])
            conv_info = ''
            if days_since is not None:
                conv_info = f' - {days_since}d ({origin})'

            ticket_line = i['subject'] + ' - #' + str(i['id']) + ' - ' + temp + conv_info
            if i['custom_fields']['cf_owner'] in tktList:
                tktList[i['custom_fields']['cf_owner']] += [ticket_line]
            else:
                tktList[i['custom_fields']['cf_owner']] = [ticket_line]
            
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

# Descomentar para ejecutar de prueba
# if __name__ == '__main__':
#     print(main())
