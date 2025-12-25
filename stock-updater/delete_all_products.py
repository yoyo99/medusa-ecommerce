import requests,sys

MEDUSA_URL="https://medusa.jobnexai.com"
e=input("📧 Email: ");p=input("🔑 Pass: ")
r=requests.post(f"{MEDUSA_URL}/auth/user/emailpass",json={"email":e,"password":p},timeout=10)
if r.status_code!=200:print("❌ Auth failed");sys.exit(1)
token=r.json().get("token")
headers={"Content-Type":"application/json","Authorization":f"Bearer {token}"}

print("\n🔍 Récupération des produits...")
r=requests.get(f"{MEDUSA_URL}/admin/products?limit=1000",headers=headers,timeout=30)
if r.status_code!=200:print("❌ Erreur");sys.exit(1)
products=r.json().get("products",[])
print(f"📦 {len(products)} produits trouvés\n")

confirm=input(f"⚠️  Supprimer TOUS les {len(products)} produits ? (oui/non): ")
if confirm.lower()!="oui":print("❌ Annulé");sys.exit(0)

deleted=0;errors=0
for i,p in enumerate(products,1):
    pid=p["id"]
    r=requests.delete(f"{MEDUSA_URL}/admin/products/{pid}",headers=headers,timeout=10)
    if r.status_code in[200,204]:deleted+=1;print(f"[{i}/{len(products)}] ✅ {p['title'][:40]}")
    else:errors+=1;print(f"[{i}/{len(products)}] ❌ {p['title'][:40]}")

print(f"\n✅ Supprimés: {deleted} | Erreurs: {errors}")
