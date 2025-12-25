import csv,requests,time,sys
MEDUSA_URL="https://medusa.jobnexai.com"
CSV_FILE="mbwood_complete.csv"
class M:
 def __init__(s,u):s.base_url=u;s.headers={};s.stats={"success":0,"errors":0,"skipped":0};s.collections_cache={};s.types_cache={}
 def login(s,e,p):
  try:
   r=requests.post(f"{s.base_url}/auth/user/emailpass",json={"email":e,"password":p},timeout=10)
   if r.status_code==200:t=r.json().get("token");s.headers={"Content-Type":"application/json","Authorization":f"Bearer {t}"};print("✅ Auth OK");return True
  except Exception as ex:print(f"❌ {ex}")
  return False
 def get_coll(s,n):
  if n in s.collections_cache:return s.collections_cache[n]
  try:
   r=requests.get(f"{s.base_url}/admin/collections",headers=s.headers,timeout=10)
   if r.status_code==200:
    for c in r.json().get("collections",[]):
     if c.get("title")==n:s.collections_cache[n]=c["id"];return c["id"]
   r=requests.post(f"{s.base_url}/admin/collections",headers=s.headers,json={"title":n,"handle":n.lower().replace(" ","-")},timeout=10)
   if r.status_code in[200,201]:cid=r.json()["collection"]["id"];s.collections_cache[n]=cid;print(f"  📁 {n}");return cid
  except:pass
  return None
 def create(s,row):
  try:
   title=row.get("Product Title","").strip();handle=row.get("Product Handle","").strip();sku=row.get("Variant SKU","").strip();price_str=row.get("Variant Price EUR","0").strip()
   if not title or not sku:s.stats["skipped"]+=1;return False
   try:price=float(price_str)
   except:price=0.0
   coll_name=row.get("Product Collection Id","").strip();cid=s.get_coll(coll_name)if coll_name else None
   data={"title":title,"handle":handle,"status":"draft","is_giftcard":False,"discountable":True,"options":[{"title":"Taille","values":["Default"]}],"variants":[{"title":"Default","sku":sku,"prices":[{"amount":int(price*100),"currency_code":"eur"}],"options":{"Taille":"Default"}}]}
   if cid:data["collection_id"]=cid
   r=requests.post(f"{s.base_url}/admin/products",headers=s.headers,json=data,timeout=30)
   if r.status_code in[200,201]:s.stats["success"]+=1;print(f"  ✅ {title[:40]}");return True
   else:s.stats["errors"]+=1;print(f"  ❌ {title[:30]}: {r.status_code}");return False
  except Exception as e:s.stats["errors"]+=1;print(f"  ❌ {str(e)[:50]}");return False
 def run(s,csv_file):
  print(f"\n🚀 Import\n")
  with open(csv_file,'r',encoding='utf-8')as f:
   reader=csv.DictReader(f);rows=list(reader);total=len(rows)
   for i,row in enumerate(rows,1):print(f"[{i}/{total}] ",end="");s.create(row)
   if i%10==0:time.sleep(0.5);print(f"\n📊 {s.stats['success']} OK | {s.stats['errors']} KO\n")
  print(f"\n✅ Done! {s.stats['success']} OK | {s.stats['errors']} KO")
print("="*60+"\n  MEDUSA IMPORTER\n"+"="*60)
e=input("\n📧 Email: ");p=input("🔑 Pass: ")
m=M(MEDUSA_URL)
if m.login(e,p):m.run(CSV_FILE)
