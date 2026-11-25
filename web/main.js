const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "ChatNet - Escritorio",
    webPreferences: {
      nodeIntegration: false, // CAMBIADO: Más seguro
      contextIsolation: true, // CAMBIADO: Más seguro
      webSecurity: false, // Dejamos esto para evitar problemas de CORS locales
    },
  });

  win.loadURL('http://localhost:3000/?v=1');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});