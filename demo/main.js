const { app, BrowserWindow, Menu } = require("electron");
app.commandLine.appendSwitch('enable-features','SharedArrayBuffer')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true
    },
  });

  mainWindow.loadFile(".app/index.html");
  mainWindow.setMenu(Menu.buildFromTemplate([]));
  mainWindow.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

