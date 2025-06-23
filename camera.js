const Webcam = require('node-webcam');
const path = require('path');

const options = {
    width: 1280,
    height: 720,
    quality: 100,
    output: 'jpeg',
    callbackReturn: 'location'
};

function takePhotos(slotCount) {
    return new Promise((resolve, reject) => {
        const photoPaths = [];
        let i = 0;

        const takeNext = () => {
            if (i >= slotCount) return resolve(photoPaths);

            const photoName = `photo_${Date.now()}_${i}.jpg`;
            const output = path.join(__dirname, 'assets', photoName);

            Webcam.capture(output, options, (err) => {
                if (err) return reject(err);
                photoPaths.push(output);
                i++;
                setTimeout(takeNext, 3000); // delay 3 detik antar foto
            });
        };

        takeNext();
    });
}

module.exports = takePhotos;
