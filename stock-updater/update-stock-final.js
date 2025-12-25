// Script de mise à jour automatique du stock depuis Product Tag 3
// Usage: node update-stock.js

const axios = require('axios');

// ====== CONFIGURATION ======
const MEDUSA_BACKEND_URL = 'https://medusa.jobnexai.com';
const ADMIN_EMAIL = 'admin@jobnexai.com';  // À MODIFIER
const ADMIN_PASSWORD = 'Clement//**99';  // À MODIFIER
const LOCATION_ID = 'sloc_01DEFAULT';  // ✅ Récupéré depuis l'API

let AUTH_TOKEN = null;

// ====== AUTHENTIFICATION ======
async function login() {
  try {
    console.log('🔐 Authentification...');
    const response = await axios.post(
      `${MEDUSA_BACKEND_URL}/admin/auth/token`,
      {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    );

    AUTH_TOKEN = response.data.access_token;
    console.log('✅ Authentification réussie\n');
    return AUTH_TOKEN;
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
    process.exit(1);
  }
}

// ====== MISE À JOUR DU STOCK ======
async function updateStockFromTags() {
  try {
    // Se connecter d'abord
    await login();

    console.log('🚀 Récupération des produits...');

    // Récupérer tous les produits avec leurs tags
    const productsResponse = await axios.get(
      `${MEDUSA_BACKEND_URL}/admin/products`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        params: {
          limit: 1000,
        }
      }
    );

    const products = productsResponse.data.products;
    console.log(`✅ ${products.length} produits trouvés\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Pour chaque produit
    for (const product of products) {
      // Récupérer Product Tag 3 (index 2 car 0-based)
      const stockTag = product.tags && product.tags[2] ? product.tags[2].value : null;

      if (!stockTag || isNaN(parseInt(stockTag))) {
        console.log(`⚠️  ${product.title}: pas de stock dans Tag 3`);
        skipped++;
        continue;
      }

      const stockQuantity = parseInt(stockTag);

      // Pour chaque variante du produit
      for (const variant of product.variants) {
        try {
          // Récupérer les inventory items de la variante
          const variantResponse = await axios.get(
            `${MEDUSA_BACKEND_URL}/admin/variants/${variant.id}`,
            {
              headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
              }
            }
          );

          const inventoryItems = variantResponse.data.variant.inventory_items || [];

          if (inventoryItems.length === 0) {
            console.log(`⚠️  ${product.title} (${variant.sku}): pas d'inventory item`);
            continue;
          }

          const inventoryItemId = inventoryItems[0].inventory_item_id;

          // Mettre à jour le stock pour cette location
          await axios.post(
            `${MEDUSA_BACKEND_URL}/admin/inventory-items/${inventoryItemId}/location-levels`,
            {
              location_id: LOCATION_ID,
              stocked_quantity: stockQuantity,
            },
            {
              headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
              }
            }
          );

          console.log(`✅ ${variant.sku}: stock mis à jour → ${stockQuantity}`);
          updated++;

        } catch (error) {
          console.error(`❌ Erreur pour ${variant.sku}:`, error.response?.data?.message || error.message);
          errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Terminé: ${updated} variantes mises à jour`);
    console.log(`⚠️  ${skipped} produits ignorés (pas de stock tag)`);
    console.log(`❌ ${errors} erreurs`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Lancer le script
updateStockFromTags();
