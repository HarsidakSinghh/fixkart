const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Simple env parser
const parseEnv = (content) => {
    const res = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            res[key] = value;
        }
    });
    return res;
};

// Load .env
const envPath = path.join(process.cwd(), '.env');
const localEnvPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(localEnvPath)) {
    const envConfig = parseEnv(fs.readFileSync(localEnvPath, 'utf8'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}
if (fs.existsSync(envPath)) {
    const envConfig = parseEnv(fs.readFileSync(envPath, 'utf8'));
    for (const k in envConfig) {
        if (!process.env[k]) {
            process.env[k] = envConfig[k];
        }
    }
}

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'fixkart/invoices/invoice-cmkmnc0ou000510f39n1r9rhp.pdf';

const url = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload", // tried 'upload' first
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
});

console.log("Signed URL:");
console.log(url);

// Test it
fetch(url, { method: 'HEAD' })
    .then(res => {
        console.log(`\nStatus: ${res.status} ${res.statusText}`);
        if (res.ok) console.log("✅ Signed URL is accessible");
        else console.log("❌ Signed URL failed");
    })
    .catch(err => console.error("Fetch error:", err));
