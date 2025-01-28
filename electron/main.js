const { app, BrowserWindow } = require("electron");
const path = require("path");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    // open the port that next.js using.
    win.loadURL("http://localhost:3000");
}

app.on("ready", () => {
    createWindow();
});

app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit();
    }
});