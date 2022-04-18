import requests
import json
import os
import time

with open('config.json', encoding='utf-8') as jsonf:
    config = json.load(jsonf)

api_key = config['credenciales']['api_key']
domain = config['credenciales']['domain']
password = config['credenciales']['password']
dic = {}

def sort(b):
    print(b)
    for i in config['indice']:
        for x in i['bots']:
            if x.lower() == b.lower():
                print('Found: ' + x)
                temp = 'clientes/' + x + '.md'
                temp2 = i['nombre_organizacion']
                if i['nombre_organizacion'] in dic:
                    if x not in dic[temp2]:
                        dic[temp2] += [x]
                else:
                    dic[temp2] = [x]
                return(temp.replace(' ',''))

def writeMd(botName,title,bodyTxt,tktn):
    fileName = sort(botName)
    print(fileName)
    if os.path.exists(fileName):
        with open(fileName, 'r+', encoding='utf-8') as f:
            data = f.readlines()
            temp = data[0]
            data[0] = ''
            old = f.read()
            f.seek(0)
            f.write(temp)
            f.write('\n')
            f.write('>### '+ tktn +'# ' + title)
            f.write('\n')
            f.write(bodyTxt)
            f.write('\n' + old)
            f.writelines(data)
    else:
        f = open(fileName, 'a', encoding='utf-8')
        f.write('Incidentes bot: ' + botName)
        f.close()
        with open(fileName, 'r+', encoding='utf-8') as f:
            data = f.readlines()
            temp = data[0]
            data[0] = ''
            old = f.read()
            f.seek(0)
            f.write(temp)
            f.write('\n\n')
            f.write('>### '+ tktn +'# ' + title)
            f.write('\n')
            f.write(bodyTxt)
            f.write('\n\n' + old)
            f.writelines(data)

def append(i):
    r = requests.get('https://'+ domain +'.freshdesk.com/api/v2/tickets/'+ i +'/summary', auth = (api_key, password))
    n = {}
    if r.status_code == 200:
        n = requests.get('https://'+ domain +'.freshdesk.com/api/v2/tickets/'+ i +'', auth = (api_key, password))
        
    if r.status_code == 200 and n.status_code == 200:
        print ("Request processed successfully, the response is given below")
        print(n.status_code)
        print(n)
        result = json.loads(r.content.decode('utf-8'))
        body = json.loads(n.content.decode('utf-8'))
        print(result)
        txt = result['body']
        bot = body['custom_fields']['cf_bot']
        name = body['subject']
        txt = txt.replace('Diagnóstico', 'Diagnostico').replace('Solucion', 'Solución').replace('Qué hicimos', 'Que hicimos')
        txt = txt.replace('Problema:','<strong>Problema:</strong>').replace('Diagnostico:','<strong>Diagnostico:</strong>').replace('Solución:','<strong>Solución:</strong>').replace('Que hicimos:','<strong>Que hicimos:</strong>')
        try:
            useless = sort(bot)
            writeMd(bot, name, txt, i)
        except:
            pass
    else:
        print ("Failed to read tickets, status Code : " + str(r.status_code))

for f in os.listdir('clientes/'):
    os.remove(os.path.join('clientes/',f))

if config['modo_update']['modo'] == 'RANGO':
    mini = config['modo_update']['min']
    maxi = config['modo_update']['max']
    for i in range(mini,maxi):
        print(i)
        append(str(i))
        time.sleep(2)
elif config['modo_update']['modo'] == 'LISTA':
    for i in config['modo_update']['tickets']:
        print(i)
        append(str(i))
        time.sleep(2)

with open('_sidebar.md', 'r+', encoding='utf-8') as s:
    s.truncate(0)
    for d in dic:
        s.write('* ' + d)
        s.write('\n')
        for l in dic[d]:
            s.write('   - [- '+ l +'](clientes/'+ l.replace(' ','') +'.md)')
            s.write('\n')
print(dic)
