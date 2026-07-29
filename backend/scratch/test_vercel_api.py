import json
import urllib.request
import urllib.error

url = "https://expense-tracker-decodemonkey.vercel.app/api/v1/auth/login"

def make_request(method, data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(data).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Content: {response.read().decode('utf-8')}\n")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Headers: {dict(e.headers)}")
        try:
            print(f"Content: {e.read().decode('utf-8')}\n")
        except:
            print("Content: Could not read body\n")
    except Exception as e:
        print(f"Error: {e}\n")

print("Testing GET request:")
make_request("GET")

print("Testing POST request:")
make_request("POST", {"email": "in.developer@outlook.com", "password": "12345678"})
