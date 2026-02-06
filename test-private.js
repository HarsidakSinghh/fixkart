const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

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

async function testPrivateUrl() {
    console.log("Testing Private Download URL...");

    try {
        // 1. Upload a raw PDF as authenticated
        const pdfContent = "Dummy PDF Content";
        const pdfBuffer = Buffer.from(pdfContent);
        const publicId = `debug_private_${Date.now()}.pdf`;

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    type: 'authenticated',
                    folder: 'test_debug',
                    public_id: publicId
                },
                (err, res) => err ? reject(err) : resolve(res)
            );
            stream.end(pdfBuffer);
        });

        console.log(`Uploaded Public ID: ${uploadResult.public_id}`);

        // 2. Generate Private Download URL
        const options = {
            resource_type: "raw",
            type: "authenticated",
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        };

        // Note: private_download_url builds URL for specific public_id/format
        // The signature is different from generic signed url
        const url = cloudinary.utils.private_download_url(uploadResult.public_id, "pdf", options);

        console.log(`Private URL: ${url}`);

        // 3. Access
        const res = await fetch(url);
        console.log(`Access Status: ${res.status} ${res.statusText}`);

    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

testPrivateUrl();
