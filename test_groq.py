import requests

# Test with actual Kannada text (what the user typed in the UI)
kannada_text = "ಪ್ರೋಗ್ರಾಮ್ ಆದ ಮಾಡೋದು ಎರಡು ನಂಬರ್ ನ"

resp = requests.post(
    "http://127.0.0.1:5000/translate-kannada",
    json={"text": kannada_text},
    timeout=30
)
print("Status:", resp.status_code)
print("Content-Type:", resp.headers.get("Content-Type"))

if resp.status_code == 200:
    data = resp.json()
    print("Translation:", data.get("translation", "No translation key"))
    print("SUCCESS!")
else:
    print("Error response:", resp.text[:500])
