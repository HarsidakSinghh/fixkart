const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestInvoice() {
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
            console.log(`Latest Order ID: ${order.id}`);
            console.log(`Updated At: ${order.updatedAt}`);
            console.log(`Invoice URL: ${order.invoiceUrl}`);
        } else {
            console.log("No orders found with an invoiceUrl.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestInvoice();
