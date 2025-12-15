
import urllib.request
import json
import urllib.error

url = "http://127.0.0.1:8000/api/v1/auth/login/"
data = {
    "username": "bdm",
    "password": "1234"
}
json_data = json.dumps(data).encode('utf-8')

req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    print(f"Sending POST to {url}...")
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print("Response Content:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print("Error Content:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Request failed: {e}")
