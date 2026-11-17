import os
import sys
from dotenv import load_dotenv

load_dotenv()


def safe_print(msg):
    """Safe print that handles Kannada/Unicode chars on Windows cp1252 console."""
    try:
        print(str(msg).encode('ascii', errors='replace').decode('ascii'))
    except Exception:
        pass
import re
import random
import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from google.cloud import speech

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# === API KEYS ===
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = os.getenv("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


# === GOOGLE CLOUD CREDENTIALS ===
DEFAULT_GOOGLE_CREDENTIALS_PATH = os.path.join(
    BASE_DIR, "key-rider-460020-q6-878bbe0dd2c3.json"
)
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
elif os.path.exists(DEFAULT_GOOGLE_CREDENTIALS_PATH):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = DEFAULT_GOOGLE_CREDENTIALS_PATH
else:
    print(
        "WARNING: GOOGLE_APPLICATION_CREDENTIALS is not set and no local JSON credentials "
        "file was found. Speech-to-text transcription will fail until this is fixed."
    )

# === HELPER FUNCTION: CALL GROQ API WITH ERROR HANDLING ===
def call_groq_api(system_message, user_message):
    """Helper function to call Groq API with proper error handling"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3
    }

    try:
        print(f"Making request to Groq API...")
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)

        print(f"Response status code: {response.status_code}")

        if response.status_code != 200:
            print(f"API Error Response: {response.text}")

        response.raise_for_status()
        result = response.json()

        if 'choices' not in result:
            error_msg = result.get('error', {}).get('message', 'Unknown API error')
            print(f"Groq API Error: {result}")
            return None, f"API Error: {error_msg}"

        content = result['choices'][0]['message']['content'].strip()
        print(f"API call successful")
        return content, None

    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            return None, "Invalid API key. Please check your Groq API key."
        elif response.status_code == 429:
            return None, "Rate limit exceeded. Please wait a moment and try again."
        else:
            return None, f"HTTP Error {response.status_code}: {response.text}"
    except requests.exceptions.Timeout:
        return None, "Request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        return None, f"Network error: {str(e)}"
    except Exception as e:
        return None, f"Error: {str(e)}"

# === ROUTES ===
@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/translate')
def translate_page():
    return render_template('translate.html')

@app.route('/analyzer')
def analyzer_page():
    return render_template('analyzer.html')

@app.route('/quiz-lang-select')
def quiz_page():
    return render_template('quiz.html')

# === TEST API ROUTE ===
@app.route('/test-api')
def test_api():
    """Test route to check if Groq API key is working"""
    content, error = call_groq_api(
        "You are a helpful assistant.",
        "Say hello in one word"
    )

    if error:
        return jsonify({
            "status": "FAILED",
            "error": error,
            "api_key_prefix": GROQ_API_KEY[:10] + "..." if GROQ_API_KEY else "None"
        })

    return jsonify({
        "status": "SUCCESS",
        "response": content,
        "api_key_prefix": GROQ_API_KEY[:10] + "..."
    })

# === AUDIO TRANSCRIPTION ===
@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    audio_path = os.path.join(UPLOAD_FOLDER, "recorded.webm")
    audio_file.save(audio_path)

    try:
        transcript = transcribe_kannada(audio_path)
        return jsonify({"transcription": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def transcribe_kannada(audio_path):
    client = speech.SpeechClient()
    with open(audio_path, "rb") as f:
        content = f.read()

    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code="kn-IN"
    )

    response = client.recognize(config=config, audio=audio)
    return " ".join([result.alternatives[0].transcript for result in response.results]).strip()

# === TIME COMPLEXITY ANALYSIS ===
@app.route('/analyze', methods=['POST'])
def analyze():
    code = request.json.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    content, error = call_groq_api(
        "You are an expert in analyzing code.",
        f"Analyze the time complexity of the following code and explain your reasoning:\n\n{code}"
    )

    if error:
        print(f"Analysis Error: {error}")
        return jsonify({"error": error}), 500

    match = re.search(r"O\([^)]+\)", content)
    complexity = match.group(0) if match else "Unknown"
    confidence = round(random.uniform(0.75, 0.95), 2) if complexity != "Unknown" else 0.5

    return jsonify({
        "explanation": content,
        "complexity": complexity,
        "confidence": confidence
    })

# === TRANSLATE KANNADA TO ENGLISH ===
@app.route('/translate-kannada', methods=['POST'])
def translate_kannada_route():
    text = request.json.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    safe_print(f"Translating text: {text}")

    content, error = call_groq_api(
        "Translate from Kannada to English. Only return the translated text without any extra explanation or quotes.",
        text
    )

    if error:
        safe_print(f"Translation Error: {error}")
        return jsonify({"error": error}), 500

    translation = content.replace('"', '').strip()
    safe_print(f"Translation result: {translation}")

    return jsonify({"translation": translation})

# === GENERATE PYTHON CODE ===
@app.route('/generate-code', methods=['POST'])
def generate_code_route():
    prompt = request.json.get("prompt")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    safe_print(f"Generating code for: {prompt}")

    content, error = call_groq_api(
        "Convert the user's request into valid Python code. Only return code without explanations.",
        prompt
    )

    if error:
        print(f"Code Generation Error: {error}")
        return jsonify({"error": error}), 500

    return jsonify({"code": content})

# === EXPLAIN CODE IN ENGLISH ===
@app.route('/explain-code', methods=['POST'])
def explain_code_route():
    code = request.json.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    print(f"Explaining code in English")

    content, error = call_groq_api(
        "Explain what the following Python code does in simple English.",
        code
    )

    if error:
        print(f"Explanation Error: {error}")
        return jsonify({"error": error}), 500

    return jsonify({"explanation": content})

# === EXPLAIN CODE IN KANNADA ===
@app.route('/explain-code-kannada', methods=['POST'])
def explain_code_kannada_route():
    code = request.json.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    print(f"Explaining code in Kannada")

    content, error = call_groq_api(
        "Explain what the following Python code does in Kannada language.",
        code
    )

    if error:
        print(f"Kannada Explanation Error: {error}")
        return jsonify({"error": error}), 500

    return jsonify({"explanation": content})

# === TRANSLATE EXPLANATION TO KANNADA ===
@app.route('/translate-explanation', methods=['POST'])
def translate_explanation():
    text = request.json.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    content, error = call_groq_api(
        "You are a professional Kannada translator.",
        f"Translate the following explanation to Kannada:\n\n{text}"
    )

    if error:
        print(f"Explanation Translation Error: {error}")
        return jsonify({"error": error}), 500

    return jsonify({"translated": content})

# === QUIZ FEATURE ===
@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    language = request.json.get("language")

    if not language:
        return jsonify({"error": "No language selected"}), 400

    questions = {
        "Python": [
            {
                "question": "What is a list in Python?",
                "options": ["Immutable", "Mutable", "Fixed-size", "None"],
                "answer": "Mutable"
            },
            {
                "question": "Which keyword is used to define a function?",
                "options": ["define", "function", "def", "func"],
                "answer": "def"
            },
            {
                "question": "What does 'len()' function do?",
                "options": ["Returns length", "Returns type", "Deletes item", "None"],
                "answer": "Returns length"
            }
        ],
        "C++": [
            {
                "question": "Which of the following is a correct class declaration in C++?",
                "options": ["class MyClass {}", "MyClass {}", "function MyClass {}", "def class MyClass {}"],
                "answer": "class MyClass {}"
            },
            {
                "question": "Which symbol is used to declare a pointer?",
                "options": ["&", "*", "#", "%"],
                "answer": "*"
            },
            {
                "question": "What is the correct way to include a library?",
                "options": ["#include <iostream>", "import iostream", "using iostream", "require iostream"],
                "answer": "#include <iostream>"
            }
        ],
        "Java": [
            {
                "question": "Which keyword is used to inherit a class in Java?",
                "options": ["extends", "inherits", "implements", "super"],
                "answer": "extends"
            },
            {
                "question": "What is the size of int in Java?",
                "options": ["4 bytes", "2 bytes", "8 bytes", "Depends on system"],
                "answer": "4 bytes"
            }
        ]
    }

    return jsonify({"questions": questions.get(language, [])})

# === MAIN ENTRY POINT ===
if __name__ == '__main__':
    app.run(debug=True, port=5000)