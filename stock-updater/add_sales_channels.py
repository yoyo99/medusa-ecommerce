import requests,sys

MEDUSA_URL="https://medusa.jobnexai.com"

def add_channels():
    e=input("📧 Email: ");p=input("🔑 Pass: ")
    r=requests.post(f"{MEDUSA_URL}/auth/user/emailpass",json={"email":e,"password":p},timeout=10)
    if r.status_code!=200:print("❌ Auth failed");return
    token=r.json().get("token")
    headers={"Content-Type":"application/json","Authorization":f"Bearer {token}"}
    
    # Get channel
    r=requests.get(f"{MEDUSA_URL}/admin/sales-channels",headers=headers,timeout=10)
    if r.status_code!=200:print("❌ No channels");return
    channels=r.json().get("sales_channels",[])
    if not channels:print("❌ No channels found");return
    channel_id=channels[0]["id"]
    print(f"✅ Using channel: {channels[0].get('name','default')} ({channel_id})")
    
    # Get all products
    r=requests.get(f"{MEDUSA_URL}/admin/products?limit=1000",headers=headers,timeout=30)
    if r.status_code!=200:print("❌ Can't get products");return
    products=r.json().get("products",[])
    print(f"\n🔍 Found {len(products)} products\n")
    
    success=0;errors=0
    for i,p in enumerate(products,1):
        pid=p["id"]
        # Add sales channel to product
        r=requests.post(f"{MEDUSA_URL}/admin/products/{pid}/sales-channels",headers=headers,json={"add":[channel_id]},timeout=10)
        if r.status_code in[200,201]:success+=1;print(f"[{i}/{len(products)}] ✅ {p['title'][:40]}")
        else:errors+=1;print(f"[{i}/{len(products)}] ❌ {p['title'][:40]}")
    
    print(f"\n✅ Done! {success} OK | {errors} errors")

add_channels()
