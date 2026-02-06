const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkLatestInvoice() {
    let output = "Debug Report:\n";
    try {
        console.log("Fetching latest updated order...");
        const order = await prisma.order.findFirst({
            where: {
                invoiceUrl: { not: null }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            select: {
                id: true,
                invoiceUrl: true,
                updatedAt: true
            }
        });

        if (order) {
            output += `Latest Order ID: ${order.id}\n`;
            output += `Updated At: ${order.updatedAt}\n`;
            output += `Invoice URL: ${order.invoiceUrl}\n`;

            console.log(`Checking URL: ${order.invoiceUrl}`);

            // Test the URL
            try {
                const response = await fetch(order.invoiceUrl, { method: 'HEAD' });
                output += `HTTP Status: ${response.status} ${response.statusText}\n`;
                output += `Content-Type: ${response.headers.get('content-type')}\n`;
                output += `Content-Length: ${response.headers.get('content-length')}\n`;

                if (response.ok) {
                    output += "✅ URL is accessible.\n";
                } else {
                    output += "❌ URL is NOT accessible.\n";
                }

            } catch (err) {
                output += `❌ Error fetching URL: ${err.message}\n`;
            }

        } else {
            output += "No orders found with an invoiceUrl.\n";
        }
    } catch (error) {
        output += `Database Error: ${error.message}\n`;
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync('invoice-debug.txt', output);
        console.log("Debug complete. Results written to invoice-debug.txt");
    }
}

checkLatestInvoice();
