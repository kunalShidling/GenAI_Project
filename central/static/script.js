const kannadaInput = document.getElementById("kannadaInput");
const englishOutput = document.getElementById("englishOutput");
const outputDiv = document.getElementById("output");
const explanationBox = document.getElementById("explanation");
const keyboardDiv = document.getElementById("keyboard");

const kannadaKeys = [
  'ಅ','ಆ','ಇ','ಈ','ಉ','ಊ','ಎ','ಏ','ಐ','ಒ','ಓ',
  'ಕ','ಖ','ಗ','ಘ','ಙ','ಚ','ಛ','ಜ','ಝ','ಞ','ಟ',
  'ಠ','ಡ','ಢ','ಣ','ತ','ಥ','ದ','ಧ','ನ','ಪ','ಫ',
  'ಬ','ಭ','ಮ','ಯ','ರ','ಲ','ವ','ಶ','ಷ','ಸ','ಹ',
  'ಳ','ಕ್ಷ','ಜ್ಞ','ಾ','ಿ','ೀ','ು','ೂ','ೆ','ೇ','ೈ',
  'ೊ','ೋ','ೌ','್','ಂ','ಃ','೦','೧','೨','೩','೪',
  '೫','೬','೭','೮','೯'
];

// Build virtual keyboard
function buildKeyboard() {
  kannadaKeys.forEach(char => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = char;
    key.onclick = () => kannadaInput.value += char;
    keyboardDiv.appendChild(key);
  });

  const spaceKey = document.createElement("div");
  spaceKey.className = "key wide";
  spaceKey.textContent = "Space";
  spaceKey.onclick = () => kannadaInput.value += " ";
  keyboardDiv.appendChild(spaceKey);

  const backspaceKey = document.createElement("div");
  backspaceKey.className = "key wide";
  backspaceKey.textContent = "Backspace";
  backspaceKey.onclick = () => {
    kannadaInput.value = kannadaInput.value.slice(0, -1);
  };
  keyboardDiv.appendChild(backspaceKey);
}

function toggleKeyboard() {
  keyboardDiv.classList.toggle("hidden");
}

buildKeyboard();

// Speech-to-text using browser
function showStatus(message, isError = false) {
  // Show status inline below the Kannada input instead of using alert()
  let statusEl = document.getElementById("speechStatus");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "speechStatus";
    statusEl.style.cssText = "margin-top:6px;padding:6px 10px;border-radius:6px;font-size:0.85rem;font-weight:500;transition:opacity 0.4s";
    if (kannadaInput && kannadaInput.parentNode) {
      kannadaInput.parentNode.appendChild(statusEl);
    } else {
      document.body.appendChild(statusEl);
    }
  }
  statusEl.textContent = message;
  statusEl.style.background = isError ? "#ffe0e0" : "#e0f7e9";
  statusEl.style.color = isError ? "#c0392b" : "#1a7a40";
  statusEl.style.border = isError ? "1px solid #e74c3c" : "1px solid #27ae60";
  statusEl.style.display = "block";
  statusEl.style.opacity = "1";
  // Auto-hide after 4 seconds
  clearTimeout(statusEl._hideTimer);
  statusEl._hideTimer = setTimeout(() => {
    statusEl.style.opacity = "0";
    setTimeout(() => { statusEl.style.display = "none"; }, 400);
  }, 4000);
}

// Browser Web Speech API — free, no billing needed
function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showStatus("⚠️ Speech recognition not supported. Please use Chrome.", true);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'kn-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  const micIcon = document.querySelector('.mic-icon');

  recognition.onstart = () => {
    if (micIcon) { micIcon.textContent = '⏹️'; micIcon.style.animation = 'micPulse 1s infinite'; }
    showStatus("🎤 Listening... Speak in Kannada", false);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    kannadaInput.value += transcript + ' ';
    showStatus("✅ Captured: " + transcript, false);
  };

  recognition.onerror = (event) => {
    const msgs = {
      'network':       "⚠️ Speech service unreachable. Check internet and try again.",
      'not-allowed':   "🔒 Mic access denied. Allow microphone in browser settings.",
      'no-speech':     "🔇 No speech detected. Please speak clearly and try again.",
      'audio-capture': "🎙️ No microphone found. Please connect a mic.",
      'aborted':       "⚠️ Recording stopped. Please try again."
    };
    showStatus(msgs[event.error] || `⚠️ Error: ${event.error}`, true);
  };

  recognition.onend = () => {
    if (micIcon) { micIcon.textContent = '🎤'; micIcon.style.animation = ''; }
  };

  recognition.start();
}

