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

async function testPdfUpload() {
    console.log("Testing PDF Upload (auto)...");

    try {
        // Minimal valid PDF content
        const pdfContent = "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R/Resources<<>>>>endobj xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref\n223\n%%EOF";
        const pdfBuffer = Buffer.from(pdfContent);

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'test_debug',
                    public_id: 'test_pdf_auto.pdf' // Explicitly adding extension to ID
                },
                (err, res) => err ? reject(err) : resolve(res)
            );
            stream.end(pdfBuffer);
        });

        console.log(`\nPDF Upload URL: ${result.secure_url}`);
        console.log(`Resource Type: ${result.resource_type}`);

        const res = await fetch(result.secure_url);
        console.log(`Access Status: ${res.status} ${res.statusText}`);

    } catch (err) {
        console.error("PDF Upload Failed:", err.message);
    }
}

testPdfUpload();
