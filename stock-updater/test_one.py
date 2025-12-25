import csv,requests

TOKEN = input("Token (colle le token de $TOKEN): ")
MEDUSA_URL = "https://medusa.jobnexai.com"
headers = {"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"}

with open("mbwood_complete.csv", 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    row = next(reader)  # Premier produit
    
    title = row.get("Product Title", "").strip()
    handle = row.get("Product Handle", "").strip()
    sku = row.get("Variant SKU", "").strip()
    price = float(row.get("Variant Price EUR", "0").strip())
    
    print(f"Title: {title}")
    print(f"Handle: {handle}")
    print(f"SKU: {sku}")
    print(f"Price: {price}")
    
    data = {
        "title": title,
        "handle": handle,
        "status": "published",
        "options": [{"title": "Taille", "values": ["Default"]}],
        "variants": [{
            "title": "Default",
            "sku": sku,
            "prices": [{"amount": int(price * 100), "currency_code": "eur"}],
            "options": {"Taille": "Default"}
        }]
    }
    
    r = requests.post(f"{MEDUSA_URL}/admin/products", headers=headers, json=data, timeout=30)
    print(f"\nStatus: {r.status_code}")
    print(f"Response: {r.text[:500]}")
