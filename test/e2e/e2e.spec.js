/* eslint no-restricted-syntax: ["error", "WithStatement", "BinaryExpression[operator='in']"] */

import { Application } from 'spectron';
import electronPath from 'electron';
import fakeDialog from 'spectron-fake-dialog';
import path from 'path';
import '../../internals/scripts/CheckBuiltsExist';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const delay = time => new Promise(resolve => setTimeout(resolve, time));
// prepare to store window title and handle for later use
const windowObject = {};
let client;

describe('main window', function spec() {
  beforeAll(async () => {
    this.app = new Application({
      path: electronPath,
      // args: [path.join(__dirname, '..', '..', 'app'), '--softreset']
      args: [path.join(__dirname, '..', '..', 'app'), '--softreset', '--debug']
    });
    fakeDialog.apply(this.app);
    console.log(await this.app.getSettings());
    await this.app.start();

    client = this.app.client;
    const windowHandles = await client.windowHandles();
    const windowNames = [];
    for (const windowHandleValue of windowHandles.value) {
      await client.window(windowHandleValue);
      const title = await client.getTitle();

      console.log(title);
      // only add to array if it has a title
      // this will exclude debug windows
      if (title !== '') {
        windowNames.push(title)
        // store window title and handle for later use
        windowObject[title] = windowHandleValue
      }
    }
    console.log(windowNames.sort());
  });

  afterAll(() => {
    if (this.app && this.app.isRunning()) {
      //return this.app.stop();
    }
  });

  it('should open the 5 windows', async () => {
    // await client.waitUntilWindowLoaded();
    // await client.waitForExist('[data-tid="startupImg"]', 10000);
    // const windowCount = await client.getWindowCount();

    let windowsNames =  [
      'MoviePrint',
      'MoviePrint credits',
      'MoviePrint_indexedDBWorker',
      'MoviePrint_opencvWorker',
      'MoviePrint_worker'
    ];

    windowsNames.forEach(name => {
      expect(Object.keys(windowObject)).toContain(name);
    });
  })

  it("shouldn't have any logs in console of all windows", async () => {
    Object.values(windowObject).map(async windowHandleValue => {
      await client.window(windowHandleValue);
      const logs = await client.getRenderProcessLogs();
      // Print renderer process logs for MoviePrint renderer
      logs.forEach(log => {
        if (log.level === 'SEVERE' &&
        log.message !== 'data:image/jpeg;base64, undefined - Failed to load resource: net::ERR_INVALID_URL') {
          expect(log.level).not.toEqual('SEVERE');
        }
      });
    })
  });

  describe('drag movie', () => {
    it.only('should load a movie and get all 16 thumbs', async () => {
      await client.window(windowObject['MoviePrint']); // focus main window
      const dragndropInput = '[type="file"]'; // selecting the input div via type
      const pathOfMovie = 'C:\\Users\\luis.arevalo\\Downloads\\test.mp4';
      await client.chooseFile(dragndropInput, pathOfMovie);
      const val = await client.getValue(dragndropInput)
      console.log(val);
      client.waitForExist('[data-tid="thumbGridDiv"]', 3000);
      expect(await client.isExisting('[data-tid="thumbGridDiv"]')).toBe(true);
      expect(await client.isExisting('#thumb15')).toBe(true);
    });

    it.only('should increase thumb count to 20 - NOT WORKING YET', async () => {
      console.log(client);
      await client.element('[data-tid="moreSettingsBtn"]').click();
      await client.element('[data-tid="updateFrameCacheBtn"]').scroll();
      await client.element('//*[@data-tid="showSlidersCheckbox"]/input').click();
      await client.element('[data-tid="columnCountInput"]').scroll();
      const findColumnCountInput = () => client.element('[data-tid="columnCountInput"]');
      await findColumnCountInput().setValue(5);
      await client.element('[data-tid="applyNewGridBtn"]').click();
      await client.element('[data-tid="showSlidersCheckbox"]').click();
      client.waitForExist('#thumb19', 3000);
      expect(await client.isExisting('#thumb19')).toBe(true);
    });
  });

  // it('should open a dialog', async () => {
  //   const { client } = this.app;
  //   fakeDialog.mock([ { method: 'showOpenDialog', value: ['faked.txt'] } ])
  //
  //   await client.click('[data-tid=openMoviesBtn]');
  //   const pathOfMovie = await client.getText('#return-value');
  //   console.log(pathOfMovie);
  //   expect(await findCounter().getText()).toBe('0');
  // });

  // const findThumbGridDiv = () => this.app.client.element('[data-tid="thumbGridDiv"]');
  // const thumbs = $$(".//*[contains(@class,'ThumbGrid__gridItem')]")
  // const findThumbs = () => this.app.client.elements('.//*[contains(@class,"ThumbGrid__gridItem")]');
  // const thumbs = await findThumbs();
  // console.log(thumbs);
  // console.log(thumbs.value.length);
  // await delay(1500);

  // const findCounter = () => this.app.client.element('[data-tid="counter"]');
  //
  // const findButtons = async () => {
  //   const { value } = await this.app.client.elements('[data-tclass="btn"]');
  //   return value.map(btn => btn.ELEMENT);
  // };

});
