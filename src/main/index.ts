import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Get ffmpeg version (reply to renderer)
  ipcMain.handle('get-ffmpeg-version', async () => {
    return new Promise((resolve, reject) => {
      exec('ffmpeg -version', (error, stdout, _stderr) => {
        if (error) {
          reject(error)
          return
        }
        resolve(stdout)
      })
    })
  })

  // Convert video files
  ipcMain.handle('convert', (_event, filePaths) => {
    /*
    Command to execute: ffmpeg -i <filename> -c:v prores_ks -profile:v 3 -qscale:v 9 -acodec pcm_s16le <filename>.mkv
    */
    const files = JSON.parse(filePaths)
    return new Promise(async (resolve, reject) => {
      for (const file of files) {
        const output = file.replace(/\.[^/.]+$/, '.mkv')
        exec(`ffmpeg -i "${file}" -c:v prores_ks -profile:v 3 -qscale:v 9 -acodec pcm_s16le "${output}"`, (error, stdout, _stderr) => {
          if (error) {
            reject(error)
            return
          }
          resolve(stdout)
        })
      }
    }
    )
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
