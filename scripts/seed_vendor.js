const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_EMAIL = 'sidak798@gmail.com';

async function fetchClerkUserId(email) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error('CLERK_SECRET_KEY is not set. Export it before running this script.');
  }

  const res = await fetch(`https://api.clerk.dev/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Failed to fetch Clerk user: ${message}`);
  }

  const users = await res.json();
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`No Clerk user found for ${email}. Sign in once to create the Clerk user.`);
  }

  return users[0].id;
}

async function main() {
  let customer = await prisma.customerProfile.findFirst({
    where: { email: TARGET_EMAIL },
  });

  let userId;
  if (!customer) {
    userId = await fetchClerkUserId(TARGET_EMAIL);
    customer = await prisma.customerProfile.create({
      data: {
        userId,
        status: 'APPROVED',
        fullName: 'Sidak Customer',
        companyName: 'Sidak Industries',
        phone: '0000000000',
        email: TARGET_EMAIL,
        address: 'Fixkart Customer Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        category: 'Industrial',
        businessType: 'Proprietorship',
        yearsInBusiness: '3',
      },
    });
  } else {
    userId = customer.userId;
  }

  const vendor = await prisma.vendorProfile.upsert({
    where: { userId },
    update: {
      status: 'APPROVED',
      email: TARGET_EMAIL,
    },
    create: {
      userId,
      status: 'APPROVED',
      fullName: customer.fullName || 'Sidak Vendor',
      companyName: customer.companyName || 'Sidak Industries',
      gstNumber: customer.gstNumber || 'GSTIN-SIDAK-001',
      phone: customer.phone || '0000000000',
      email: TARGET_EMAIL,
      address: customer.address || 'Fixkart Vendor Lane',
      city: customer.city || 'Mumbai',
      state: customer.state || 'Maharashtra',
      postalCode: customer.postalCode || '400001',
      businessType: customer.businessType || 'Proprietorship',
      yearsInBusiness: customer.yearsInBusiness || '3',
      tradeLicense: customer.tradeLicense || 'TL-SIDAK-001',
      category: customer.category || 'Fastening & Joining',
    },
  });

  const existingProducts = await prisma.product.findMany({
    where: { vendorId: userId },
    take: 1,
  });

  if (existingProducts.length === 0) {
    const now = Date.now();
    const baseProducts = [
      {
        name: 'hex-bolt-m8',
        title: 'Hex Bolt M8 (Stainless Steel)',
        category: 'Fastening & Joining',
        subCategory: 'Bolts',
        image: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=800',
        price: 18,
      },
      {
        name: 'anchor-fastener-12mm',
        title: 'Anchor Fastener 12mm',
        category: 'Fastening & Joining',
        subCategory: 'Anchors',
        image: 'https://images.unsplash.com/photo-1532635248-6e7b5f9a6f59?w=800',
        price: 42,
      },
      {
        name: 'threaded-rod-1m',
        title: 'Threaded Rod 1m',
        category: 'Fastening & Joining',
        subCategory: 'Threaded Rods',
        image: 'https://images.unsplash.com/photo-1586864388052-78c1bdc8b38a?w=800',
        price: 75,
      },
    ];

    await Promise.all(
      baseProducts.map((p, idx) =>
        prisma.product.create({
          data: {
            vendorId: userId,
            name: p.name,
            title: p.title,
            slug: `${p.name}-${userId.slice(-6)}-${now}-${idx}`,
            description: `${p.title} with industrial-grade specifications.`,
            category: p.category,
            subCategory: p.subCategory,
            image: p.image,
            gallery: [p.image],
            price: p.price,
            quantity: 120,
            sku: `${p.name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${userId.slice(-4)}-${now}-${idx}`,
            status: 'APPROVED',
            isPublished: true,
            isFeatured: false,
          },
        })
      )
    );
  }

  console.log('Vendor seeded:', vendor.userId, vendor.companyName);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
