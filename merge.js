const sharp = require('sharp');

function mergePhotosToFrame(photos, framePath, outputPath, done) {
    sharp(framePath)
        .composite(photos.map((p, i) => ({
            input: p,
            top: 50 + (i * 200),
            left: 50
        })))
        .toFile(outputPath)
        .then(() => done())
        .catch(console.error);
}

module.exports = mergePhotosToFrame;
