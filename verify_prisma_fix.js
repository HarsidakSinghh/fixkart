
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking prisma keys...');
    const keys = Object.keys(prisma);
    // internal properties often start with _, so we look for models.
    // Actually, properties like 'user', 'order' are usually on the instance or prototype.
    // A better check is to see if we can access it.

    if (prisma.purchaseOrder) {
        console.log('SUCCESS: prisma.purchaseOrder is defined.');
    } else {
        console.log('FAILURE: prisma.purchaseOrder is undefined.');
        console.log('Available keys on prisma:', Object.keys(prisma));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
