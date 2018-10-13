// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';
import path from 'path';
import { clearCache } from './utils/utils';

export default class MenuBuilder {
  mainWindow: BrowserWindow;
  creditsWindow: BrowserWindow;
  workerWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow, creditsWindow: BrowserWindow, workerWindow: BrowserWindow, opencvWorkerWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.creditsWindow = creditsWindow;
    this.workerWindow = workerWindow;
    this.opencvWorkerWindow = opencvWorkerWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Electron',
      submenu: [
        { label: 'About MoviePrint_v004', selector: 'orderFrontStandardAboutPanel:' },
        { label: 'Credits', click: () => { this.creditsWindow.show(); } },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide MoviePrint_v004', accelerator: 'Command+H', selector: 'hide:' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', selector: 'hideOtherApplications:' },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', click: () => { this.mainWindow.send('undo'); } },
        { label: 'Redo', accelerator: 'Shift+Command+Z', click: () => { this.mainWindow.send('redo'); } },
        // { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        // { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        // { type: 'separator' },
        // { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        // { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        // { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        // { label: 'Select All', accelerator: 'Command+A', selector: 'selectAll:' }
      ]
    };
    const subMenuDev = {
      label: 'Development',
      submenu: [
        { label: 'Reset application', accelerator: 'Shift+Alt+Command+C', click: () => { clearCache(this.mainWindow); } },
        { label: 'Reload application', accelerator: 'Command+R', click: () => {
          this.mainWindow.webContents.reload();
          this.workerWindow.webContents.reload();
          this.opencvWorkerWindow.webContents.reload();
        } },
        { label: 'Reload mainWindow', accelerator: 'Ctrl+Command+R', click: () => { this.mainWindow.webContents.reload(); } },
        { label: 'Reload Worker', accelerator: 'Alt+Command+R', click: () => { this.workerWindow.webContents.reload(); } },
        { label: 'Reload Opencv Worker', accelerator: 'Shift+Command+R', click: () => { this.opencvWorkerWindow.webContents.reload(); } },
        { label: 'Toggle Developer Tools', accelerator: 'Alt+Command+I', click: () => { this.mainWindow.toggleDevTools(); } },
        { label: 'Toggle Developer Tools for Worker', accelerator: 'Alt+Command+J', click: () => { this.workerWindow.toggleDevTools(); } },
        { label: 'Toggle Developer Tools for Opencv Worker', accelerator: 'Alt+Command+K', click: () => { this.opencvWorkerWindow.toggleDevTools(); } },
        { label: 'Show Worker', click: () => { this.workerWindow.show(); } },
        { label: 'Show OpenCvWorker', click: () => { this.opencvWorkerWindow.show(); } },
        { label: 'Show log file', click: () => {
          shell.showItemInFolder(path.resolve(process.env.HOME || process.env.USERPROFILE, 'Library/Logs/', app.getName()));
        } },
      ]
    };
    const subMenuView = {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Command+F', click: () => { this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen()); } },
        { type: 'separator' },
        { label: 'Reset application', accelerator: 'Shift+Alt+Command+C', click: () => { clearCache(this.mainWindow); } },
        { label: 'Reload application', accelerator: 'Command+R', click: () => {
          this.mainWindow.webContents.reload();
          this.workerWindow.webContents.reload();
          this.opencvWorkerWindow.webContents.reload();
        } },
        { type: 'separator' },
        { label: 'Restart in debug mode', accelerator: 'Shift+Alt+Ctrl+X', click: () => {
          app.relaunch({
            args: process.argv.slice(1).concat(['--debug'])
          });
          app.exit(0);
          }
        }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Main window', click: () => { this.mainWindow.show(); } },
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Home',
          click() {
            shell.openExternal('https://movieprint.fakob.com');
          }
        },
        {
          label: 'Development',
          click() {
            shell.openExternal(
              'https://github.com/fakob/MoviePrint_v004'
            );
          }
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004/issues');
          }
        }
      ]
    };

    const menuArray = (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
    ) ?
      [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp, subMenuDev] :
      [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
    return menuArray;
  }

  buildDefaultTemplate() {
    const subMenuAbout = {
      label: '&File',
      submenu: [
        // {
        //   label: '&Open',
        //   accelerator: 'Ctrl+O'
        // },
        { type: 'separator' },
        {
          label: '&Close',
          accelerator: 'Ctrl+W',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Ctrl+Z', click: () => { this.mainWindow.send('undo'); } },
        { label: 'Redo', accelerator: 'Shift+Ctrl+Z', click: () => { this.mainWindow.send('redo'); } },
        { type: 'separator' },
        { label: 'Reset application', accelerator: 'Shift+Alt+Ctrl+C', click: () => { clearCache(this.mainWindow); } },
        { label: 'Reload application', accelerator: 'Ctrl+R', click: () => {
          this.mainWindow.webContents.reload();
          this.workerWindow.webContents.reload();
          this.opencvWorkerWindow.webContents.reload();
        } }
      ]
    };
    const subMenuDev = {
      label: 'Development',
      submenu: [
        { label: 'Reset application', accelerator: 'Shift+Alt+Ctrl+C', click: () => { clearCache(this.mainWindow); } },
        { label: '&Reload application', accelerator: 'Ctrl+R', click: () => {
          this.mainWindow.webContents.reload();
          this.workerWindow.webContents.reload();
          this.opencvWorkerWindow.webContents.reload();
        } },
        { label: 'Reload mainWindow', accelerator: 'Ctrl+R', click: () => { this.mainWindow.webContents.reload(); } },
        { label: 'Reload Worker', accelerator: 'Alt+Ctrl+R', click: () => { this.workerWindow.webContents.reload(); } },
        { label: 'Reload Opencv Worker', accelerator: 'Shift+Ctrl+R', click: () => { this.opencvWorkerWindow.webContents.reload(); } },
        { label: 'Toggle Developer Tools', accelerator: 'Alt+Ctrl+I', click: () => { this.mainWindow.toggleDevTools(); } },
        { label: 'Toggle Developer Tools for Worker', accelerator: 'Alt+Ctrl+J', click: () => { this.workerWindow.toggleDevTools(); } },
        { label: 'Toggle Developer Tools for Opencv Worker', accelerator: 'Alt+Ctrl+K', click: () => { this.opencvWorkerWindow.toggleDevTools(); } },
        { label: 'Show Worker', click: () => { this.workerWindow.show(); } },
        { label: 'Show OpenCvWorker', click: () => { this.opencvWorkerWindow.show(); } },
        { label: 'Show log file', click: () => {
          shell.showItemInFolder(path.resolve(process.env.HOME || process.env.USERPROFILE, 'AppData\Roaming\\', app.getName()));
        } },
      ]
    };
    const subMenuView = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => {
            this.mainWindow.setFullScreen(
              !this.mainWindow.isFullScreen()
            );
          }
        },
        { type: 'separator' },
        { label: 'Restart in debug mode', accelerator: 'Shift+Alt+Ctrl+X', click: () => {
          app.relaunch({
            args: process.argv.slice(1).concat(['--debug'])
          });
          app.exit(0);
          }
        }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Main window', click: () => { this.mainWindow.show(); } },
        { label: 'Minimize', accelerator: 'Ctrl+M', selector: 'performMiniaturize:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Home',
          click() {
            shell.openExternal('https://movieprint.fakob.com');
          }
        },
        {
          label: 'Development',
          click() {
            shell.openExternal(
              'https://github.com/fakob/MoviePrint_v004'
            );
          }
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004/issues');
          }
        },
        { type: 'separator' },
        { label: 'About MoviePrint_v004', selector: 'orderFrontStandardAboutPanel:' },
        { label: 'Credits', click: () => { this.creditsWindow.show(); } },
      ]
    };

    const menuArray = (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
    ) ?
      [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp, subMenuDev] :
      [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
    return menuArray;
  }
}
