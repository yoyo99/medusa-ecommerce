#!/usr/bin/env python3
"""Medusa Product Import Script - MBWOOD Jardinerie - Medusa v2"""

import csv
import requests
import time
import sys

MEDUSA_URL = "https://medusa.jobnexai.com"
CSV_FILE = "mbwood_complete.csv"

class MedusaImporter:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.headers = {}
        self.stats = {"success": 0, "errors": 0, "skipped": 0}
        self.collections_cache = {}
        self.types_cache = {}
        
    def login(self, email: str, password: str) -> bool:
        try:
            response = requests.post(
                f"{self.base_url}/auth/user/emailpass",
                json={"email": email, "password": password},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                if token:
                    self.headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {token}"
                    }
                    print("✅ Authentification réussie")
                    return True
            return False
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    def get_or_create_collection(self, collection_name: str):
        if collection_name in self.collections_cache:
            return self.collections_cache[collection_name]
        try:
            response = requests.get(f"{self.base_url}/admin/collections", headers=self.headers, timeout=10)
            if response.status_code == 200:
                for coll in response.json().get("collections", []):
                    if coll.get("title") == collection_name:
                        self.collections_cache[collection_name] = coll["id"]
                        return coll["id"]
            response = requests.post(
                f"{self.base_url}/admin/collections",
                headers=self.headers,
                json={"title": collection_name, "handle": collection_name.lower().replace(" ", "-").replace("'", "")},
                timeout=10
            )
            if response.status_code in [200, 201]:
                coll_id = response.json()["collection"]["id"]
                self.collections_cache[collection_name] = coll_id
                print(f"  📁 Collection: {collection_name}")
                return coll_id
        except:
            pass
        return None
    
    def get_or_create_type(self, type_name: str):
        if type_name in self.types_cache:
            return self.types_cache[type_name]
        try:
            response = requests.get(f"{self.base_url}/admin/product-types", headers=self.headers, timeout=10)
            if response.status_code == 200:
                for ptype in response.json().get("product_types", []):
                    if ptype.get("value") == type_name:
                        self.types_cache[type_name] = ptype["id"]
                        return ptype["id"]
            response = requests.post(f"{self.base_url}/admin/product-types", headers=self.headers, json={"value": type_name}, timeout=10)
            if response.status_code in [200, 201]:
                type_id = response.json()["product_type"]["id"]
                self.types_cache[type_name] = type_id
                return type_id
        except:
            pass
        return None
    
    def create_product(self, row):
        try:
            product_title = row.get("Product Title", "").strip()
            product_handle = row.get("Product Handle", "").strip()
            variant_sku = row.get("Variant SKU", "").strip()
            variant_price_str = row.get("Variant Price EUR", "0").strip()
            
            if not product_title or not variant_sku:
                self.stats["skipped"] += 1
                return False
            
            try:
                variant_price = float(variant_price_str)
            except:
                variant_price = 0.0
            
            weight_str = row.get("Product Weight", "0").strip()
            try:
                weight = int(weight_str) if weight_str else 0
            except:
                weight = 0
            
            status = row.get("Product Status", "draft").strip()
            collection_name = row.get("Product Collection Id", "").strip()
            type_name = row.get("Product Type Id", "").strip()
            variant_title = row.get("Variant Title", "Default").strip()
            
            collection_id = self.get_or_create_collection(collection_name) if collection_name else None
            type_id = self.get_or_create_type(type_name) if type_name else None
            
            product_data = {
                "title": product_title,
                "handle": product_handle,
                "status": status,
                "weight": weight,
                "is_giftcard": False,
                "discountable": row.get("Product Discountable", "TRUE").upper() == "TRUE",
                "options": [{"title": "Taille", "values": [variant_title]}],
                "variants": [{
                    "title": variant_title,
                    "sku": variant_sku,
                    "manage_inventory": row.get("Variant Manage Inventory", "TRUE").upper() == "TRUE",
                    "allow_backorder": row.get("Variant Allow Backorder", "FALSE").upper() == "TRUE",
                    "prices": [{"amount": int(variant_price * 100), "currency_code": "eur"}],
                    "options": {"Taille": variant_title}
                }]
            }
            
            if collection_id:
                product_data["collection_id"] = collection_id
            if type_id:
                product_data["type_id"] = type_id
            
            response = requests.post(f"{self.base_url}/admin/products", headers=self.headers, json=product_data, timeout=30)
            
            if response.status_code in [200, 201]:
                self.stats["success"] += 1
                print(f"  ✅ {product_title[:40]}")
                return True
            else:
                self.stats["errors"] += 1
                print(f"  ❌ {product_title[:30]}: {response.status_code}")
                return False
        except Exception as e:
            self.stats["errors"] += 1
            print(f"  ❌ Erreur: {str(e)[:50]}")
            return False
    
    def import_from_csv(self, csv_file: str):
        print(f"\n🚀 Import depuis {csv_file}\n")
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            total = len(rows)
            for i, row in enumerate(rows, 1):
                print(f"[{i}/{total}] ", end="")
                self.create_product(row)
                if i % 10 == 0:
                    time.sleep(0.5)
                    print(f"\n📊 {self.stats['success']} OK | {self.stats['errors']} KO | {self.stats['skipped']} Skip\n")
        print(f"\n✅ Terminé!")
        print(f"📊 Succès: {self.stats['success']} | Erreurs: {self.stats['errors']} | Ignorés: {self.stats['skipped']}")

def main():
    print("=" * 60)
    print("  MEDUSA PRODUCT IMPORTER - MBWOOD v2")
    print("=" * 60)
    email = input("\n📧 Email: ")
    password = input("🔑 Password: ")
    importer = MedusaImporter(MEDUSA_URL)
    if not importer.login(email, password):
        sys.exit(1)
    importer.import_from_csv(CSV_FILE)

if __name__ == "__main__":
    main()
