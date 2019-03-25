import { Application } from 'spectron';
import electronPath from 'electron';
import fakeDialog from 'spectron-fake-dialog';
import path from 'path';
import '../../internals/scripts/CheckBuiltsExist';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('main window', function spec() {
  beforeAll(async () => {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', '..', 'app'), '--reset']
    });
    fakeDialog.apply(this.app);

    return this.app.start();
  });

  // afterAll(() => {
  //   if (this.app && this.app.isRunning()) {
  //     return this.app.stop();
  //   }
  // });

  // prepare to store window title and handle for later use
  const windowObject = {};

  const findCounter = () => this.app.client.element('[data-tid="counter"]');

  const findButtons = async () => {
    const { value } = await this.app.client.elements('[data-tclass="btn"]');
    return value.map(btn => btn.ELEMENT);
  };

  it('should open the 5 windows', async () => {
    const { client } = this.app;
    await client.waitUntilWindowLoaded();
    client.waitForExist('[data-tid="startupImg"]', 3000);
    // const windowCount = await client.getWindowCount();
    const windowHandles = await client.windowHandles();
    const windowNames = [];
    for (const windowHandleValue of windowHandles.value) {
      await client.window(windowHandleValue);
      const title = await client.getTitle();

      windowNames.push(title)
      console.log(title);

      // store window title and handle for later use
      windowObject[title] = windowHandleValue
    }
    console.log(windowNames.sort());
    // console.log(windowHandles);
    // console.log(windowObject);

    expect(windowNames).toEqual([
      'MoviePrint',
      'MoviePrint credits',
      'MoviePrint_indexedDBWorker',
      'MoviePrint_opencvWorker',
      'MoviePrint_worker'
    ]);
  });

  it("should haven't any logs in console of main window", async () => {
    const { client } = this.app;
    await client.window(windowObject['MoviePrint']);

    const logs = await client.getRenderProcessLogs();
    // Print renderer process logs
    // console.log(logs);
    logs.forEach(log => {
      // console.log(log.message);
      // console.log(log.source);
      // console.log(log.level);
      // exclude standard failed to load resource
      if (log.level === 'SEVERE' &&
      log.message !== 'data:image/jpeg;base64, undefined - Failed to load resource: net::ERR_INVALID_URL') {
        expect(log.level).not.toEqual('SEVERE');
      }
    });
  });

  it('should load a movie', async () => {
    const { client } = this.app;
    const dragndropInput = '[type="file"]'; // selecting the input div via type
    const pathOfMovie = '/Users/jakobschindegger/Desktop/test.mp4';
    await client.chooseFile(dragndropInput, pathOfMovie);
    console.log(await client.isExisting(dragndropInput));
    const val = await client.getValue(dragndropInput)
    console.log(val);
    client.waitForExist('[data-tid="thumbGridDiv"]', 3000);

    // await delay(1500);
    console.log(pathOfMovie);
      expect(await client.isExisting('[data-tid="thumbGridDiv"]')).toBe(true);
  });

  //
  // it('should display updated count after increment button click', async () => {
  //   const { client } = this.app;
  //
  //   const buttons = await findButtons();
  //   await client.elementIdClick(buttons[0]); // +
  //   expect(await findCounter().getText()).toBe('1');
  // });
  //
  // it('should display updated count after descrement button click', async () => {
  //   const { client } = this.app;
  //
  //   const buttons = await findButtons();
  //   await client.elementIdClick(buttons[1]); // -
  //   expect(await findCounter().getText()).toBe('0');
  // });
  //
  // it('shouldnt change if even and if odd button clicked', async () => {
  //   const { client } = this.app;
  //
  //   const buttons = await findButtons();
  //   await client.elementIdClick(buttons[2]); // odd
  //   expect(await findCounter().getText()).toBe('0');
  // });
  //
  // it('should change if odd and if odd button clicked', async () => {
  //   const { client } = this.app;
  //
  //   const buttons = await findButtons();
  //   await client.elementIdClick(buttons[0]); // +
  //   await client.elementIdClick(buttons[2]); // odd
  //   expect(await findCounter().getText()).toBe('2');
  // });
  //
  // it('should change if async button clicked and a second later', async () => {
  //   const { client } = this.app;
  //
  //   const buttons = await findButtons();
  //   await client.elementIdClick(buttons[3]); // async
  //   expect(await findCounter().getText()).toBe('2');
  //   await delay(3000);
  //   expect(await findCounter().getText()).toBe('3');
  // });
  //
  // it('should back to home if back button clicked', async () => {
  //   const { client } = this.app;
  //   await client.element('[data-tid="backButton"] > a').click();
  //
  //   expect(await client.isExisting('[data-tid="container"]')).toBe(true);
  // });




    // it('should open a dialog', async () => {
    //   const { client } = this.app;
    //   fakeDialog.mock([ { method: 'showOpenDialog', value: ['faked.txt'] } ])
    //
    //   await client.click('[data-tid=openMoviesBtn]');
    //   const pathOfMovie = await client.getText('#return-value');
    //   console.log(pathOfMovie);
    //   expect(await findCounter().getText()).toBe('0');
    // });
});
