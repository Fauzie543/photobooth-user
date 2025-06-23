const { ipcRenderer } = require('electron');
const QRCode = require('qrcode');

ipcRenderer.on('show-preview', (e, imgPath, downloadUrl) => {
    document.getElementById('result-photo').src = imgPath;
    QRCode.toCanvas(document.getElementById('qrcode'), downloadUrl, function (err) {
        if (err) console.error(err);
    });
});
