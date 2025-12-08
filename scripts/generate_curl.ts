import * as fs from 'fs';
import * as path from 'path';

const imagePath = process.argv[2];

if (!imagePath) {
    console.error("Usage: npx ts-node scripts/generate_curl.ts <path_to_image>");
    process.exit(1);
}

if (!fs.existsSync(imagePath)) {
    console.error(`File not found: ${imagePath}`);
    process.exit(1);
}

const imageBuffer = fs.readFileSync(imagePath);
const base64 = imageBuffer.toString('base64');

const payload = JSON.stringify({ imageBase64: base64 });
const payloadPath = 'payload.json';
fs.writeFileSync(payloadPath, payload);

// Use @payload.json to tell curl to read from the file. 
// This keeps the command line short and prevents console flooding.
const command = `curl -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d @${payloadPath}`;

const outputPathBat = 'curl_ingest.bat';

// Add @echo off to prevent echoing the command itself (though the main issue was the length)
const batContent = `@echo off
${command}
echo.
pause
`;

fs.writeFileSync(outputPathBat, batContent);

console.log(`\n[SUCCESS] Generated files:`);
console.log(` - ${payloadPath} (Contains the image data)`);
console.log(` - ${outputPathBat} (Run this to execute the test)`);
console.log(`\nTo execute: .\\${outputPathBat}`);

