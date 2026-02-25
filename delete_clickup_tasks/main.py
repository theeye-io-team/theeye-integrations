import requests
import json
import os
import re
from datetime import datetime, timezone, timedelta

token = os.environ.get('CLICKUP_TOKEN')
folder_id = os.environ.get('FOLDER_ID')
api_key = os.environ.get('FRESHDESK_KEY')
password = os.environ.get('FRESHDESK_PASS')

FRESHDESK_BASE = 'https://theeye.freshdesk.com'
CLICKUP_LIST_ID = '901402604789'

ticket_id_pattern = re.compile(r'^(\d+)\s+-\s+')


def get_deleted_ticket_ids(days_back):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    ticket_ids = []
    page = 1

    while True:
        url = f'{FRESHDESK_BASE}/api/v2/tickets?filter=deleted&per_page=100&page={page}'
        r = requests.get(url, auth=(api_key, password))
        r.raise_for_status()
        tickets = r.json()

        if not tickets:
            break

        for ticket in tickets:
            updated_at = datetime.fromisoformat(ticket['updated_at'].replace('Z', '+00:00'))
            if updated_at >= cutoff:
                ticket_ids.append(ticket['id'])

        if len(tickets) < 100:
            break

        page += 1

    return ticket_ids


def get_merged_ticket_ids(days_back):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    cutoff_str = cutoff.strftime('%Y-%m-%d')
    ticket_ids = []
    page = 1

    while True:
        query = f'"tag:\'merged\' AND updated_at:>\'{cutoff_str}\'"'
        url = f'{FRESHDESK_BASE}/api/v2/search/tickets?query={query}&page={page}'
        r = requests.get(url, auth=(api_key, password))
        r.raise_for_status()
        data = r.json()
        results = data.get('results', [])

        for ticket in results:
            ticket_ids.append(ticket['id'])

        if len(results) < 30:
            break

        page += 1

    return ticket_ids


def get_clickup_tasks():
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    task_map = {}
    page = 0

    while True:
        url = f'https://api.clickup.com/api/v2/list/{CLICKUP_LIST_ID}/task?include_closed=true&page={page}'
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.json()
        tasks = data.get('tasks', [])

        if not tasks:
            break

        for task in tasks:
            match = ticket_id_pattern.match(task['name'])
            if match:
                tid = int(match.group(1))
                task_map[tid] = task['id']

        if len(tasks) < 100:
            break

        page += 1

    return task_map


def delete_clickup_task(task_id):
    headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    url = f'https://api.clickup.com/api/v2/task/{task_id}'
    r = requests.delete(url, headers=headers)
    r.raise_for_status()


def main(days_back=7):
    print(f'Fetching deleted Freshdesk tickets from the last {days_back} days...')
    deleted_ids = get_deleted_ticket_ids(days_back)
    print(f'Found {len(deleted_ids)} deleted tickets')

    print(f'Fetching merged Freshdesk tickets from the last {days_back} days...')
    merged_ids = get_merged_ticket_ids(days_back)
    print(f'Found {len(merged_ids)} merged tickets')

    all_ids = list(set(deleted_ids + merged_ids))
    print(f'Total unique tickets to process: {len(all_ids)}')

    print('Fetching ClickUp tasks from list Default...')
    task_map = get_clickup_tasks()
    print(f'Found {len(task_map)} tasks with ticket IDs in ClickUp')

    deleted = []
    not_found = []
    errors = []

    for ticket_id in all_ids:
        if ticket_id not in task_map:
            not_found.append(ticket_id)
            print(f'[NOT FOUND] Ticket {ticket_id} has no matching ClickUp task')
            continue

        task_id = task_map[ticket_id]
        try:
            delete_clickup_task(task_id)
            deleted.append(ticket_id)
            print(f'[DELETED] Ticket {ticket_id} -> ClickUp task {task_id}')
        except Exception as e:
            errors.append({'ticket_id': ticket_id, 'task_id': task_id, 'error': str(e)})
            print(f'[ERROR] Ticket {ticket_id} -> ClickUp task {task_id}: {e}')

    summary = {
        'deleted': deleted,
        'not_found': not_found,
        'errors': errors
    }
    print(f'\nSummary: {len(deleted)} deleted, {len(not_found)} not found, {len(errors)} errors')
    return summary


if __name__ == '__main__':
    main()
