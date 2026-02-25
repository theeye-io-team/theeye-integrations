import requests
import json
import os
import re

token = os.environ.get('CLICKUP_TOKEN')

STATUS_MAP = {
    'resuelto': 'ready to test',
    'en proceso': 'in progress',
    'pruebas usuarios': 'in progress',
    'reabierto': 'in progress',
    'waiting on customer': 'in progress',
    'pendiente': 'open',
    'abierto': 'open',
}

def extract_task_id(url):
    match = re.search(r'/t/([a-zA-Z0-9]+)', url)
    return match.group(1) if match else None

def find_matching_status(freshdesk_status, clickup_statuses):
    freshdesk_lower = freshdesk_status.lower()
    mapped = STATUS_MAP.get(freshdesk_lower)

    if mapped:
        for s in clickup_statuses:
            if s['status'].lower() == mapped:
                return s['status']

    for s in clickup_statuses:
        if s['status'].lower() == freshdesk_lower:
            return s['status']

    for s in clickup_statuses:
        clickup_lower = s['status'].lower()
        if freshdesk_lower in clickup_lower or clickup_lower in freshdesk_lower:
            return s['status']

    return None

def main(status, cf_si):
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    task_id = extract_task_id(cf_si)
    if not task_id:
        print(f"Error: no se pudo extraer task ID de la URL: {cf_si}")
        return

    task_response = requests.get(
        f'https://api.clickup.com/api/v2/task/{task_id}',
        headers=headers
    )
    task_data = json.loads(task_response.content.decode('utf-8'))

    list_id = task_data['list']['id']

    list_response = requests.get(
        f'https://api.clickup.com/api/v2/list/{list_id}',
        headers=headers
    )
    list_data = json.loads(list_response.content.decode('utf-8'))

    clickup_statuses = list_data['statuses']

    matched_status = find_matching_status(status, clickup_statuses)
    if not matched_status:
        available = [s['status'] for s in clickup_statuses]
        print(f"Error: no se encontró un status similar a '{status}'. Disponibles: {available}")
        return

    update_response = requests.put(
        f'https://api.clickup.com/api/v2/task/{task_id}',
        data=json.dumps({'status': matched_status}),
        headers=headers
    )
    result = json.loads(update_response.content.decode('utf-8'))

    print(f"Task {task_id} actualizado a status '{matched_status}'")
    return result
