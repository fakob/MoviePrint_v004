![MoviePrint](resources/icons/128x128.png)

Website - [https://movieprint.fakob.com/](https://movieprint.fakob.com/)

A tool which lets you create screenshots of entire movies in an instant.
<br/>

* CUSTOMISE LOOK - Set a custom grid, adjust file and frame specific data, margins etc. to create a custom look for your MoviePrints.
* SET IN AND OUT POINTS - Define custom In and Out Points for your MoviePrint if you only want to use a section of the movie.
* INSERT AND MOVE THUMBS - Easily insert thumbs and move them around via drag and drop.
* SELECT FRAMES - Scrub through the movie with ease and select frames for every single thumb individually.
* SAVE THUMBS - Easily save individual thumbs or save all thumbs of a MoviePrint at once.
* BATCH CREATE - Automatically create MoviePrints from all your movies.
* SHOT DETECTION - Scan the movie with a simple shot detection to get more interesting MoviePrints.
* TIMELINE VIEW - Change to timeline view where every thumb is as wide as the shot is long.
* EMBED MOVIEPRINT DATA - Embed the data of the chosen thumbs to reedit your MoviePrint at a later stage.

MoviePrint is using openCV as the roadmap includes utilising computer vision algorithms.

### Please give feedback
As **we are not collecting any data** from you, **we are dependent on you talking to us**. If you have a minute, we would very much appreciate if you tell us

* how you found out about MoviePrint
* how you use the software
* what you use MoviePrint images for
* what you like, what you dislike
* and anything else you think we should know to make a better product

You can use [this form](http://movieprint.fakob.com/2018/05/alpha-release-is-out/) or the `Share Feedback` button in the app.

### Want to stay updated?
Do you want to be informed when new features are released? Just write NEWSLETTER in [this form](http://movieprint.fakob.com/2018/05/alpha-release-is-out/) or use the `Share Feedback` button in the app.
_We will only ever send you MoviePrint related updates._

### Example MoviePrints
Grid view
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2019/03/Big-Buck-Bunny-Sunflower.-2160p-60fps.-Download-link-f1R2E6_TdWQ.mp4-MoviePrint-1-edit-1.jpg)

Timeline views
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2019/03/Big-Buck-Bunny-Sunflower.-2160p-60fps.-Download-link-f1R2E6_TdWQ.mp4-MoviePrint-3.jpg)
![MoviePrint_v004 screenshot](https://movieprint.fakob.com/wp-content/uploads/2019/03/MoviePrint_v004-0.1.16-alpha-screenshot-4.jpeg)
![MoviePrint_v004 screenshot](https://movieprint.fakob.com/wp-content/uploads/2019/03/MoviePrint_v004-0.1.16-alpha-screenshot-7.jpeg)

### How it works
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.00.59.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.01.55.jpg)
![MoviePrint_v004 screenshot](https://movieprint.fakob.com/wp-content/uploads/2019/03/MoviePrint_v004-0.1.16-alpha-screenshot-2.jpeg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.00.29.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.04.35.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.05.28.jpg)
![MoviePrint_v004 screenshot](https://movieprint.fakob.com/wp-content/uploads/2019/03/MoviePrint_v004-0.1.16-alpha-screenshot-1.jpeg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-18.57.14.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.22.03.jpg)

### Watch explainer
[![MoviePrint_v004 screencast](http://img.youtube.com/vi/vRklHN0A2YU/0.jpg)](https://www.youtube.com/watch?v=vRklHN0A2YU)
[Watch screencast](https://www.youtube.com/watch?v=vRklHN0A2YU)

---
## Download Mac and Windows releases
https://github.com/fakob/MoviePrint_v004/releases

old version (2014)
http://www.fakob.com/2014/movieprint-an-osx-tool/

---
MoviePrint_v004 is based on [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)

#### For development

* The app was tested on Mac OSX and Windows. Running and building it on other platforms might require additional changes to the code. Especially when it comes to linking and packaging the libraries.
* For other details check [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate) documentation

##### Mac setup

1. clone the repo via git: `git clone --depth=1 https://github.com/fakob/MoviePrint_v004.git MoviePrint_v004`
2. Make sure you have cmake installed `brew install cmake`
3. To have ffmpeg support in opencv4nodejs you need to have [ffmpeg](https://www.ffmpeg.org/download.html) v3.4.2 installed before opencv4nodejs gets built ([ffmpeg v4.x is currently not supported](https://github.com/justadudewhohacks/opencv4nodejs/issues/503))
4. Enter the folder `cd MoviePrint_v004`
5. Install dependencies with [yarn](https://yarnpkg.com/en/) by running the command `yarn`

##### Windows setup

These instructions should work, if you run into errors maybe [look here](https://github.com/fakob/MoviePrint_v004/issues/1#issuecomment-449582453) and comment.

1. `git clone --depth=1 https://github.com/fakob/MoviePrint_v004.git MoviePrint_v004`
2. Install [CMake](https://cmake.org/download/) (v3.13.2 works), choose "add to PATH" option during installation
3. Make sure you have [yarn](https://yarnpkg.com/en/) (v1.12.3 works) installed
4. To have ffmpeg support in opencv4nodejs you need to have [ffmpeg](https://www.ffmpeg.org/download.html) installed (v3.4.2 works, v4.1 should too)
5. We'll need [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs#on-windows) to work which requires `npm install --global windows-build-tools`
6. We need [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3/issues/126) to work which additionally requires VC++ 2015.3 v14.00(v140) toolset for desktop
   - Start Visual Studio Installer
   - Modify Visual Studio Build Tools 2017
   - Click on Individual components
   - Tick VC++ 2015.3 v14.00 (v140) toolset for desktop
   - Click on Modify/Install
7. Make sure you have [python 2](https://www.python.org/downloads/) (_not 3_) installed (v2.7.15 works), test by running `python --version`
8. Run the command `yarn` (this may take 10+ minutes and may automatically download supporting libraries from Microsoft). If this process errors out, try to debug.

The rest of the instructions are the same for Mac and Windows:

##### First time

```bash
$ yarn includeInDist
```
##### Run

```bash
$ yarn dev
```

##### Packaging

To package the app for your local platform:

```bash
$ yarn package
```

## License
MIT © [fakob](https://github.com/fakob)
