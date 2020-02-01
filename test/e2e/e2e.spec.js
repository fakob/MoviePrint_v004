/* eslint no-restricted-syntax: ["error", "WithStatement", "BinaryExpression[operator='in']"] */

import { Application } from 'spectron';
import electronPath from 'electron';
import fakeDialog from 'spectron-fake-dialog';
import path from 'path';
import fs from 'fs';
import '../../internals/scripts/CheckBuildsExist';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('main window', function spec() {
  beforeAll(async () => {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', '..', 'app'), '--softreset']
      // args: [path.join(__dirname, '..', '..', 'app'), '--softreset', '--debug']
    });
    fakeDialog.apply(this.app);
    console.log(await this.app.getSettings());
    await delay(3000);
    return this.app.start();
  });

  afterAll(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  // prepare to store window title and handle for later use
  const windowObject = {};

  it('should open the 5 windows', async () => {
    const { client } = this.app;
    const windowHandles = await client.windowHandles();
    const windowNames = [];
    for (const windowHandleValue of windowHandles.value) {
      await client.window(windowHandleValue);
      const title = await client.getTitle();
      // only add to array if it has a title
      // this will exclude debug windows
      if (title !== '') {
        windowNames.push(title)
        // store window title and handle for later use
        windowObject[title] = windowHandleValue
      }
    }
    console.log(windowNames.sort());

    expect(windowNames).toEqual([
      'MoviePrint',
      'MoviePrint credits',
      'MoviePrint_indexedDBWorker',
      'MoviePrint_opencvWorker',
      'MoviePrint_worker'
    ]);
  });

  it("shouldn't have any logs in console of all windows", async () => {
    const { client } = this.app;
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

  it('should load a movie and get all 16 thumbs', async () => {
    const { client } = this.app;
    await client.window(windowObject['MoviePrint']); // focus main window
    const dragndropInput = '[type="file"]'; // selecting the input div via type
    const pathOfMovie = path.join(__dirname, '..', '..', 'resources', 'test_files', 'test_movie_1.mp4');
    await client.chooseFile(dragndropInput, pathOfMovie);
    const val = await client.getValue(dragndropInput)
    console.log(val);
    client.waitForExist('[data-tid="thumbGridDiv"]', 5000);
    expect(await client.isExisting('[data-tid="thumbGridDiv"]')).toBe(true);
    expect(await client.isExisting('#thumb15')).toBe(true);
    // await client.browserWindow.capturePage().then((imageBuffer) => {
    //   fs.writeFile('end of should load a movie and get all 16 thumbs.png', imageBuffer);
    //   return undefined;
    // }).catch((err) => {
    //   console.error(err);
    // });
  });

  it('should increase thumb count to 20', async () => {
    const { client } = this.app;
    // show settings menu
    await client.waitForExist('[data-tid="moreSettingsBtn"]', 3000);
    await client.element('[data-tid="moreSettingsBtn"]').click();

    // move down to switch sliders to inputs
    await client.moveToObject('[data-tid="changeCachedFramesSizeDropdown"]');
    await client.waitForVisible('[data-tid="showSlidersCheckbox"]', 3000);
    await client.element('[data-tid="showSlidersCheckbox"]').click();

    // move up and change column count
    await client.moveToObject('[data-tid="columnCountInput"]');
    await client.waitForVisible('[data-tid="columnCountInput"]', 3000);
    await client.setValue('[data-tid="columnCountInput"] input', 5);
    await client.keys('Enter');
    await client.element('[data-tid="applyNewGridBtn"]').click();

    await client.waitForExist('#thumb19', 3000);
    expect(await client.isExisting('#thumb19')).toBe(true);
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
