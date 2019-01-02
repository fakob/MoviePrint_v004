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

Experimental
* Scene detection (using mean difference)
* Automatic In and Outpoint detection

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


### Watch screencast
[![MoviePrint_v004 screencast](http://img.youtube.com/vi/ERn0SWCPnE0/0.jpg)](https://www.youtube.com/watch?v=ERn0SWCPnE0)
[Watch screencast](https://www.youtube.com/watch?v=ERn0SWCPnE0)

### Example MoviePrint
![MoviePrint_v004 screencast](http://movieprint.fakob.com/wp-content/uploads/2018/05/Dead_Maintitle_Vimeo.mp4-MoviePrint-edit-5.png)

### How it works
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.00.59.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.01.55.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-18.56.42.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-18.55.53.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.00.29.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.04.35.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.05.28.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-18.57.14.jpg)
![MoviePrint_v004 screencast](https://movieprint.fakob.com/wp-content/uploads/2018/09/Screen-Shot-2018-09-11-at-19.22.03.jpg)

---
## OSX release
new alpha release - https://github.com/fakob/MoviePrint_v004/releases

old version (2014) - http://www.fakob.com/2014/movieprint-an-osx-tool/

---
MoviePrint_v004 is based on [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)

#### For development

* The app was tested on Mac OSX and Windows. Running and building it on other platforms might require additional changes to the code. Especially when it comes to linking and packaging the libraries.
* For other details check [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate) documentation

##### Mac setup

1. clone the repo via git: `git clone --depth=1 https://github.com/fakob/MoviePrint_v004.git MoviePrint_v004`
2. Make sure you have cmake installed `brew install cmake`
3. Enter the folder `cd MoviePrint_v004`
4. Install dependencies with [yarn](https://yarnpkg.com/en/) by running the command `yarn`

##### Windows setup

These instructions should work, if you run into errors maybe [look here](https://github.com/fakob/MoviePrint_v004/issues/1#issuecomment-449582453) and comment.

1. `git clone --depth=1 https://github.com/fakob/MoviePrint_v004.git MoviePrint_v004`
2. install [CMake](https://cmake.org/download/) (v3.13.2 works), choose "add to PATH" option during installation
3. make sure you have [yarn](https://yarnpkg.com/en/) (v1.12.3 works) installed
4. you might need to have [ffmpeg](https://www.ffmpeg.org/download.html) installed (v3.4.2 works, v4.1 should too)
5. we'll need [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs#on-windows) to work which requires `npm install --global windows-build-tools`
6. make sure you have [python 2](https://www.python.org/downloads/) (_not 3_) installed (v2.7.15 works), test by running `python --version`
7. run the command `yarn` (this may take 10+ minutes and may automatically download supporting libraries from Microsoft). If this process errors out, try to debug.

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
