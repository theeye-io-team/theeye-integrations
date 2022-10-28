import requests
import json
import os

def main(txt):
    values = json.dumps({"text":txt})

    r = requests.post('https://chat.googleapis.com/v1/spaces/AAAAvjrZDUg/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=kaz0WhhbIy3KLkH4TkGc3jbmU9h82XcA4TuFCo2sEpw%3D', data=values)