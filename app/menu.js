// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { getPathOfLogFileAndFolder, resetApplication, reloadApplication, softResetApplication } from './utils/utilsForMain';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  workerWindow: BrowserWindow;

  constructor(
    mainWindow: BrowserWindow,
    workerWindow: BrowserWindow,
    opencvWorkerWindow: BrowserWindow,
    databaseWorkerWindow: BrowserWindow,
  ) {
    this.mainWindow = mainWindow;
    this.workerWindow = workerWindow;
    this.opencvWorkerWindow = opencvWorkerWindow;
    this.databaseWorkerWindow = databaseWorkerWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === 'darwin' ? this.buildDarwinTemplate() : this.buildDefaultTemplate();

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
          },
        },
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Electron',
      submenu: [
        { label: 'About MoviePrint_v004', selector: 'orderFrontStandardAboutPanel:' },
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
          },
        },
      ],
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          click: () => {
            this.mainWindow.send('undo');
          },
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          click: () => {
            this.mainWindow.send('redo');
          },
        },
        // { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        // { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'Command+A', selector: 'selectAll:' },
      ],
    };
    const subMenuDev = {
      label: 'Development',
      submenu: [
        {
          label: 'Reset application',
          accelerator: 'Shift+Alt+Command+C',
          click: () => {
            resetApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Soft reset application',
          accelerator: 'Shift+Alt+Command+V',
          click: () => {
            softResetApplication(
              this.mainWindow,
              this.workerWindow,
              this.opencvWorkerWindow,
              this.databaseWorkerWindow,
            );
          },
        },
        {
          label: 'Reload application',
          accelerator: 'Command+R',
          click: () => {
            reloadApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Reload mainWindow',
          accelerator: 'Ctrl+Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Worker',
          accelerator: 'Alt+Command+R',
          click: () => {
            this.workerWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Opencv Worker',
          accelerator: 'Shift+Command+R',
          click: () => {
            this.opencvWorkerWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Database Worker',
          accelerator: 'Alt+Shift+Command+R',
          click: () => {
            this.databaseWorkerWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Worker',
          accelerator: 'Alt+Command+J',
          click: () => {
            this.workerWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Opencv Worker',
          accelerator: 'Alt+Command+K',
          click: () => {
            this.opencvWorkerWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Database Worker',
          accelerator: 'Alt+Shift+Command+K',
          click: () => {
            this.databaseWorkerWindow.toggleDevTools();
          },
        },
        {
          label: 'Show Worker',
          click: () => {
            this.workerWindow.show();
          },
        },
        {
          label: 'Show OpenCv Worker',
          click: () => {
            this.opencvWorkerWindow.show();
          },
        },
        {
          label: 'Show Database Worker',
          click: () => {
            this.databaseWorkerWindow.show();
          },
        },
        {
          label: 'Show log file',
          click: () => {
            const { pathOfLogFile, pathOfLogFolder} = getPathOfLogFileAndFolder(process.platform, app.getName());
            if (fs.existsSync(pathOfLogFile)) {
              shell.showItemInFolder(pathOfLogFile);
            } else {
              shell.showItemInFolder(pathOfLogFolder);
            }
          },
        },
        {
          label: 'Show database file',
          click: () => {
            const moviePrintDBPath = path.join(app.getPath('userData'), 'moviePrint_frames.db');
            if (fs.existsSync(moviePrintDBPath)) {
              shell.showItemInFolder(moviePrintDBPath);
            } else {
              shell.showItemInFolder(app.getPath('userData'));
            }
          },
        },
      ],
    };
    const subMenuView = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Fit MoviePrint',
          accelerator: 'Command+0',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'resetZoom');
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'Command+=',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'zoomIn');
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'Command+-',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'zoomOut');
          },
        },
        { type: 'separator' },
        {
          label: 'Reload application',
          accelerator: 'Command+R',
          click: () => {
            reloadApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Reset application',
          accelerator: 'Shift+Alt+Command+C',
          click: () => {
            resetApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        { type: 'separator' },
        {
          label: 'Restart in debug mode',
          accelerator: 'Shift+Alt+Ctrl+X',
          click: () => {
            app.relaunch({
              args: process.argv.slice(1).concat(['--debug']),
            });
            app.exit(0);
          },
        },
      ],
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Main window',
          click: () => {
            this.mainWindow.show();
          },
        },
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Help',
          click() {
            shell.openExternal('https://movieprint.org/help/');
          },
        },
        { type: 'separator' },
        {
          label: 'Development',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004/issues');
          },
        },
        { type: 'separator' },
        {
          label: `MoviePrint version: ${app.getVersion()}`,
          enabled: false,
        },
        {
          label: 'Changelog',
          click() {
            shell.openExternal('https://movieprint.org/download/');
          },
        },
        {
          label: 'Credits',
          click() {
            shell.openExternal('https://movieprint.org/credits/');
          },
        },
      ],
    };

    const menuArray =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
        ? [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp, subMenuDev]
        : [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
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
          },
        },
      ],
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Ctrl+Z',
          click: () => {
            this.mainWindow.send('undo');
          },
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Ctrl+Z',
          click: () => {
            this.mainWindow.send('redo');
          },
        },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Ctrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Ctrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Ctrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'Ctrl+A', selector: 'selectAll:' },
      ],
    };
    const subMenuDev = {
      label: 'Development',
      submenu: [
        {
          label: 'Reset application',
          accelerator: 'Shift+Alt+Ctrl+C',
          click: () => {
            resetApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Soft reset application',
          accelerator: 'Shift+Alt+Ctrl+V',
          click: () => {
            softResetApplication(
              this.mainWindow,
              this.workerWindow,
              this.opencvWorkerWindow,
              this.databaseWorkerWindow,
            );
          },
        },
        {
          label: '&Reload application',
          accelerator: 'Ctrl+R',
          click: () => {
            reloadApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Reload mainWindow',
          accelerator: 'Ctrl+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Worker',
          accelerator: 'Alt+Ctrl+R',
          click: () => {
            this.workerWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Opencv Worker',
          accelerator: 'Shift+Ctrl+R',
          click: () => {
            this.opencvWorkerWindow.webContents.reload();
          },
        },
        {
          label: 'Reload Database Worker',
          accelerator: 'Alt+Shift+Ctrl+R',
          click: () => {
            this.databaseWorkerWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Ctrl+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Worker',
          accelerator: 'Alt+Ctrl+J',
          click: () => {
            this.workerWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Opencv Worker',
          accelerator: 'Alt+Ctrl+K',
          click: () => {
            this.opencvWorkerWindow.toggleDevTools();
          },
        },
        {
          label: 'Toggle Developer Tools for Database Worker',
          accelerator: 'Alt+Shift+Ctrl+K',
          click: () => {
            this.databaseWorkerWindow.toggleDevTools();
          },
        },
        {
          label: 'Show Worker',
          click: () => {
            this.workerWindow.show();
          },
        },
        {
          label: 'Show OpenCv Worker',
          click: () => {
            this.opencvWorkerWindow.show();
          },
        },
        {
          label: 'Show Database Worker',
          click: () => {
            this.databaseWorkerWindow.show();
          },
        },
        {
          label: 'Show log file',
          click: () => {
            const { pathOfLogFile, pathOfLogFolder} = getPathOfLogFileAndFolder(process.platform, app.getName());
            if (fs.existsSync(pathOfLogFile)) {
              shell.showItemInFolder(pathOfLogFile);
            } else {
              shell.showItemInFolder(pathOfLogFolder);
            }
          },
        },
        {
          label: 'Show database file',
          click: () => {
            const moviePrintDBPath = path.join(app.getPath('userData'), 'moviePrint_frames.db');
            if (fs.existsSync(moviePrintDBPath)) {
              shell.showItemInFolder(moviePrintDBPath);
            } else {
              shell.showItemInFolder(app.getPath('userData'));
            }
          },
        },
      ],
    };
    const subMenuView = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Fit MoviePrint',
          accelerator: 'Ctrl+0',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'resetZoom');
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'Ctrl+=',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'zoomIn');
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'Ctrl+-',
          click: () => {
            this.mainWindow.webContents.send('send-zoom-level', 'zoomOut');
          },
        },
        { type: 'separator' },
        {
          label: 'Reload application',
          accelerator: 'Ctrl+R',
          click: () => {
            reloadApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        {
          label: 'Reset application',
          accelerator: 'Shift+Alt+Ctrl+C',
          click: () => {
            resetApplication(this.mainWindow, this.workerWindow, this.opencvWorkerWindow, this.databaseWorkerWindow);
          },
        },
        { type: 'separator' },
        {
          label: 'Restart in debug mode',
          accelerator: 'Shift+Alt+Ctrl+X',
          click: () => {
            app.relaunch({
              args: process.argv.slice(1).concat(['--debug']),
            });
            app.exit(0);
          },
        },
      ],
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Main window',
          click: () => {
            this.mainWindow.show();
          },
        },
        { label: 'Minimize', accelerator: 'Ctrl+M', selector: 'performMiniaturize:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Help',
          click() {
            shell.openExternal('https://movieprint.org/help/');
          },
        },
        { type: 'separator' },
        {
          label: 'Development',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/fakob/MoviePrint_v004/issues');
          },
        },
        { type: 'separator' },
        {
          label: `MoviePrint version: ${app.getVersion()}`,
          enabled: false,
        },
        {
          label: 'Changelog',
          click() {
            shell.openExternal('https://movieprint.org/download/');
          },
        },
        {
          label: 'Credits',
          click() {
            shell.openExternal('https://movieprint.org/credits/');
          },
        },
      ],
    };

    const menuArray =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      process.argv.findIndex(value => value === '--debug') > -1
        ? [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp, subMenuDev]
        : [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
    return menuArray;
  }
}
