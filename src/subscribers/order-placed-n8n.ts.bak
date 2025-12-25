import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function handleOrderPlaced({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const orderId = data.id

    // Resolve the Order Module Service
    // Using string "order" to ensure compatibility if Modules enum is not directly available in this scope
    const orderService = container.resolve("order")

    if (!orderService) {
        console.error("Order Service not found in container")
        return
    }

    // Retrieve the order with relations
    // Note: Adjust relation names based on exact Medusa V2 data model if needed
    const order = await orderService.retrieveOrder(orderId, {
        relations: [
            "items",
            "shipping_address",
            "billing_address",
            "customer"
        ],
    })

    // Send to N8N
    const n8nUrl = process.env.N8N_ORDER_WEBHOOK_URL

    if (!n8nUrl) {
        console.warn("N8N_ORDER_WEBHOOK_URL is not set. Skipping N8N notification for order:", orderId)
        return
    }

    try {
        const response = await fetch(n8nUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(order),
        })

        if (!response.ok) {
            console.error(`Failed to send order ${orderId} to N8N: ${response.statusText}`)
        } else {
            console.log(`Successfully sent order ${orderId} to N8N`)
        }
    } catch (error) {
        console.error(`Error sending order ${orderId} to N8N:`, error)
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
