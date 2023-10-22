const { app, BrowserWindow, dialog, ipcMain, BrowserView } = require("electron");
// remoteMain.initialize();
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true
const path = require("path");
const ElectronPDF = require('electron-pdf')
let express = require('express')
let bodyParser = require('body-parser')
let printApp = express()
printApp.use(bodyParser.json())
let exporter = new ElectronPDF()
let port = 9394
let hostname = '127.0.0.1'
// console.log(exporter)
exporter.on('charged', () => {
  //Only start the express server once the exporter is ready
  // printApp.listen(port, hostname, function () {
  //   console.log(`Export Server running at http://${hostname}:${port}`);
  // })
})
exporter.start()

// printApp.post('/pdfexport', function (req, res) {
//   console.log(req.body.target)

// })

let baseHeight = 558
// const bmListener = require("blive-message-listener")
// const startListen = bmListener.startListen
// const handler = {
//   onIncomeDanmu: (msg) => {
//     console.log(msg.id, msg.body)
//   },
//   onIncomeSuperChat: (msg) => {
//     console.log(msg.id, msg.body)
//   },
// }

// const instance = startListen(22889518, handler)

// instance.close()
let saved = false;
// try {
//   require("electron-reloader")(module);
// } catch { }
app.disableHardwareAcceleration();
let ipc = require("electron").ipcMain;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 680,
    height: baseHeight,
    frame: true,
    resizable: false,
    backgroundColor: '#212529',
    // titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#2f3241",
      symbolColor: "#74b1be",
    },
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  // win.loadUrl(`file://${__dirname}/index.html`);
  let view = new BrowserView();
  win.setBrowserView(view);
  view.setAutoResize({ width: true, height: true });
  win.loadFile("index.html");
  win.webContents.openDevTools({ mode: "detach" });
  win.on("close", (e) => {
    app.quit();
    app.exit();
  });
  win.on("closed", () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
    app.quit();
    app.exit();
  });
}
app.allowRendererProcessReuse = false;
app.whenReady().then(() => {
  createWindow();
  // let testoptions = {
  //   pageSize: "A4",
  //   landscape: true,
  //   marginsType: 1
  // }
  // let testjobOptions = {
  //   /**
  //     r.results[] will contain the following based on inMemory
  //         false: the fully qualified path to a PDF file on disk
  //         true: The Buffer Object as returned by Electron

  //     Note: the default is false, this can not be set using the CLI
  //   */
  //   // waitForJSEvent: 'loadComplete',
  //   inMemory: false,
  //   closeWindow: false
  // }
  // exporter.createJob('./webPage/index.html', 'generate.pdf', testoptions, testjobOptions).then(job => {
  //   job.on('job-complete', (r) => {
  //     // win.webContents.send("printComplete", r.results);
  //     // Process the PDF file(s) here
  //   })
  //   job.render()
  // })
  ipcMain.on('windowHeightUpdate', (e, offset) => {
    win.setBounds({ width: 680, height: baseHeight + offset })
  })
  ipcMain.on('selectGenerateFolder', (e, defaultPath) => {
    dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择PDF文件生成路径',
      defaultPath: defaultPath,
    }).then(result => {
      win.webContents.send("folderSelected", { status: true, result: result });
    }).catch(err => {
      win.webContents.send("folderSelected", { status: false, result: err });
    })
  })
  ipcMain.on('printCall', (e, printReq) => {
    let target = printReq.target
    let source = printReq.source
    // derive job arguments from request here
    // 
    let jobOptions = {
      /**
        r.results[] will contain the following based on inMemory
            false: the fully qualified path to a PDF file on disk
            true: The Buffer Object as returned by Electron
        
        Note: the default is false, this can not be set using the CLI
      */
      // waitForJSEvent: 'loadComplete',
      inMemory: false,
      closeWindow: false
    }
    let options = {
      pageSize: "A4",
      landscape: true,
      marginsType: 1,
      trustRemoteContent: true
    }
    console.log(source)
    exporter.createJob(source, target, options, jobOptions).then(job => {
      job.on('job-complete', (r) => {
        win.webContents.send("printComplete", r.results);
        // Process the PDF file(s) here
      })
      job.render()
    })
  })
  win.setMenu(null);
});
// app.on("before-quit", function () {
//   win.webContents.send("saveGlobal", "quit", __dirname, "last.json");
// });

let getTime = (YMD, DH, HMS) => {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var currentDate =
    year + YMD + month + YMD + day + DH + hours + HMS + minutes + HMS + seconds;
  return currentDate;
};

app.on("window-all-closed", function () {
  // if (process.platform !== "darwin") {
  app.quit();
  app.exit();
  // }
});