// Translate Kannada → English via Flask backend
async function translateKannada() {
  const inputText = kannadaInput.value.trim();
  if (!inputText) {
    showStatus("⚠️ Please enter Kannada text first.", true);
    return;
  }
  englishOutput.value = "Translating...";

  try {
    const res = await fetch("/translate-kannada", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: inputText })
    });

    const json = await res.json();
    
    if (json.error) {
      englishOutput.value = `Error: ${json.error}`;
      showStatus(`❌ Translation failed: ${json.error}`, true);
      return null;
    }
    
    const translation = json.translation || "Translation failed";
    englishOutput.value = translation;
    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    englishOutput.value = "Network error. Please check your connection.";
    showStatus("❌ Translation failed. Please check your internet connection.", true);
    return null;
  }
}

// Generate Python code from English prompt via Flask backend
async function generateCode() {
  const prompt = englishOutput.value.trim();
  if (!prompt) {
    outputDiv.value = "Please translate text first.";
    showStatus("⚠️ Please translate Kannada text to English first.", true);
    return;
  }
  outputDiv.value = "Generating Python code...";

  try {
    const res = await fetch("/generate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt })
    });

    const json = await res.json();
    
    if (json.error) {
      outputDiv.value = `Error: ${json.error}`;
      showStatus(`❌ Code generation failed: ${json.error}`, true);
      return null;
    }
    
    const pythonCode = json.code || "Code generation failed";
    outputDiv.value = pythonCode;
    return pythonCode;
  } catch (error) {
    console.error("Code generation error:", error);
    outputDiv.value = "Network error. Please check your connection.";
    showStatus("❌ Code generation failed. Please check your internet connection.", true);
    return null;
  }
}

// Explain Python code in English via Flask backend
async function explainCode() {
  const code = outputDiv.value.trim();
  if (!code) {
    explanationBox.value = "Please generate Python code first.";
    showStatus("⚠️ Please generate code first.", true);
    return;
  }
  explanationBox.value = "Generating explanation in English...";

  try {
    const res = await fetch("/explain-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code })
    });

    const json = await res.json();
    
    if (json.error) {
      explanationBox.value = `Error: ${json.error}`;
      showStatus(`❌ Explanation failed: ${json.error}`, true);
      return null;
    }
    
    const explanation = json.explanation || "Explanation failed";
    explanationBox.value = explanation;
    return explanation;
  } catch (error) {
    console.error("Explanation error:", error);
    explanationBox.value = "Network error. Please check your connection.";
    showStatus("❌ Explanation failed. Please check your internet connection.", true);
    return null;
  }
}

// Explain Python code in Kannada via Flask backend
async function explainCodeKannada() {
  const code = outputDiv.value.trim();
  if (!code) {
    explanationBox.value = "Please generate Python code first.";
    showStatus("⚠️ Please generate code first.", true);
    return;
  }
  explanationBox.value = "ಕೋಡ್ ವಿವರಣೆ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...";

  try {
    const res = await fetch("/explain-code-kannada", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code })
    });

    const json = await res.json();
    
    if (json.error) {
      explanationBox.value = `ದೋಷ: ${json.error}`;
      showStatus(`❌ ವಿವರಣೆ ವಿಫಲವಾಗಿದೆ: ${json.error}`, true);
      return null;
    }
    
    const explanation = json.explanation || "ವಿವರಣೆ ವಿಫಲವಾಗಿದೆ";
    explanationBox.value = explanation;
    return explanation;
  } catch (error) {
    console.error("Kannada explanation error:", error);
    explanationBox.value = "ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
    showStatus("❌ ವಿವರಣೆ ವಿಫಲವಾಗಿದೆ.", true);
    return null;
  }
}

// Full pipeline: Translate → Generate Code → Explain
async function processKannadaToCode(explainLanguage = 'english') {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => button.disabled = true);

  try {
    const translation = await translateKannada();
    if (!translation) return;

    const pythonCode = await generateCode();
    if (!pythonCode) return;

    // Sync generated code into the Python runner panel
    const codeRunner = document.getElementById('codeRunner');
    if (codeRunner) codeRunner.value = pythonCode.replace(/^```(?:python)?\s*/i, '').replace(/\s*```$/i, '').trim();

    if (explainLanguage === 'english') {
      await explainCode();
    } else {
      await explainCodeKannada();
    }
  } catch (error) {
    console.error("Processing error:", error);
    showStatus("❌ An error occurred during processing. Please try again.", true);
  } finally {
    buttons.forEach(button => button.disabled = false);
  }
}

// Enter key triggers full processing
kannadaInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    processKannadaToCode();
  }
});

// ============================================================
// PYODIDE — Python runner for the "Try Python Code Below" panel
// ============================================================

let pyodideInstance = null;
let pyodideReady = false;

