from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import mimetypes
import struct
# Add imports for custom TTS and STT
import asyncio
import pygame
from dotenv import dotenv_values
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import mtranslate as mt
from google import genai
from google.genai import types

# Load environment variables
env_vars = dotenv_values(".env")
AssistantVoice = env_vars.get("AssistantVoice")
InputLanguage = env_vars.get("InputLanguage")

def save_binary_file(file_name, data):
    with open(file_name, "wb") as f:
        f.write(data)
    print(f"File saved to: {file_name}")

def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    parameters = parse_audio_mime_type(mime_type)
    bits_per_sample = parameters["bits_per_sample"]
    sample_rate = parameters["rate"]
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size
    )
    return header + audio_data

def parse_audio_mime_type(mime_type: str) -> dict:
    bits_per_sample = 16
    rate = 24000
    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate_str = param.split("=", 1)[1]
                rate = int(rate_str)
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass
    return {"bits_per_sample": bits_per_sample, "rate": rate}

# Custom TTS logic using edge_tts and pygame
import edge_tts
async def TextToAudioFile(text) -> None:
    file_path = r"Data/speech.mp3"
    if os.path.exists(file_path):
        os.remove(file_path)
    communicate = edge_tts.Communicate(text, AssistantVoice, pitch='-5Hz', rate='-5%')
    await communicate.save(file_path)

def TTS(Text):
    try:
        asyncio.run(TextToAudioFile(Text))
        pygame.mixer.init()
        pygame.mixer.music.load(r"Data/speech.mp3")
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.stop()
        pygame.mixer.quit()
        return True
    except Exception as e:
        print(f"Error in TTS: {e}")
        return False

# Custom STT logic using Selenium
HtmlCode = '''<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Speech Recognition</title>\n</head>\n<body>\n    <button id="start" onclick="startRecognition()">Start Recognition</button>\n    <button id="end" onclick="stopRecognition()">Stop Recognition</button>\n    <p id="output"></p>\n    <script>\n        const output = document.getElementById('output');\n        let recognition;\n        function startRecognition() {\n            recognition = new webkitSpeechRecognition() || new SpeechRecognition();\n            recognition.lang = '';\n            recognition.continuous = true;\n            recognition.onresult = function(event) {\n                const transcript = event.results[event.results.length - 1][0].transcript;\n                output.textContent += transcript;\n            };\n            recognition.onend = function() {\n                recognition.start();\n            };\n            recognition.start();\n        }\n        function stopRecognition() {\n            recognition.stop();\n            output.innerHTML = "";\n        }\n    </script>\n</body>\n</html>'''
HtmlCode = str(HtmlCode).replace("recognition.lang = '';", f"recognition.lang = '{InputLanguage}';")
if not os.path.exists("Data"):
    os.makedirs("Data")
with open(r"Data/Voice.html","w") as f:
    f.write(HtmlCode)
current_dir = os.getcwd()
Link = f"{current_dir}/Data/Voice.html"
chrome_options = Options()
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36"
chrome_options.add_argument(f"user-agent={user_agent}")
chrome_options.add_argument("--use-fake-ui-for-media-stream")
chrome_options.add_argument("--use-fake-device-for-media-stream")
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--log-level=3")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

def SpeechRecognition():
    driver.get("file://" + Link)
    driver.find_element(by=By.ID, value = "start").click()
    while True:
        try:
            Text = driver.find_element(by=By.ID, value = "output").text
            if Text:
                driver.find_element(by=By.ID, value = "end").click()
                if InputLanguage.lower() == "en" or "en" in InputLanguage.lower():
                    return Text
                else:
                    return mt.translate(Text, "en", "auto")
        except Exception as e:
            pass

app = Flask(__name__)
CORS(app)

@app.route('/tts', methods=['POST'])
def tts():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    # Use custom TTS logic
    success = TTS(text)
    if success:
        return send_file(r"Data/speech.mp3", mimetype='audio/mp3')
    else:
        return jsonify({'error': 'TTS generation failed'}), 500

@app.route('/stt', methods=['GET'])
def stt():
    # Use custom STT logic
    try:
        result = SpeechRecognition()
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        print("No prompt provided")
        return jsonify({'error': 'No prompt provided'}), 400
    try:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        model = "gemini-2.0-flash"
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        response = client.models.generate_content(
            model=model,
            contents=contents,
        )
        # Extract text response
        result = None
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text'):
                    result = part.text
                    break
        if result:
            return jsonify({'result': result})
        else:
            print("No response from Gemini")
            return jsonify({'error': 'No response from Gemini'}), 500
    except Exception as e:
        print("Gemini error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
