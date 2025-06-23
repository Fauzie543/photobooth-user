const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const takePhotos = require('./camera');
const mergePhotosToFrame = require('./merge');

function createMainWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createMainWindow);



// EVENT: Setelah pembayaran sukses
ipcMain.handle('capture-photo', async (event, { index }) => {
  const Webcam = require('node-webcam');
  const fs = require('fs');
  const options = {
    width: 1280,
    height: 720,
    quality: 100,
    output: 'jpeg',
    callbackReturn: 'location',
  };

  return new Promise((resolve, reject) => {
    const filename = `photo_${Date.now()}_${index}.jpg`;
    const filepath = path.join(__dirname, 'assets', filename);

    Webcam.capture(filepath, options, (err) => {
      if (err) return reject(err);
      resolve(filepath);
    });
  });
});



ipcMain.handle('save-final-photo', async (event, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
  const filename = `hasil_${Date.now()}.jpg`;
  const finalDir = path.join(__dirname, 'final');

  if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir);

  const filePath = path.join(finalDir, filename);
  fs.writeFileSync(filePath, base64Data, 'base64');
  return filePath;
});

ipcMain.handle('save-photo-blob', async (event, dataUrl, filename) => {
  const fs = require('fs');
  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
  const photoPath = path.join(__dirname, 'assets', filename);

  fs.writeFileSync(photoPath, base64Data, 'base64');
  return photoPath;
});

ipcMain.handle('print-photo', async (event, filePath) => {
  const { BrowserWindow } = require('electron');

  return new Promise(async (resolve, reject) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const html = `
      <html>
        <body style="margin:0;padding:0;">
          <img src="file://${filePath.replace(/\\/g, "/")}" style="width:100%;height:auto;" />
        </body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({
        silent: true,          // 🟢 Print tanpa dialog
        printBackground: true, // 🔄 Cetak background jika ada
        deviceName: 'Canon iP2700 series'         // 🔧 Kosongkan jika ingin pakai printer default
      }, (success, errorType) => {
        if (!success) {
          console.error("Print error:", errorType);
          reject(new Error(errorType));
        } else {
          resolve(true);
        }
        setTimeout(() => printWindow.close(), 1000); // Tutup jendela setelah print
      });
    });
  });
});


