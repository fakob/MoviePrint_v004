![MoviePrint](resources/icons/128x128.png)

A tool which lets you create screenshots of entire movies in an instant.
<br/>

* Customise the look of your MoviePrint (Rows, Columns, Frame, Timecode…)
* Define the desired In- and Outpoints
* Choose each thumb individually
* Add more thumbs in between
* Rearrange the order of the thumbs
* Save all chosen thumbs as stills
* Save MoviePrints for all dragged in movies automatically

Experimental
* Scene detection (using mean difference)
* Automatic In and Outpoint detection

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


MoviePrint is using openCV as the roadmap includes utilising computer vision algorithms.

### Watch screencast
[![MoviePrint_v004 screencast](http://img.youtube.com/vi/1Ya0UrIXfD8/0.jpg)](http://www.youtube.com/watch?v=1Ya0UrIXfD8)

[Watch screencast](http://www.youtube.com/watch?v=1Ya0UrIXfD8)

### Example MoviePrint
![MoviePrint_v004 screencast](http://movieprint.fakob.com/wp-content/uploads/2018/05/Dead_Maintitle_Vimeo.mp4-MoviePrint-edit-5.png)

---
## OSX release
new alpha release - https://github.com/fakob/MoviePrint_v004/releases

old version (2014) - http://www.fakob.com/2014/movieprint-an-osx-tool/

---
MoviePrint_v004 is based on [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)

#### For development

* The app was only tested on Mac OSX. Running and building it on other platforms might require additional changes to the code. Especially when it comes to linking and packaging the libraries.
* For other details check electron-react-boilerplate description

First, clone the repo via git:

```bash
git clone --depth=1 https://github.com/fakob/MoviePrint_v004.git MoviePrint_v004
```

Make sure you have cmake installed

```bash
$ brew install cmake
```

And then install dependencies with yarn.

```bash
$ cd MoviePrint_v004
$ yarn
```
##### Run

```bash
$ npm run dev
```

##### Packaging

To package the app for your local platform:

```bash
$ npm run package
```

## License
MIT © [fakob](https://github.com/fakob)
