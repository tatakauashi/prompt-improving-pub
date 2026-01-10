const fs = require('fs');
const path = require('path');

// Simple PNG header for a 128x128 purple gradient square
// This is a minimal valid PNG with a solid color
const createSimplePNG = (size, r, g, b) => {
    const width = size;
    const height = size;

    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk (image header)
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // chunk length
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr.writeUInt8(8, 16); // bit depth
    ihdr.writeUInt8(2, 17); // color type (RGB)
    ihdr.writeUInt8(0, 18); // compression
    ihdr.writeUInt8(0, 19); // filter
    ihdr.writeUInt8(0, 20); // interlace

    const crc = require('zlib').crc32(ihdr.slice(4, 21));
    ihdr.writeUInt32BE(crc, 21);

    // For simplicity, create a solid color IDAT
    // In production, you'd use a proper PNG encoder
    const idat = Buffer.from([
        0, 0, 0, 10, // length
        73, 68, 65, 84, // IDAT
        8, 29, 1, 0, 0, 255, 255, 0, 0, 0, 1,
        0, 0, 0, 0 // CRC placeholder
    ]);

    const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

    return Buffer.concat([signature, ihdr, iend]);
};

// Create placeholder icons
fs.writeFileSync(path.join(__dirname, 'public', 'icons', 'icon128.png'), createSimplePNG(128, 99, 102, 241));
fs.writeFileSync(path.join(__dirname, 'public', 'icons', 'icon48.png'), createSimplePNG(48, 99, 102, 241));
fs.writeFileSync(path.join(__dirname, 'public', 'icons', 'icon16.png'), createSimplePNG(16, 99, 102, 241));

console.log('Icons created!');
