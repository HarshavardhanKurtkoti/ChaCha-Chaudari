import os
import asyncio
import time
from dotenv import dotenv_values
from flask import current_app

env_vars = dotenv_values('.env')

# Optional: Selenium imports are heavy; only import when used
def _ensure_selenium_imports():
    global webdriver, By, Service, Options, ChromeDriverManager
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from webdriver_manager.chrome import ChromeDriverManager
    return webdriver, By, Service, Options, ChromeDriverManager


async def _edge_save(text: str, voice: str | None, out_path: str):
    # Lazy import to avoid startup cost
    import edge_tts
    voice_name = voice or (env_vars.get('AssistantVoice') or os.environ.get('AssistantVoice'))
    # Use a slightly slower default rate to improve clarity; pitch adjusted mildly
    communicate = edge_tts.Communicate(text, voice_name or '', pitch='-2Hz', rate='-15%')
    await communicate.save(out_path)


def tts_edge_sync(text: str, out_path: str = None, voice: str | None = None) -> str:
    out_path = out_path or os.path.join(os.getcwd(), 'Data', 'speech_fast.mp3')
    # ensure dir
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    # run async save
    try:
        if os.path.exists(out_path):
            os.remove(out_path)
    except Exception:
        pass
    asyncio.run(_edge_save(text, voice, out_path))
    return out_path


# --- Local basic TTS using system voices (offline) ---
def tts_local_basic(text: str, out_path: str | None = None, voice: str | None = None, rate: int | None = None) -> str:
    """Synthesize speech using pyttsx3 and save to WAV.
    - Works offline using OS voices (SAPI on Windows, NSSpeechSynthesizer on macOS, eSpeak on Linux).
    - If voice is provided (engine name/id), we try to select it; otherwise default.
    - Returns the absolute output file path.
    """
    import pyttsx3  # local import to avoid startup cost
    out_path = out_path or os.path.join(os.getcwd(), 'Data', 'speech_basic.wav')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    engine = pyttsx3.init()
    try:
        if rate is not None:
            engine.setProperty('rate', rate)
        if voice:
            # try to match either by id or by name substring
            try:
                engine.setProperty('voice', voice)
            except Exception:
                for v in engine.getProperty('voices'):
                    nm = getattr(v, 'name', '') or ''
                    if voice.lower() in nm.lower():
                        engine.setProperty('voice', v.id)
                        break
        engine.save_to_file(text, out_path)
        engine.runAndWait()
    finally:
        try:
            engine.stop()
        except Exception:
            pass
    return out_path


def list_local_basic_voices():
    """Return a minimal list of available local voices via pyttsx3.
    Each entry: { id, name, languages? }
    """
    import pyttsx3
    engine = pyttsx3.init()
    items = []
    try:
        for v in engine.getProperty('voices'):
            try:
                # SAPI on Windows exposes attributes id, name; languages may be bytes
                langs = []
                l = getattr(v, 'languages', None)
                if isinstance(l, (list, tuple)) and l:
                    try:
                        langs = [bytes(x).decode('utf-8', errors='ignore') if isinstance(x, (bytes, bytearray)) else str(x) for x in l]
                    except Exception:
                        langs = [str(x) for x in l]
                items.append({
                    'id': getattr(v, 'id', None) or getattr(v, 'name', ''),
                    'shortName': getattr(v, 'name', '') or getattr(v, 'id', ''),
                    'locale': ','.join(langs) if langs else None,
                })
            except Exception:
                continue
    finally:
        try:
            engine.stop()
        except Exception:
            pass
    return items


def speech_recognition_once(timeout: int = 30, input_lang: str | None = None) -> str:
    """Launches the local Voice.html and uses browser SpeechRecognition to capture a single result.
    This is a best-effort helper and depends on Chrome + chromedriver working on your machine.
    It will return the captured text or empty string on timeout.
    """
    webdriver, By, Service, Options, ChromeDriverManager = _ensure_selenium_imports()
    current_dir = os.getcwd()
    html_path = os.path.join(current_dir, 'Data', 'Voice.html')
    # If the file doesn't exist, create a minimal one with the requested language
    if not os.path.exists(html_path):
        input_lang = input_lang or (env_vars.get('InputLanguage') or os.environ.get('InputLanguage') or 'en')
        HtmlCode = f'''<!DOCTYPE html>
<html lang="en"><head><title>Speech Recognition</title></head><body>
<button id="start" onclick="startRecognition()">Start</button>
<button id="end" onclick="stopRecognition()">Stop</button>
<p id="output"></p>
<script>
const output = document.getElementById('output');let recognition;
function startRecognition() {{ recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)(); recognition.lang = '{input_lang}'; recognition.continuous = true; recognition.onresult = function(event) {{ const transcript = event.results[event.results.length - 1][0].transcript; output.textContent += transcript; }}; recognition.onend = function() {{ recognition.start(); }}; recognition.start(); }}
function stopRecognition() {{ if(recognition) recognition.stop(); output.innerHTML = ""; }}
</script></body></html>'''
        os.makedirs(os.path.dirname(html_path), exist_ok=True)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(HtmlCode)

    chrome_options = Options()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36"
    chrome_options.add_argument(f"user-agent={user_agent}")
    chrome_options.add_argument("--use-fake-ui-for-media-stream")
    chrome_options.add_argument("--use-fake-device-for-media-stream")
    # headless may block microphone access on some platforms; try headless if you must
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--log-level=3")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    try:
        driver.get('file://' + os.path.abspath(html_path))
        # click start
        start_btn = driver.find_element(By.ID, 'start')
        start_btn.click()
        start = time.time()
        result_text = ''
        while True:
            try:
                out_el = driver.find_element(By.ID, 'output')
                Text = out_el.text.strip()
                if Text:
                    # click end and return
                    try:
                        driver.find_element(By.ID, 'end').click()
                    except Exception:
                        pass
                    result_text = Text
                    break
            except Exception:
                pass
            if (time.time() - start) > timeout:
                break
            time.sleep(0.2)
        return result_text
    finally:
        try:
            driver.quit()
        except Exception:
            pass
