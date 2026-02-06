const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local'];
const requiredKeys = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

let output = "Checking environment files...\n";

envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        output += `\nFound ${file}:\n`;
        const content = fs.readFileSync(filePath, 'utf8');
        requiredKeys.forEach(key => {
            const regex = new RegExp(`^${key}=`, 'm');
            if (regex.test(content)) {
                const match = content.match(new RegExp(`^${key}=(.*)`, 'm'));
                if (match && match[1].trim().length > 0) {
                    output += `  ✅ ${key} is present\n`;
                } else {
                    output += `  ⚠️ ${key} is present but appears empty\n`;
                }
            } else {
                output += `  ❌ ${key} is MISSING\n`;
            }
        });
    } else {
        output += `\n${file} does NOT exist.\n`;
    }
});

fs.writeFileSync('env-check.txt', output);
console.log("Check complete. Results written to env-check.txt");
