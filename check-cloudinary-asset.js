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

async function checkAsset() {
    const publicId = 'fixkart/invoices/invoice-cmkmnc0ou000510f39n1r9rhp.pdf';
    let output = `Checking asset with public_id: ${publicId}\n`;

    try {
        console.log("Attempting to fetch as image...");
        let result = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        output += "Found as IMAGE:\n";
        output += JSON.stringify(result, null, 2) + "\n";
    } catch (err) {
        output += `Not found as image or error: ${err.message}\n`;
        try {
            console.log("Attempting to fetch as raw...");
            // logic for raw: use exact public_id
            let resultRaw = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
            output += "Found as RAW:\n";
            output += JSON.stringify(resultRaw, null, 2) + "\n";
        } catch (err2) {
            output += `Not found as raw or error: ${err2.message}\n`;
        }
    }

    fs.writeFileSync('asset-check.txt', output);
    console.log("Check complete. Results written to asset-check.txt");
}

checkAsset();