// Global prompt bridge so Python's input() can call JavaScript window.prompt()
window._js_prompt = function(promptText) {
  const val = window.prompt(promptText !== undefined && promptText !== null && promptText !== "" ? promptText : "Enter input:");
  return val !== null ? val : "";
};

async function initPyodide() {
  const statusEl = document.getElementById("pyodideStatus");
  const runBtn = document.getElementById("runBtn");

  if (!statusEl || !runBtn) return; // not on translate page

  try {
    statusEl.textContent = "Loading Python runtime...";
    statusEl.style.color = "#888";

    pyodideInstance = await loadPyodide({
      stdin: () => window._js_prompt("Enter input:")
    });
    pyodideReady = true;

    // Register prompt bridge in Pyodide globals as well
    pyodideInstance.globals.set("_js_prompt", window._js_prompt);

    statusEl.textContent = "✅ Python runtime ready!";
    statusEl.style.color = "#1a7a40";
    runBtn.disabled = false;

    // Auto-hide the status after 3 seconds
    setTimeout(() => { statusEl.style.display = "none"; }, 3000);
  } catch (err) {
    statusEl.textContent = "❌ Failed to load Python runtime: " + err.message;
    statusEl.style.color = "#d93025";
    console.error("Pyodide load error:", err);
  }
}

async function runPythonCode() {
  const codeArea = document.getElementById("codeRunner");
  const outputEl = document.getElementById("runOutput");
  const runBtn = document.getElementById("runBtn");

  if (!pyodideReady || !pyodideInstance) {
    outputEl.textContent = "⏳ Python runtime is still loading. Please wait...";
    outputEl.style.color = "#e67e00";
    return;
  }

  const code = codeArea.value.trim();
  if (!code) {
    outputEl.textContent = "⚠️ No code to run. Please paste or generate Python code first.";
    outputEl.style.color = "#e67e00";
    return;
  }

  // Strip markdown code fences if present (```python ... ```)
  const cleanCode = code.replace(/^```(?:python)?\s*/i, "").replace(/\s*```$/i, "").trim();

  runBtn.disabled = true;
  runBtn.textContent = "⏳ Running...";
  outputEl.textContent = "";
  outputEl.style.color = "#a6e3a1";

  try {
    // Ensure prompt function is accessible on both window and pyodide globals
    window._js_prompt = function(promptText) {
      const val = window.prompt(promptText !== undefined && promptText !== null && promptText !== "" ? promptText : "Enter input:");
      return val !== null ? val : "";
    };
    pyodideInstance.globals.set("_js_prompt", window._js_prompt);

    // Python setup: capture stdout/stderr, mock input(), and set __name__
    pyodideInstance.runPython(`
import sys, io, builtins

if not hasattr(builtins, '_real_input'):
    builtins._real_input = builtins.input

try:
    from js import _js_prompt
except Exception:
    _js_prompt = globals().get('_js_prompt', lambda msg='': '')

__name__ = '__main__'
_captured_output = io.StringIO()
sys.stdout = _captured_output
sys.stderr = _captured_output

def _input_mock(prompt=''):
    p_str = str(prompt) if prompt is not None else ''
    val = _js_prompt(p_str)
    v_str = str(val) if val is not None else ''
    _captured_output.write(p_str + v_str + '\\n')
    return v_str

builtins.input = _input_mock
`);

    // Execute user's code
    pyodideInstance.runPython(cleanCode);

    // Auto-call main() if defined but not explicitly called in the script
    if (/^\s*def\s+main\s*\(/m.test(cleanCode) && !/^\s*main\s*\(/m.test(cleanCode)) {
      pyodideInstance.runPython("main()");
    }

    // Retrieve captured output and restore stdout/stderr/input
    const output = pyodideInstance.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
if hasattr(builtins, '_real_input'):
    builtins.input = builtins._real_input
_captured_output.getvalue()
`);

    outputEl.textContent = output || "(No output — code ran successfully with no print statements)";
    outputEl.style.color = "#a6e3a1";
  } catch (err) {
    let captured = "";
    try {
      captured = pyodideInstance.runPython(`
import sys, builtins
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
if hasattr(builtins, '_real_input'):
    builtins.input = builtins._real_input
_captured_output.getvalue() if '_captured_output' in globals() else ""
`) || "";
    } catch(e) {
      try {
        pyodideInstance.runPython("import sys; sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");
      } catch(e2) {}
    }

    const errMessage = err.message || String(err);
    outputEl.textContent = (captured ? captured + "\n" : "") + "❌ Error:\n" + errMessage;
    outputEl.style.color = "#f38ba8";
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "▶ Run Code";
  }
}

// Start loading Pyodide as soon as the page loads
if (document.getElementById("runBtn")) {
  initPyodide();
}

