import requests, time, os
base='http://127.0.0.1:5000'
# wait for server ready
for i in range(20):
    try:
        r = requests.get(base + '/health', timeout=1)
        if r.ok:
            print('health:', r.json())
            break
    except Exception as e:
        print('waiting for server...', i)
        time.sleep(1)
# send tts request
payload = {'text': 'नमस्ते, मेरा नाम चाचा चौधरी है', 'lang': 'hi-IN'}
try:
    r = requests.post(base + '/tts', json=payload, timeout=60)
    print('status', r.status_code, 'X-TTS-Engine=', r.headers.get('X-TTS-Engine'))
    out = 'Data/gtts_py.mp3'
    with open(out, 'wb') as f:
        f.write(r.content)
    print('Saved', out, 'size', os.path.getsize(out))
except Exception as e:
    print('Request failed', e)
