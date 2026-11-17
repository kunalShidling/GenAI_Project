# 🤖 GenAI Project — Kannada-Powered AI Learning Platform

A full-stack AI-powered web application built with **Flask** that assists Kannada-speaking learners in understanding code, translating between Kannada and English, analyzing time complexity, and taking programming quizzes.

---

## 📌 Features

| Feature | Description |
|---|---|
| 🔍 **Code Analyzer** | Analyzes time complexity of code using Groq AI |
| 🌐 **Kannada Translator** | Translates Kannada speech/text to English and vice versa |
| 📝 **Code Explainer** | Explains Python code in English or Kannada |
| 🎤 **Speech to Text** | Records and transcribes Kannada audio using Google Cloud Speech |
| 🧩 **Programming Quiz** | Interactive quiz for Python, C++, and Java |
| ⚡ **Code Generator** | Generates Python code from natural language prompts |

---

## 🗂️ Project Structure

```
GenAi_project/
│
├── central/
│   ├── main.py                          # Flask application (main entry point)
│   ├── key-rider-460020-q6-*.json       # Google Cloud credentials (keep secret!)
│   ├── uploads/                         # Uploaded audio files (auto-created)
│   ├── templates/
│   │   ├── home.html                    # Landing/home page
│   │   ├── analyzer.html                # Code complexity analyzer page
│   │   ├── translate.html               # Kannada ↔ English translator page
│   │   └── quiz.html                    # Programming quiz page
│   └── static/
│       ├── style.css                    # Global stylesheet
│       └── script.js                    # Frontend JavaScript logic
│
├── uploads/                             # Root-level uploads folder
├── requirements.txt                     # Python dependencies
├── test_groq.py                         # Groq API connection test script
└── README.md                            # Project documentation
```

---

## ⚙️ Prerequisites

Make sure you have the following installed before setting up:

- **Python 3.9+** → [Download here](https://www.python.org/downloads/)
- **pip** (comes bundled with Python)
- A **Groq API Key** → [Get one free at groq.com](https://console.groq.com/)
- A **Google Cloud Service Account JSON** with the **Cloud Speech-to-Text API** enabled

---

## 🚀 Setup Instructions

### 1. Clone or Download the Project

```bash
git clone https://github.com/your-username/GenAi_project.git
cd GenAi_project
```

> Or simply download and extract the ZIP and open the folder.

---

### 2. Create a Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `flask` — Web framework
- `flask-cors` — Cross-Origin Resource Sharing support
- `requests` — HTTP requests to Groq API
- `google-cloud-speech` — Google Speech-to-Text API
- `groq` — Groq AI SDK

---

### 4. Configure API Keys

#### 🔑 Groq API Key

Set your Groq API key as an environment variable:

```bash
# Windows (Command Prompt)
set GROQ_API_KEY=your_groq_api_key_here

# Windows (PowerShell)
$env:GROQ_API_KEY="your_groq_api_key_here"

# macOS / Linux
export GROQ_API_KEY="your_groq_api_key_here"
```

> **Note:** If no environment variable is set, the app falls back to the hardcoded key in `main.py`. It is strongly recommended to use environment variables in production.

---

#### 🔑 Google Cloud Speech Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Cloud Speech-to-Text API**
3. Create a **Service Account** and download the JSON key file
4. Place the JSON file inside the `central/` directory
5. Update the filename reference in `main.py` (line 33):

```python
DEFAULT_GOOGLE_CREDENTIALS_PATH = os.path.join(
    BASE_DIR, "your-credentials-file.json"   # ← update this
)
```

Or set it via environment variable:

```bash
# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="d:\GenAi_project\central\your-credentials-file.json"

# macOS / Linux
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/GenAi_project/central/your-credentials-file.json"
```

---

## ▶️ Running the Application

### Start the Flask Server

```bash
# Make sure your virtual environment is active first!

cd central
python main.py
```

You should see output like:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Open in Browser

Navigate to: **http://localhost:5000**

---

## 🧪 Testing the API Connection

To verify your Groq API key is working correctly:

```bash
# Option 1: Use the built-in test route (while server is running)
# Open in browser: http://localhost:5000/test-api

# Option 2: Run the standalone test script
python test_groq.py
```

---

## 🌐 Application Routes

| Route | Method | Description |
|---|---|---|
| `/` or `/home` | GET | Home/landing page |
| `/analyzer` | GET | Code time complexity analyzer |
| `/translate` | GET | Kannada ↔ English translator |
| `/quiz-lang-select` | GET | Programming quiz |
| `/analyze` | POST | Analyze code complexity (JSON) |
| `/translate-kannada` | POST | Translate Kannada text to English |
| `/generate-code` | POST | Generate Python code from prompt |
| `/explain-code` | POST | Explain code in English |
| `/explain-code-kannada` | POST | Explain code in Kannada |
| `/translate-explanation` | POST | Translate explanation to Kannada |
| `/upload` | POST | Upload audio for transcription |
| `/generate-quiz` | POST | Fetch quiz questions by language |
| `/test-api` | GET | Test Groq API connectivity |

---

## 🔧 Troubleshooting

### ❌ ModuleNotFoundError
Make sure your virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```

### ❌ Google credentials file not found
Ensure the `.json` service account file is in the `central/` directory and the filename matches the one referenced in `main.py`.

### ❌ Groq API 401 Unauthorized
Your API key is invalid or expired. Get a new one from https://console.groq.com/ and set it as an environment variable.

### ❌ Groq API 429 Rate Limit
You have exceeded the free-tier rate limit. Wait a moment and retry.

### ❌ Port 5000 already in use
Change the port in `main.py`:
```python
app.run(debug=True, port=5001)  # Use any available port
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-CORS |
| AI / LLM | Groq API (openai/gpt-oss-120b) |
| Speech Recognition | Google Cloud Speech-to-Text |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Language Support | Kannada (kn-IN) + English |

---

## 📄 License

This project is for educational purposes. Feel free to modify and extend it.

---
# python central\main.py
## 🙌 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
