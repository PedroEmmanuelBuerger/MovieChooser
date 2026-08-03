import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import path from "node:path";
import { registerStorageIpc } from "./storage";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function resolveAppIcon(): string | undefined {
  const candidates = [
    path.join(__dirname, "icon.ico"),
    path.join(__dirname, "../build/icon.ico"),
    path.join(process.resourcesPath, "icon.ico"),
  ];

  for (const candidate of candidates) {
    const image = nativeImage.createFromPath(candidate);

    if (!image.isEmpty()) {
      return candidate;
    }
  }

  return undefined;
}

function createWindow(): void {
  const icon = resolveAppIcon();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#0a0a0a",
    title: "MovieChooser",
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

void app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.pedroemmanuelbuerger.moviechooser");
  }

  ipcMain.handle("app:get-version", () => app.getVersion());
  registerStorageIpc();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
