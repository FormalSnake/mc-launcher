const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const { Client } = require("minecraft-launcher-core");
const launcher = new Client();
//Import the auth class
const { auth } = require("msmc");
//Create a new auth manager
const authManager = new auth("select_account");
const windowStateKeeper = require("electron-window-state");
let mainWindow;

function createWindow() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  // Create the window using the state information
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: "hidden",
    titleBarOverlay: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadFile("./src/frontend/pages/index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("minecraft", (event, version) => {
  launchMinecraft(version);
});

function launchMinecraft(version) {
  //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')
  authManager.launch("electron").then(async (xboxManager) => {
    //Generate the minecraft login token
    const token = await xboxManager.getMinecraft();
    // Pulled from the Minecraft Launcher core docs.
    let opts = {
      clientPackage: null,
      // Simply call this function to convert the msmc minecraft object into a mclc authorization object
      authorization: token.mclc(),
      root: "./.minecraft",
      version: {
        number: version.toString(),
        type: "release",
      },
      memory: {
        max: "6G",
        min: "4G",
      },
    };
    console.log("Starting!");
    launcher.launch(opts);

    launcher.on("debug", (e) => console.log(e));
    launcher.on("data", (e) => console.log(e));
  });
}
