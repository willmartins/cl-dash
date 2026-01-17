import requests

# --- CONFIGURATION ---
# Retail
SHOP_RETAIL = "cocoa-loco-web.myshopify.com"
CLIENT_ID_RETAIL = "5e8a4b792960ccb48ed3f36f1ccdeaf4"
CLIENT_SECRET_RETAIL = "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"

# Trade
SHOP_TRADE = "cocoa-loco.myshopify.com"
CLIENT_ID_TRADE = "bf708efc20fa3aa4ba9a94183bdf46b8"
CLIENT_SECRET_TRADE = "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"

def get_access_token(shop, client_id, client_secret):
    url = f"https://{shop}/admin/oauth/access_token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials"
    }
    print(f"Testing {shop}...")
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    return response

print("--- Testing Retail ---")
get_access_token(SHOP_RETAIL, CLIENT_ID_RETAIL, CLIENT_SECRET_RETAIL)

print("\n--- Testing Trade ---")
get_access_token(SHOP_TRADE, CLIENT_ID_TRADE, CLIENT_SECRET_TRADE)
