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

async function testUploads() {
    console.log("Starting test uploads...");

    // Test 1: Raw Text File
    try {
        const textBuffer = Buffer.from("Hello World - Test Raw File");
        const rawResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'raw', public_id: 'test_raw_file.txt', folder: 'test_debug' },
                (err, res) => err ? reject(err) : resolve(res)
            );
            stream.end(textBuffer);
        });

        console.log(`\nRaw Upload URL: ${rawResult.secure_url}`);
        const rawRes = await fetch(rawResult.secure_url);
        console.log(`Raw Access Status: ${rawRes.status}`);

    } catch (err) {
        console.error("Raw Upload Failed:", err.message);
    }

    // Test 2: Dummy Image (1x1 pixel)
    try {
        // 1x1 white transparent pixel png
        const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const imgBuffer = Buffer.from(imgBase64, 'base64');

        const imgResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'image', public_id: 'test_img_file', folder: 'test_debug' },
                (err, res) => err ? reject(err) : resolve(res)
            );
            stream.end(imgBuffer);
        });

        console.log(`\nImage Upload URL: ${imgResult.secure_url}`);
        const imgRes = await fetch(imgResult.secure_url);
        console.log(`Image Access Status: ${imgRes.status}`);

    } catch (err) {
        console.error("Image Upload Failed:", err.message);
    }
}

testUploads();
