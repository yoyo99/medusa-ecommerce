import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

// Event for Medusa V2: "inventory-item.updated" or "inventory-level.updated"
// "inventory-level.updated" is triggered when stock level changes at a location.
// "inventory-item.updated" is triggered when item details change.
// We want to monitor stock levels, so "inventory-level.updated" is appropriate.

export default async function handleInventoryUpdate({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    // data.id here is likely the InventoryLevel ID or InventoryItem ID depending on event
    // For 'inventory-level.updated', data usually contains { id: string, inventory_item_id: string, location_id: string }

    const inventoryService = container.resolve("inventory")

    if (!inventoryService) {
        console.error("Inventory Service not found")
        return
    }

    // Retrieve the specific inventory level or item to check quantity
    // We'll try to retrieve the Inventory Item with level details
    try {
        // In V2, we often use the remote query or module service directly
        // Let's assume data.id is the InventoryLevel ID

        const [inventoryLevel] = await inventoryService.listInventoryLevels({ id: data.id })

        if (!inventoryLevel) {
            console.warn("Inventory Level not found:", data.id)
            return
        }

        const stockedQuantity = inventoryLevel.stocked_quantity
        const THRESHOLD = 5

        if (stockedQuantity < THRESHOLD) {
            console.log(`Low stock detected for item ${inventoryLevel.inventory_item_id}: ${stockedQuantity} remaining.`)

            const n8nUrl = process.env.N8N_INVENTORY_WEBHOOK_URL
            if (n8nUrl) {
                const payload = {
                    event: "low_stock_alert",
                    inventory_item_id: inventoryLevel.inventory_item_id,
                    stocked_quantity: stockedQuantity,
                    location_id: inventoryLevel.location_id,
                    data: data
                }

                await fetch(n8nUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                    .catch(err => console.error("Failed to send low stock alert to N8N:", err))
            }
        }

    } catch (error) {
        console.error("Error in inventory-monitor:", error)
    }
}

export const config: SubscriberConfig = {
    event: "inventory-level.updated",
}
