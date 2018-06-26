import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import { TransitionablePortal, Segment, Progress, Modal, Button, Icon } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import {Bar, defaults} from 'react-chartjs-2';

import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import ThumbEmpty from '../components/ThumbEmpty';
import { getLowestFrame,
  getHighestFrame,
  getVisibleThumbs,
  getColumnCount,
  getThumbsCount,
  getMoviePrintColor,
  getScaleValueObject,
  getObjectProperty,
  setPosition,
  renderImage,
  mapRange,
} from '../utils/utils';
// import saveMoviePrint from '../utils/saveMoviePrint';
import styles from './App.css';
import stylesPop from './../components/Popup.css';
import {
  setNewMovieList, showMovielist, hideMovielist, showSettings, hideSettings,
  showThumbView, showMoviePrintView, addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount,
  setVisibilityFilter, setCurrentFileId, updateFileColumnCount,
  updateFileDetails, clearThumbs, updateThumbImage, setDefaultMarginRatio, setDefaultShowHeader,
  setDefaultRoundedCorners, setDefaultThumbInfo, setDefaultOutputPath, setDefaultOutputFormat,
  setDefaultSaveOptionOverwrite, setDefaultSaveOptionIncludeIndividual, setDefaultThumbnailScale,
  setDefaultMoviePrintWidth, updateFileDetailUseRatio, setDefaultShowPaperPreview,
  setDefaultPaperAspectRatioInv, updateInOutPoint, removeMovieListItem, setDefaultDetectInOutPoint,
  changeThumb, addThumb, setEmailAddress, addThumbs
} from '../actions';
import {
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  ZOOM_SCALE,
  DEV_OPENCV_SCENE_DETECTION,
} from '../utils/constants';

import steps from '../img/MoviePrint-steps.svg';
import transparent from '../img/Thumb_TRANSPARENT.png';

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const { app } = require('electron').remote;
const opencv = require('opencv4nodejs');

// Disable animating charts by default.
defaults.global.animation = false;

const setColumnAndThumbCount = (that,
  columnCount, thumbCount) => {
  that.setState({
    columnCountTemp: columnCount,
    thumbCountTemp: thumbCount,
    columnCount,
    thumbCount,
  });
};

class App extends Component {
  constructor() {
    super();

    this.webviewRef = React.createRef();
    this.opencvVideoCanvasRef = React.createRef();

    this.state = {
      containerHeight: 0,
      containerWidth: 0,
      columnCountTemp: undefined,
      thumbCountTemp: undefined,
      columnCount: undefined,
      thumbCount: undefined,
      reCapture: true,
      colorArray: undefined,
      scaleValueObject: undefined,
      savingMoviePrint: false,
      selectedThumbObject: undefined,
      outputScaleCompensator: 1,
      // file match needs to be in sync with setMovieList() and onDrop() !!!
      accept: 'video/*,.divx,.mkv,.ogg,.VOB,',
      dropzoneActive: false,
      keyObject: {
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        which: undefined
      },
      zoom: false,
      filesToLoad: [],
      progressMessage: undefined,
      showMessage: false,
      progressBarPercentage: 100,
      showFeedbackForm: false,
      intendToCloseFeedbackForm: false,
      timeBefore: undefined,
      opencvVideo: undefined,
      showScrubWindow: false,
      scrubThumb: undefined,
      chartData: {
          labels: ["Jakobary", "February", "March", "April", "May", "June", "July"],
          datasets: [{
            label: "My First dataset",
            backgroundColor: 'rgb(0, 99, 132)',
            borderWidth: '0',
            borderColor: 'rgb(255, 0, 0)',
            data: [0, 10, 5, 2, 20, 30, 45],
          }]
        },
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.onSelectMethod = this.onSelectMethod.bind(this);

    this.showMovielist = this.showMovielist.bind(this);
    this.hideMovielist = this.hideMovielist.bind(this);
    this.toggleMovielist = this.toggleMovielist.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.showSettings = this.showSettings.bind(this);
    this.hideSettings = this.hideSettings.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onViewToggle = this.onViewToggle.bind(this);
    this.onScrubWindowMouseOver = this.onScrubWindowMouseOver.bind(this);
    this.onScrubWindowStop = this.onScrubWindowStop.bind(this);
    this.onScrubClick = this.onScrubClick.bind(this);
    this.switchToPrintView = this.switchToPrintView.bind(this);
    this.onOpenFeedbackForm = this.onOpenFeedbackForm.bind(this);
    this.onCloseFeedbackForm = this.onCloseFeedbackForm.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);

    this.updatecontainerWidthAndHeight = this.updatecontainerWidthAndHeight.bind(this);
    this.updateScaleValue = this.updateScaleValue.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onChangeColumnAndApply = this.onChangeColumnAndApply.bind(this);
    this.onShowPaperPreviewClick = this.onShowPaperPreviewClick.bind(this);
    this.onPaperAspectRatioClick = this.onPaperAspectRatioClick.bind(this);
    this.onDetectInOutPointClick = this.onDetectInOutPointClick.bind(this);
    this.onReCaptureClick = this.onReCaptureClick.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);

    this.onChangeMargin = this.onChangeMargin.bind(this);
    this.onShowHeaderClick = this.onShowHeaderClick.bind(this);
    this.onRoundedCornersClick = this.onRoundedCornersClick.bind(this);
    this.toggleZoom = this.toggleZoom.bind(this);
    this.disableZoom = this.disableZoom.bind(this);
    this.onToggleShowHiddenThumbsClick = this.onToggleShowHiddenThumbsClick.bind(this);
    this.onShowHiddenThumbsClick = this.onShowHiddenThumbsClick.bind(this);
    this.onThumbInfoClick = this.onThumbInfoClick.bind(this);
    this.onChangeOutputPathClick = this.onChangeOutputPathClick.bind(this);
    this.onOutputFormatClick = this.onOutputFormatClick.bind(this);
    this.onOverwriteClick = this.onOverwriteClick.bind(this);
    this.onIncludeIndividualClick = this.onIncludeIndividualClick.bind(this);
    this.onThumbnailScaleClick = this.onThumbnailScaleClick.bind(this);
    this.onMoviePrintWidthClick = this.onMoviePrintWidthClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;
    setColumnAndThumbCount(
      this,
      getColumnCount(
        this.props.file,
        store.getState().undoGroup.present.settings
      ),
      getThumbsCount(
        this.props.file,
        this.props.thumbsByFileId,
        store.getState().undoGroup.present.settings,
        store.getState().visibilitySettings.visibilityFilter
      ),
    );
    this.setState({
      colorArray: getMoviePrintColor(store.getState()
        .undoGroup.present.settings.defaultThumbCountMax),
      scaleValueObject: getScaleValueObject(
        this.props.file, this.props.settings,
        // this.state.columnCount, this.state.thumbCount,
        this.state.columnCountTemp, this.state.thumbCountTemp,
        this.state.containerWidth, this.state.containerHeight,
        this.props.visibilitySettings.showMoviePrintView,
        this.state.zoom ? ZOOM_SCALE : 0.95,
        this.state.zoom ? false : this.props.settings.defaultShowPaperPreview
      )
    });
    if (getObjectProperty(() => this.props.file.id)) {
      this.setState({
        opencvVideo: new opencv.VideoCapture(this.props.file.path),
      });
    }
  }

  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('progress', (event, fileId, progressBarPercentage) => {
      this.setState({
        progressBarPercentage: Math.ceil(progressBarPercentage)
      });
    });

    ipcRenderer.on('progressMessage', (event, fileId, status, message, time) => {
      this.setState({
        progressMessage: message,
        showMessage: true
      }, () => {
        if (time) {
          setTimeout(() => {
            this.setState({
              showMessage: false
            });
          }, time);
        }
      });
    });

    ipcRenderer.on('receive-get-file-details', (event, fileId, filePath, posterFrameId, frameCount, width, height, fps, fourCC) => {
      store.dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-poster-frame', fileId, filePath, posterFrameId);
    });

    // poster frames don't have thumbId
    ipcRenderer.on('receive-get-poster-frame', (event, fileId, filePath, posterFrameId, base64, frameNumber, useRatio) => {
      store.dispatch(updateFileDetailUseRatio(fileId, useRatio));
      store.dispatch(updateThumbImage(fileId, '', posterFrameId, base64, frameNumber, 1));
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-in-and-outpoint', fileId, filePath, useRatio, store.getState().undoGroup.present.settings.defaultDetectInOutPoint);
    });

    ipcRenderer.on('receive-get-in-and-outpoint', (event, fileId, fadeInPoint, fadeOutPoint) => {
      store.dispatch(updateInOutPoint(fileId, fadeInPoint, fadeOutPoint));
      // load thumbs for first item only until currentFileId is set
      console.log(this.props.currentFileId);
      if (this.props.currentFileId === undefined) {
        console.log('I am the firstItem');
        const firstFile = store.getState().undoGroup.present.files.find((file) => file.id === fileId);
        store.dispatch(setCurrentFileId(firstFile.id));
        this.updateScaleValue(); // so the aspect ratio of the thumbs are correct after drag
        store.dispatch(clearThumbs());
        console.log(firstFile);
        // console.log(firstFile.fadeInPoint);
        store.dispatch(addDefaultThumbs(
          firstFile,
          store.getState().undoGroup.present.settings.defaultThumbCount,
          fadeInPoint,
          fadeOutPoint,
        ));
      }
      if (this.state.filesToLoad.length > 0) {
        // state should be immutable, therefor
        // make a copy with slice, then remove the first item with shift, then set new state
        const copyOfFilesToLoad = this.state.filesToLoad.slice();
        copyOfFilesToLoad.shift();
        this.setState({
          filesToLoad: copyOfFilesToLoad
        });
      }
    });

    ipcRenderer.on('failed-to-open-file', (event, fileId) => {
      if (this.state.filesToLoad.length > 0) {
        // state should be immutable, therefor
        // make a copy with slice, then remove the first item with shift, then set new state
        const copyOfFilesToLoad = this.state.filesToLoad.slice();
        copyOfFilesToLoad.shift();
        this.setState({
          filesToLoad: copyOfFilesToLoad
        });
        store.dispatch(removeMovieListItem(
          fileId,
        ));
      }
    });

    ipcRenderer.on('receive-get-thumbs', (event, fileId, thumbId, frameId, base64, frameNumber, lastThumb) => {
      store.dispatch(updateThumbImage(fileId, thumbId, frameId, base64, frameNumber));
      if (lastThumb && this.state.timeBefore !== undefined) {
        const timeAfter = Date.now();
        console.log(timeAfter - this.state.timeBefore);
        this.setState({
          progressMessage: `loading time: ${(timeAfter - this.state.timeBefore) / 1000.0}`,
          showMessage: true,
          timeBefore: undefined,
        }, () => {
          setTimeout(() => {
            this.setState({
              showMessage: false
            });
          }, 3000);
        });
        const tempFile = store.getState().undoGroup.present.files.find((file) => file.id === fileId);
        console.log(tempFile);
        if (DEV_OPENCV_SCENE_DETECTION) {
          ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-scene-detection', fileId, tempFile.path, tempFile.useRatio);
        }
      }
    });

    ipcRenderer.on('received-get-scene-detection', (event, fileId, sceneList, chartData) => {
      console.log(sceneList);
      const tempFile = store.getState().undoGroup.present.files.find((file) => file.id === fileId);
      const frameNumberArray = sceneList.map((item) => item.frame);
      store.dispatch(addThumbs(tempFile, frameNumberArray))
      this.setState({ chartData });
    });

    ipcRenderer.on('received-saved-file', (event, path) => {
      setTimeout(
        this.setState({ savingMoviePrint: false }),
        1000
      ); // adding timeout to prevent clicking multiple times
      console.log(`Saved file: ${path}`);
    });

    ipcRenderer.on('received-saved-file-error', (event, message) => {
      this.setState({
        progressMessage: message,
        showMessage: true
      }, () => {
        setTimeout(() => {
          this.setState({
            showMessage: false
          });
        }, 3000);
      });
      setTimeout(
        this.setState({ savingMoviePrint: false }),
        1000
      ); // adding timeout to prevent clicking multiple times
      console.log(`Saved file error: ${message}`);
    });

    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('keyup', this.handleKeyUp);

    this.updatecontainerWidthAndHeight();
    window.addEventListener('resize', this.updatecontainerWidthAndHeight);
  }

  componentWillReceiveProps(nextProps) {
    const { store } = this.context;
    const state = store.getState();

    if (nextProps.file !== undefined &&
      (getObjectProperty(() => this.props.file.id) !== nextProps.file.id)) {
      this.setState({
        opencvVideo: new opencv.VideoCapture(nextProps.file.path),
      });
    }

    if (this.props.file !== undefined &&
      nextProps.file !== undefined &&
      this.props.file.id !== undefined) {
      // check if currentFileId changed
      if (this.props.file.id !== nextProps.file.id) {
        const newThumbCount = getThumbsCount(
          nextProps.file,
          nextProps.thumbsByFileId,
          state.undoGroup.present.settings,
          nextProps.visibilitySettings.visibilityFilter
        );
        setColumnAndThumbCount(
          this,
          nextProps.file.columnCount,
          newThumbCount
        );
        console.log('currentFileId changed');
        console.log(nextProps.file.columnCount);
        console.log(newThumbCount);
      }
      const oldThumbCount = getThumbsCount(
        this.props.file,
        this.props.thumbsByFileId,
        state.undoGroup.present.settings,
        this.props.visibilitySettings.visibilityFilter
      );
      const newThumbCount = getThumbsCount(
        nextProps.file,
        nextProps.thumbsByFileId,
        state.undoGroup.present.settings,
        nextProps.visibilitySettings.visibilityFilter
      );
      if (oldThumbCount !== newThumbCount) {
        // check if visibleThumbCount changed
        setColumnAndThumbCount(
          this,
          nextProps.file.columnCount,
          newThumbCount
        );
        console.log('visibleThumbCount changed');
        console.log(newThumbCount);
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if ((nextState.filesToLoad.length !== 0) &&
      (this.state.filesToLoad.length !== nextState.filesToLoad.length)) {
      const timeBefore = Date.now();
      this.setState({
        timeBefore
      });
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-details', nextState.filesToLoad[0].id, nextState.filesToLoad[0].path, nextState.filesToLoad[0].posterFrameId);
    }
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('App.js componentDidUpdate');
    this.updatecontainerWidthAndHeight();

    // update scaleValue when these parameter change
    if (((prevProps.file === undefined || this.props.file === undefined) ?
      false : (prevProps.file.width !== this.props.file.width)) ||
      ((prevProps.file === undefined || this.props.file === undefined) ?
        false : (prevProps.file.height !== this.props.file.height)) ||
      prevProps.settings.defaultThumbnailScale !== this.props.settings.defaultThumbnailScale ||
      prevProps.settings.defaultMoviePrintWidth !== this.props.settings.defaultMoviePrintWidth ||
      prevProps.settings.defaultMarginRatio !== this.props.settings.defaultMarginRatio ||
      prevProps.settings.defaultShowHeader !== this.props.settings.defaultShowHeader ||
      prevProps.settings.defaultRoundedCorners !== this.props.settings.defaultRoundedCorners ||
      prevProps.settings.defaultShowPaperPreview !== this.props.settings.defaultShowPaperPreview ||
      prevProps.settings.defaultPaperAspectRatioInv !== this.props.settings.defaultPaperAspectRatioInv ||
      prevState.outputScaleCompensator !== this.state.outputScaleCompensator ||
      prevState.zoom !== this.state.zoom ||
      prevProps.visibilitySettings.showMoviePrintView !==
        this.props.visibilitySettings.showMoviePrintView ||
      prevState.columnCountTemp !== this.state.columnCountTemp ||
      prevState.thumbCountTemp !== this.state.thumbCountTemp ||
      prevState.columnCount !== this.state.columnCount ||
      prevState.thumbCount !== this.state.thumbCount
    ) {
      this.updateScaleValue();
    }

    if (prevState.showScrubWindow === false && this.state.showScrubWindow === true) {
      this.updateOpencvVideoCanvas(8613);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('keyup', this.handleKeyUp);

    window.removeEventListener('resize', this.updatecontainerWidthAndHeight);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    // only listen to key events when feedback form is not shown
    if (!this.state.showFeedbackForm) {
      const { store } = this.context;

      if (event) {
        switch (event.which) {
          case 49: // press 1
            this.toggleMovielist();
            break;
          case 51: // press 3
            if (store.getState().visibilitySettings.showSettings) {
              this.onCancelClick();
            } else {
              this.showSettings();
            }
            break;
          case 83: // press 's'
            if (DEV_OPENCV_SCENE_DETECTION) {
              ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-scene-detection', this.props.file.id, this.props.file.path, this.props.file.useRatio);
            }
            break;
          case 80: // press 'p'
            this.onSaveMoviePrint();
            break;
          default:
        }
        this.setState({
          keyObject: {
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            which: event.which
          }
        });
      }
    }
  }

  handleKeyUp(event) {
    if (event) {
      this.setState({
        keyObject: {
          shiftKey: false,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          which: undefined
        }
      });
    }
  }

  onDragEnter() {
    this.setState({
      dropzoneActive: true
    });
  }

  onDragLeave() {
    this.setState({
      dropzoneActive: false
    });
  }

  onDrop(files) {
    this.setState({
      dropzoneActive: false
    });
    const { store } = this.context;
    const { settings } = store.getState().undoGroup.present;
    console.log('Files dropped: ', files);
    // file match needs to be in sync with setMovieList() and accept !!!
    if (Array.from(files).some(file => (file.type.match('video.*') ||
      file.name.match(/.divx|.mkv|.ogg|.VOB/i)))) {
      store.dispatch(setNewMovieList(files, settings)).then((response) => {
        this.setState({
          filesToLoad: response
        });
        console.log(response);
        return response;
      }).catch((error) => {
        console.log(error);
      });
    }
    return false;
  }

  applyMimeTypes(event) {
    this.setState({
      accept: event.target.value
    });
  }

  updateScaleValue() {
    console.log(`inside updateScaleValue and containerWidth: ${this.state.containerWidth}`);
    const scaleValueObject = getScaleValueObject(
      this.props.file, this.props.settings,
      this.state.columnCountTemp, this.state.thumbCountTemp,
      this.state.containerWidth, this.state.containerHeight,
      this.props.visibilitySettings.showMoviePrintView,
      this.state.zoom ? ZOOM_SCALE : 0.95,
      this.state.zoom ? false : this.props.settings.defaultShowPaperPreview
    );
    this.setState(
      {
        scaleValueObject
      },
      () => {
        if (this.state.outputScaleCompensator !== scaleValueObject.newScaleValue) {
          console.log('got newscalevalue');
          this.setState({
            outputScaleCompensator: scaleValueObject.newScaleValue
          });
        }
      }
    );
  }

  updatecontainerWidthAndHeight() {
    // wrapped in try catch as in a global error case this.siteContent ref is not set
    try {
      const containerWidthInner =
        this.siteContent.clientWidth -
        (this.props.visibilitySettings.showMovielist ? 350 : 0) -
        (this.props.visibilitySettings.showSettings ? 350 : 0) -
        (this.props.file ? 0 : 700); // for startup
      const containerHeightInner = this.siteContent.clientHeight -
        (this.props.file ? 0 : 100); // for startup
      if ((Math.abs(this.state.containerHeight - containerHeightInner) > 5) ||
      (Math.abs(this.state.containerWidth - containerWidthInner) > 5)) {
        console.log(`new containerWidth: ${containerHeightInner}`);
        console.log(`new containerHeight: ${containerWidthInner}`);
        this.setState({
          containerHeight: containerHeightInner,
          containerWidth: containerWidthInner
        }, () => this.updateScaleValue());
      }
      return true;
    } catch (e) {
      return undefined;
    }
  }

  onSelectMethod(thumbId, frameNumber) {
    this.setState({
      selectedThumbObject: {
        thumbId,
        frameNumber
      }
    });
  }

  showMovielist() {
    const { store } = this.context;
    store.dispatch(showMovielist());
    this.switchToPrintView();
  }

  hideMovielist() {
    const { store } = this.context;
    store.dispatch(hideMovielist());
  }

  toggleMovielist() {
    if (this.props.visibilitySettings.showMovielist) {
      this.hideMovielist();
    } else {
      this.showMovielist();
    }
  }

  showSettings() {
    const { store } = this.context;
    store.dispatch(showSettings());
    console.log(this.state.columnCount);
    console.log(this.state.thumbCount);
    setColumnAndThumbCount(
      this,
      getColumnCount(
        this.props.file,
        store.getState().undoGroup.present.settings
      ),
      getThumbsCount(
        this.props.file,
        this.props.thumbsByFileId,
        store.getState().undoGroup.present.settings,
        store.getState().visibilitySettings.visibilityFilter
      ),
    );
    this.switchToPrintView();
    this.disableZoom();
  }

  hideSettings() {
    const { store } = this.context;
    store.dispatch(hideSettings());
  }

  toggleSettings() {
    if (this.props.visibilitySettings.showSettings) {
      this.hideSettings();
    } else {
      this.showSettings();
    }
  }

  onShowThumbs() {
    const { store } = this.context;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
      store.dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      store.dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  }

  switchToPrintView() {
    const { store } = this.context;
    store.dispatch(showMoviePrintView());
  }

  onScrubClick(file, scrubThumb) {
    // get thumb left and right of scrubThumb
    const indexOfThumb = this.props.thumbs.findIndex((thumb) => thumb.thumbId === scrubThumb.thumbId);
    const leftThumb = this.props.thumbs[Math.max(0, indexOfThumb - 1)];
    const rightThumb = this.props.thumbs[Math.min(this.props.thumbs.length - 1, indexOfThumb + 1)];

    // the three thumbs might not be in ascending order, left has to be lower, right has to be higher
    // create an array to compare the three thumbs
    const arrayToCompare = [leftThumb, rightThumb, scrubThumb];

    // copy the first array with slice so I can run it a second time (reduce mutates the array)
    const scrubThumbLeft = arrayToCompare.slice().reduce((prev, current) => prev.frameNumber < current.frameNumber ? prev : current);
    const scrubThumbRight = arrayToCompare.reduce((prev, current) => prev.frameNumber > current.frameNumber ? prev : current);

    this.setState({
      showScrubWindow: true,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
    });
  }

  onScrubWindowMouseOver(e) {
    if (e.clientY < (MENU_HEADER_HEIGHT + this.state.containerHeight)) {
      // depending on if add before (shift) or after (alt) changing the mapping range
      const tempLeftFrameNumber = this.state.keyObject.altKey ? this.state.scrubThumb.frameNumber : this.state.scrubThumbLeft.frameNumber
      const tempRightFrameNumber = this.state.keyObject.shiftKey ? this.state.scrubThumb.frameNumber : this.state.scrubThumbRight.frameNumber
      const scrubFrameNumber = mapRange(e.clientX, 0, this.state.containerWidth, tempLeftFrameNumber, tempRightFrameNumber);
      this.updateOpencvVideoCanvas(scrubFrameNumber);
    } else {
      this.setState({
        showScrubWindow: false,
      });
    }
  }

  onScrubWindowStop(e) {
    const { store } = this.context;
    if (e.clientY < (MENU_HEADER_HEIGHT + this.state.containerHeight)) {
      // depending on if add before (shift) or after (alt) changing the mapping range
      const tempLeftFrameNumber = this.state.keyObject.altKey ? this.state.scrubThumb.frameNumber : this.state.scrubThumbLeft.frameNumber
      const tempRightFrameNumber = this.state.keyObject.shiftKey ? this.state.scrubThumb.frameNumber : this.state.scrubThumbRight.frameNumber
      const scrubFrameNumber = mapRange(e.clientX, 0, this.state.containerWidth, tempLeftFrameNumber, tempRightFrameNumber);
      if (this.state.keyObject.altKey || this.state.keyObject.shiftKey) {
        const newThumbId = uuidV4();
        if (this.state.keyObject.altKey) {
          store.dispatch(addThumb(
            this.props.file,
            scrubFrameNumber,
            this.props.thumbs.find((thumb) => thumb.thumbId === this.state.scrubThumb.thumbId).index + 1,
            newThumbId
          ));
        } else { // if shiftKey
          store.dispatch(addThumb(
            this.props.file,
            scrubFrameNumber,
            this.props.thumbs.find((thumb) => thumb.thumbId === this.state.scrubThumb.thumbId).index,
            newThumbId
          ));
        }
      } else { // if normal set new thumb
        store.dispatch(changeThumb(this.props.file, this.state.scrubThumb.thumbId, scrubFrameNumber));
      }
    }
    this.setState({
      showScrubWindow: false,
    });
  }

  onViewToggle() {
    const { store } = this.context;
    if (this.props.visibilitySettings.showMoviePrintView) {
      this.hideSettings();
      this.hideMovielist();
      store.dispatch(showThumbView());
    } else {
      store.dispatch(showMoviePrintView());
    }
  }

  onSaveMoviePrint() {
    const data = {
      elementId: 'ThumbGrid',
      file: this.props.file,
      // scale: 1,
      moviePrintWidth: this.props.settings.defaultMoviePrintWidth,
      // scale: this.props.settings.defaultThumbnailScale / this.state.outputScaleCompensator,
      thumbs: this.props.thumbs,
      settings: this.props.settings,
      visibilitySettings: this.props.visibilitySettings,

    };
    console.log(data);
    this.setState(
      { savingMoviePrint: true },
      ipcRenderer.send('request-save-MoviePrint', data)
    );
  }

  onOpenFeedbackForm() {
    console.log('onOpenFeedbackForm');
    this.setState(
      { showFeedbackForm: true }
    )
  }

  onCloseFeedbackForm() {
    console.log('onCloseFeedbackForm');
    this.setState(
      { showFeedbackForm: false }
    )
  }

  onChangeRow = (value) => {
    this.setState({ thumbCountTemp: this.state.columnCountTemp * value });
    this.updateScaleValue();
  };

  onChangeColumn = (value) => {
    const { store } = this.context;
    const tempRowCount = Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
    this.setState({ columnCountTemp: value });
    if (this.state.reCapture) {
      this.setState({ thumbCountTemp: tempRowCount * value });
    }
    if (this.props.file !== undefined) {
      store.dispatch(updateFileColumnCount(
        this.props.file.id,
        value
      ));
    }
    this.updateScaleValue();
  };

  onChangeColumnAndApply = (value) => {
    const { store } = this.context;
    this.setState({
      columnCountTemp: value,
      columnCount: value
    });
    if (this.props.file !== undefined) {
      store.dispatch(updateFileColumnCount(
        this.props.file.id,
        value
      ));
    }
    this.updateScaleValue();
  };

  onShowPaperPreviewClick = (checked) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowPaperPreview(checked));
  };

  onPaperAspectRatioClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultPaperAspectRatioInv(value));
  };

  onDetectInOutPointClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultDetectInOutPoint(value));
  };

  onReCaptureClick = (checked) => {
    console.log(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    if (!checked) {
      this.setState({ thumbCountTemp: this.state.thumbCount });
    } else {
      const newThumbCount = this.state.columnCountTemp *
        Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
      this.setState({ thumbCountTemp: newThumbCount });
    }
    this.setState({ reCapture: checked });
  };

  onApplyClick = () => {
    const { store } = this.context;
    console.log(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    this.setState({ columnCount: this.state.columnCountTemp });
    if (this.state.reCapture) {
      this.setState({ thumbCount: this.state.thumbCountTemp });
      this.onThumbCountChange(this.state.columnCountTemp, this.state.thumbCountTemp);
    }
    if (this.props.file !== undefined) {
      store.dispatch(updateFileColumnCount(
        this.props.file.id,
        this.state.columnCountTemp
      ));
    }
    this.hideSettings();
  };

  onCancelClick = () => {
    console.log(this.state.columnCount);
    console.log(this.state.thumbCount);
    this.setState({ columnCountTemp: this.state.columnCount });
    this.setState({ thumbCountTemp: this.state.thumbCount });
    this.hideSettings();
  };

  onThumbCountChange = (columnCount, thumbCount) => {
    const { store } = this.context;
    store.dispatch(setDefaultColumnCount(columnCount));
    store.dispatch(setDefaultThumbCount(thumbCount));
    if (this.props.currentFileId !== undefined) {
      store.dispatch(addDefaultThumbs(
        this.props.file,
        thumbCount,
        getLowestFrame(getVisibleThumbs(
          (this.props.thumbsByFileId[this.props.currentFileId] === undefined)
            ? undefined : this.props.thumbsByFileId[this.props.currentFileId].thumbs,
          this.props.visibilitySettings.visibilityFilter
        )),
        getHighestFrame(getVisibleThumbs(
          (this.props.thumbsByFileId[this.props.currentFileId] === undefined)
            ? undefined : this.props.thumbsByFileId[this.props.currentFileId].thumbs,
          this.props.visibilitySettings.visibilityFilter
        ))
      ));
    }
  };

  onChangeMargin = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultMarginRatio(value /
        store.getState().undoGroup.present.settings.defaultMarginSliderFactor));
  };

  onShowHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowHeader(value));
  };

  onRoundedCornersClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultRoundedCorners(value));
  };

  toggleZoom = () => {
    this.setState({
      zoom: !this.state.zoom
    });
  };

  disableZoom = () => {
    this.setState({
      zoom: false
    });
  };

  onToggleShowHiddenThumbsClick = () => {
    const { store } = this.context;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_ALL') {
      store.dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    } else {
      store.dispatch(setVisibilityFilter('SHOW_ALL'));
    }
  };

  onShowHiddenThumbsClick = (value) => {
    const { store } = this.context;
    if (value) {
      store.dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      store.dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  };

  onThumbInfoClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultThumbInfo(value));
  };

  onChangeOutputPathClick = () => {
    const { store } = this.context;
    const newPathArray = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    const newPath = (newPathArray !== undefined ? newPathArray[0] : undefined);
    if (newPath) {
      console.log(newPath);
      store.dispatch(setDefaultOutputPath(newPath));
    }
  };

  onOutputFormatClick = (value) => {
    const { store } = this.context;
    console.log(value);
    store.dispatch(setDefaultOutputFormat(value));
  };

  onOverwriteClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultSaveOptionOverwrite(value));
  };

  onIncludeIndividualClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultSaveOptionIncludeIndividual(value));
  };

  onThumbnailScaleClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultThumbnailScale(value));
  };

  onMoviePrintWidthClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultMoviePrintWidth(value));
  };

  updateOpencvVideoCanvas(currentFrame) {
    setPosition(this.state.opencvVideo, currentFrame, this.props.file.useRatio);
    const frame = this.state.opencvVideo.read();
    if (!frame.empty) {
      const tempWidth = parseInt((this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv, 10);
      const tempHeight = parseInt(this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio, 10);

      const img = frame.resizeToMax(Math.max(tempWidth, tempHeight));
      // renderImage(matResized, this.opencvVideoCanvasRef, opencv);
      const matRGBA = img.channels === 1 ? img.cvtColor(opencv.COLOR_GRAY2RGBA) : img.cvtColor(opencv.COLOR_BGR2RGBA);

      this.opencvVideoCanvasRef.current.height = img.rows;
      this.opencvVideoCanvasRef.current.width = img.cols;
      const imgData = new ImageData(
        new Uint8ClampedArray(matRGBA.getData()),
        img.cols,
        img.rows
      );
      const ctx = this.opencvVideoCanvasRef.current.getContext('2d');
      ctx.putImageData(imgData, 0, 0);
    }
  }

  render() {
    const { accept, dropzoneActive } = this.state;
    const { store } = this.context;

    const chartHeight = this.state.containerHeight / 4;

    return (
      <ErrorBoundary>
        <Dropzone
          ref={(el) => { this.dropzoneRef = el; }}
          disableClick
          disablePreview
          style={{ position: 'relative' }}
          accept={this.state.accept}
          onDrop={this.onDrop.bind(this)}
          onDragEnter={this.onDragEnter.bind(this)}
          onDragLeave={this.onDragLeave.bind(this)}
          className={styles.dropzoneshow}
          acceptClassName={styles.dropzoneshowAccept}
          rejectClassName={styles.dropzoneshowReject}
        >
          {({ isDragAccept, isDragReject }) => {
            return (
              <div>
                <div className={`${styles.Site}`}>
                  <Header
                    visibilitySettings={this.props.visibilitySettings}
                    settings={this.props.settings}
                    file={this.props.file}
                    toggleMovielist={this.toggleMovielist}
                    toggleSettings={this.toggleSettings}
                    toggleZoom={this.toggleZoom}
                    toggleView={this.onViewToggle}
                    onToggleShowHiddenThumbsClick={this.onToggleShowHiddenThumbsClick}
                    onThumbInfoClick={this.onThumbInfoClick}
                    openDialog={() => this.dropzoneRef.open()}
                    zoom={this.state.zoom}
                  />
                  <TransitionablePortal
                    // onClose={this.setState({ progressMessage: undefined })}
                    // open={true}
                    open={this.state.progressBarPercentage < 100}
                    // open
                    transition={{
                      animation: 'fade up',
                      duration: 600,
                    }}
                    closeOnDocumentClick={false}
                    closeOnEscape={false}
                    closeOnPortalMouseLeave={false}
                    closeOnRootNodeClick={false}
                    closeOnTriggerBlur={false}
                    closeOnTriggerClick={false}
                    closeOnTriggerMouseLeave={false}
                  >
                    <Progress
                      percent={this.state.progressBarPercentage}
                      attached="bottom"
                      size="tiny"
                      indicating
                      // progress
                      style={{
                        position: 'absolute',
                        bottom: MENU_FOOTER_HEIGHT,
                        width: '100%',
                        zIndex: 1000,
                        margin: 0
                      }}
                    />
                  </TransitionablePortal>
                  <div
                    className={`${styles.SiteContent}`}
                    ref={(el) => { this.siteContent = el; }}
                    style={{
                      height: `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)`
                    }}
                  >
                    <div
                      className={`${styles.ItemSideBar} ${styles.ItemMovielist} ${this.props.visibilitySettings.showMovielist ? styles.ItemMovielistAnim : ''}`}
                    >
                      <FileList />
                    </div>
                    <div
                      className={`${styles.ItemSideBar} ${styles.ItemSettings} ${this.props.visibilitySettings.showSettings ? styles.ItemSettingsAnim : ''}`}
                    >
                      <SettingsList
                        settings={this.props.settings}
                        visibilitySettings={this.props.visibilitySettings}
                        file={this.props.file}
                        columnCountTemp={this.state.columnCountTemp}
                        thumbCountTemp={this.state.thumbCountTemp}
                        thumbCount={this.state.thumbCount}
                        rowCountTemp={Math.ceil(this.state.thumbCountTemp /
                          this.state.columnCountTemp)}
                        columnCount={this.state.columnCount}
                        rowCount={Math.ceil(this.state.thumbCount / this.state.columnCount)}
                        reCapture={this.state.reCapture}
                        onChangeColumn={this.onChangeColumn}
                        onChangeColumnAndApply={this.onChangeColumnAndApply}
                        onChangeRow={this.onChangeRow}
                        onShowPaperPreviewClick={this.onShowPaperPreviewClick}
                        onPaperAspectRatioClick={this.onPaperAspectRatioClick}
                        onDetectInOutPointClick={this.onDetectInOutPointClick}
                        onReCaptureClick={this.onReCaptureClick}
                        onApplyClick={this.onApplyClick}
                        onCancelClick={this.onCancelClick}
                        onChangeMargin={this.onChangeMargin}
                        onShowHeaderClick={this.onShowHeaderClick}
                        onRoundedCornersClick={this.onRoundedCornersClick}
                        onShowHiddenThumbsClick={this.onShowHiddenThumbsClick}
                        onThumbInfoClick={this.onThumbInfoClick}
                        onChangeOutputPathClick={this.onChangeOutputPathClick}
                        onOutputFormatClick={this.onOutputFormatClick}
                        onOverwriteClick={this.onOverwriteClick}
                        onIncludeIndividualClick={this.onIncludeIndividualClick}
                        onThumbnailScaleClick={this.onThumbnailScaleClick}
                        onMoviePrintWidthClick={this.onMoviePrintWidthClick}
                        scaleValueObject={this.state.scaleValueObject}
                      />
                    </div>
                    <div
                      className={`${styles.ItemVideoPlayer} ${this.props.visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''}`}
                      style={{
                        top: `${MENU_HEADER_HEIGHT + this.props.settings.defaultBorderMargin}px`,
                        transform: !this.props.visibilitySettings.showMoviePrintView ? 'translate(-50%, 0px)' : `translate(-50%, ${(this.state.scaleValueObject.videoPlayerHeight + this.props.settings.defaultVideoPlayerControllerHeight) * -1}px)`,
                        overflow: !this.props.visibilitySettings.showMoviePrintView ? 'visible' : 'hidden'
                      }}
                    >
                      { this.props.file ? (
                        <VideoPlayer
                          // visible={!this.props.visibilitySettings.showMoviePrintView}
                          ref={(el) => { this.videoPlayer = el; }}
                          file={this.props.file}
                          aspectRatioInv={this.state.scaleValueObject.aspectRatioInv}
                          height={this.state.scaleValueObject.videoPlayerHeight}
                          width={this.state.scaleValueObject.videoPlayerWidth}
                          controllerHeight={this.props.settings.defaultVideoPlayerControllerHeight}
                          selectedThumbId={this.state.selectedThumbObject ?
                            this.state.selectedThumbObject.thumbId : undefined}
                          frameNumber={this.state.selectedThumbObject ?
                            this.state.selectedThumbObject.frameNumber : 0}
                          onThumbDoubleClick={this.onViewToggle}
                          selectMethod={this.onSelectMethod}
                          keyObject={this.state.keyObject}
                          opencvVideo={this.state.opencvVideo}
                        />
                      ) :
                      (
                        <div
                          style={{
                            opacity: '0.3',
                          }}
                        >
                          <ThumbEmpty
                            color={(this.state.colorArray !== undefined ?
                              this.state.colorArray[0] : undefined)}
                            thumbImageObjectUrl={undefined}
                            aspectRatioInv={this.state.scaleValueObject.aspectRatioInv}
                            thumbWidth={this.state.scaleValueObject.videoPlayerWidth}
                            borderRadius={this.state.scaleValueObject.newBorderRadius}
                            margin={this.state.scaleValueObject.newThumbMargin}
                          />
                        </div>
                      )
                      }
                    </div>
                    <div
                      ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
                      className={`${styles.ItemMain} ${this.props.visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainRightAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainEdit : ''} ${!this.props.visibilitySettings.showMoviePrintView ? styles.ItemMainTopAnim : ''}`}
                      style={{
                        width: (this.props.visibilitySettings.showSettings || (this.props.visibilitySettings.showMoviePrintView && !this.state.zoom))
                          ? undefined : this.state.scaleValueObject.newMoviePrintWidth,
                        marginTop: this.props.visibilitySettings.showMoviePrintView ? undefined :
                          `${this.state.scaleValueObject.videoPlayerHeight +
                            (this.props.settings.defaultBorderMargin * 2)}px`,
                        minHeight: this.props.visibilitySettings.showMoviePrintView ? `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)` : undefined,
                        // backgroundImage: `url(${paperBorderPortrait})`,
                        backgroundImage: ((this.props.visibilitySettings.showSettings && this.props.settings.defaultShowPaperPreview) ||
                          (this.props.file && this.props.visibilitySettings.showMoviePrintView && this.props.settings.defaultShowPaperPreview)) ?
                          `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${(this.props.settings.defaultPaperAspectRatioInv < this.state.scaleValueObject.moviePrintAspectRatioInv) ? (this.state.scaleValueObject.newMoviePrintHeight / this.props.settings.defaultPaperAspectRatioInv) : this.state.scaleValueObject.newMoviePrintWidth}' height='${(this.props.settings.defaultPaperAspectRatioInv < this.state.scaleValueObject.moviePrintAspectRatioInv) ? this.state.scaleValueObject.newMoviePrintHeight : (this.state.scaleValueObject.newMoviePrintWidth * this.props.settings.defaultPaperAspectRatioInv)}' style='background-color: rgba(245,245,245,${this.props.visibilitySettings.showSettings ? 1 : 0.02});'></svg>")` : undefined,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                      }}
                    >
                      { (this.props.file || this.props.visibilitySettings.showSettings) ? (
                        <SortedVisibleThumbGrid
                          inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                          showSettings={this.props.visibilitySettings.showSettings}
                          file={this.props.file}
                          thumbs={this.props.thumbs}
                          thumbImages={this.props.thumbImages}
                          settings={this.props.settings}
                          visibilitySettings={this.props.visibilitySettings}
                          selectedThumbId={this.state.selectedThumbObject ?
                            this.state.selectedThumbObject.thumbId : undefined}
                          selectMethod={this.onSelectMethod}
                          onScrubClick={this.onScrubClick}
                          onThumbDoubleClick={this.onViewToggle}

                          colorArray={this.state.colorArray}
                          thumbCount={this.state.thumbCountTemp}

                          showMoviePrintView={this.props.visibilitySettings.showMoviePrintView}
                          scaleValueObject={this.state.scaleValueObject}
                          keyObject={this.state.keyObject}
                        />
                      ) :
                      (
                        <div
                          className={styles.ItemMainStartupContainer}
                        >
                          <img
                            src={steps}
                            style={{
                              width: `calc(100vw - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)`,
                              height: `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)`,
                              maxWidth: 1000,
                              maxHeight: 500,
                              margin: 'auto'
                            }}
                            alt=""
                          />
                        </div>
                      )
                      }
                    </div>
                  </div>
                  <TransitionablePortal
                    // onClose={this.setState({ progressMessage: undefined })}
                    open={this.state.showMessage}
                    // open
                    // transition={{
                    //   animation: 'fade up',
                    //   duration: 600,
                    // }}
                    closeOnDocumentClick={false}
                    closeOnEscape={false}
                    closeOnPortalMouseLeave={false}
                    closeOnRootNodeClick={false}
                    closeOnTriggerBlur={false}
                    closeOnTriggerClick={false}
                    closeOnTriggerMouseLeave={false}
                  >
                    <Segment
                      className={stylesPop.toast}
                      size='large'
                    >
                      {this.state.progressMessage}
                    </Segment>
                  </TransitionablePortal>
                  <Modal
                    open={this.state.showFeedbackForm}
                    onClose={() => this.setState({ intendToCloseFeedbackForm: true})}
                    closeIcon
                    // closeOnEscape={false}
                    // closeOnRootNodeClick={false}
                    // basic
                    size='fullscreen'
                    style={{
                      marginTop: 0,
                      height: '80vh',
                    }}
                    onMount={() => {
                      setTimeout(() => {
                        this.webviewRef.current.addEventListener('ipc-message', event => {
                          console.log(event);
                          console.log(event.channel);
                          if (event.channel === 'wpcf7mailsent') {
                            const rememberEmail = event.args[0].findIndex((argument) => argument.name === 'checkbox-remember-email[]') >= 0;
                            if (rememberEmail) {
                              const emailAddressFromForm = event.args[0].find((argument) => argument.name === 'your-email').value;
                              store.dispatch(setEmailAddress(emailAddressFromForm));
                            }
                            this.onCloseFeedbackForm();
                          }
                        })
                        // console.log(this.webviewRef.current.getWebContents());
                        // this.webviewRef.current.addEventListener('dom-ready', () => {
                        //   this.webviewRef.current.openDevTools();
                        // })
                        // this.webviewRef.current.addEventListener('did-stop-loading', (event) => {
                        //   console.log(event);
                        // });
                        // this.webviewRef.current.addEventListener('did-start-loading', (event) => {
                        //   console.log(event);
                        // });
                      }, 300); // wait a tiny bit until webview is mounted
                    }}
                  >
                    <Modal.Content
                      // scrolling
                      style={{
                        // overflow: 'auto',
                        // height: '80vh',
                      }}
                    >
                      <webview
                        autosize='true'
                        // nodeintegration='true'
                        // disablewebsecurity='true'
                        // minheight='80vh'
                        style={{
                          height: '80vh',
                        }}
                        preload='./webViewPreload.js'
                        ref={this.webviewRef}
                        src={`http://movieprint.fakob.com/feedback-for-movieprint-app?app-version=${app.getName()}-${app.getVersion()}&your-email=${this.props.settings.emailAddress}`}
                      />
                      <Modal
                        open={this.state.intendToCloseFeedbackForm}
                        basic
                        size='mini'
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          margin: 'auto !important'
                        }}
                      >
                        <Modal.Content>
                          <p>
                            Close the feedback form?
                          </p>
                        </Modal.Content>
                        <Modal.Actions>
                          <Button basic color='red' inverted onClick={() => this.setState({ intendToCloseFeedbackForm: false})}>
                            <Icon name='remove' /> Cancel
                          </Button>
                          <Button color='green' inverted onClick={() => this.setState({ showFeedbackForm: false, intendToCloseFeedbackForm: false})}>
                            <Icon name='checkmark' /> Close
                          </Button>
                        </Modal.Actions>
                      </Modal>
                    </Modal.Content>
                  </Modal>
                  <Footer
                    visibilitySettings={this.props.visibilitySettings}
                    file={this.props.file}
                    onOpenFeedbackForm={this.onOpenFeedbackForm}
                    showFeedbackForm={this.state.showFeedbackForm}
                    onSaveMoviePrint={this.onSaveMoviePrint}
                    savingMoviePrint={this.state.savingMoviePrint}
                    showMoviePrintView={this.props.visibilitySettings.showMoviePrintView}
                  />
                </div>
                { this.state.showScrubWindow &&
                  <div
                    className={styles.scrubWindowBackground}
                    onMouseMove={this.onScrubWindowMouseOver}
                    onMouseUp={this.onScrubWindowStop}
                  >
                    <div
                      className={styles.scrubWindow}
                      style={{
                        height: this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                        width: this.state.containerWidth,
                      }}
                    >
                      <span
                        className={styles.scrubThumbLeft}
                        style={{
                          backgroundImage: `url(${this.state.keyObject.altKey ?
                            getObjectProperty(() => this.props.thumbImages[this.state.scrubThumb.frameId].objectUrl) :
                            getObjectProperty(() => this.props.thumbImages[this.state.scrubThumbLeft.frameId].objectUrl) || transparent})`,
                          height: this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                          width: (this.state.containerWidth -
                            ((this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv)) / 2 -
                            this.props.settings.defaultScrubWindowMargin,
                          marginRight: this.props.settings.defaultScrubWindowMargin,
                        }}
                      />
                      {this.state.keyObject.ctrlKey &&
                        <div
                          style={{
                            content: '',
                            backgroundImage: `url(${getObjectProperty(() => this.props.thumbImages[this.state.scrubThumb.frameId].objectUrl)})`,
                            backgroundSize: 'cover',
                            opacity: '0.4',
                            position: 'absolute',
                            width: (this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv,
                            height: this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                            top: 0,
                            left: this.state.keyObject.altKey ? (this.state.containerWidth -
                              ((this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv)) / 2 -
                              this.props.settings.defaultScrubWindowMargin + (this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv :
                              (this.state.containerWidth -
                                ((this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv)) / 2 -
                                this.props.settings.defaultScrubWindowMargin,
                          }}
                        />
                      }
                      <span
                        style={{
                          width: (this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv,
                          height: this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                        }}
                      >
                        <canvas
                          ref={this.opencvVideoCanvasRef}
                        />
                      </span>
                      <span
                        className={styles.scrubThumbRight}
                        style={{
                          backgroundImage: `url(${this.state.keyObject.shiftKey ?
                            getObjectProperty(() => this.props.thumbImages[this.state.scrubThumb.frameId].objectUrl) :
                            getObjectProperty(() => this.props.thumbImages[this.state.scrubThumbRight.frameId].objectUrl) || transparent})`,
                          height: this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                          width: (this.state.containerWidth -
                            ((this.state.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.state.scaleValueObject.aspectRatioInv)) / 2 -
                            this.props.settings.defaultScrubWindowMargin,
                          marginLeft: this.props.settings.defaultScrubWindowMargin,
                        }}
                      />
                    </div>
                    {/* <div
                      className={`${styles.scrubDescription} ${styles.textButton}`}
                      style={{
                        height: `${MENU_HEADER_HEIGHT}px`,
                      }}
                    >
                      {this.state.keyObject.altKey ? 'Add after' : (this.state.keyObject.shiftKey ? 'Add before' : 'Change')}
                    </div> */}
                    <div
                      className={`${styles.scrubCancelBar}`}
                      style={{
                        height: `${MENU_FOOTER_HEIGHT}px`,
                      }}
                    >
                      Cancel
                    </div>
                  </div>
                }
                { DEV_OPENCV_SCENE_DETECTION &&
                  <div
                    className={styles.chart}
                    style={{
                      height: `${chartHeight}px`,
                    }}
                  >
                    <Bar
                      data={this.state.chartData}
                      width={this.state.containerWidth}
                      height={chartHeight}
                      options={{
                        maintainAspectRatio: true,
                        barPercentage: 1.0,
                        categoryPercentage: 1.0,
                        // responsive : true,
                      }}
                    />
                  </div>
                }
                { dropzoneActive &&
                  <div
                    className={`${styles.dropzoneshow} ${isDragAccept ? styles.dropzoneshowAccept : ''} ${isDragReject ? styles.dropzoneshowReject : ''}`}
                  >
                    <div
                      className={styles.dropzoneshowContent}
                    >
                      {`${isDragAccept ? 'DROP' : ''} ${isDragReject ? 'NOT ALLOWED' : ''}`}
                    </div>
                  </div>
                }
              </div>
            );
          }}
        </Dropzone>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = state => {
  const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  const tempThumbs = (state.undoGroup.present
    .thumbsByFileId[tempCurrentFileId] === undefined)
    ? undefined : state.undoGroup.present
      .thumbsByFileId[tempCurrentFileId].thumbs;
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    thumbImages: (state.thumbsObjUrls[tempCurrentFileId] === undefined)
      ? undefined : state.thumbsObjUrls[tempCurrentFileId],
    currentFileId: tempCurrentFileId,
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files
      .find((file) => file.id === tempCurrentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings,
    defaultThumbCount: state.undoGroup.present.settings.defaultThumbCount,
    defaultColumnCount: state.undoGroup.present.settings.defaultColumnCount,
    thumbsByFileId: state.undoGroup.present.thumbsByFileId,
  };
};

App.contextTypes = {
  store: PropTypes.object
};

App.defaultProps = {
  currentFileId: undefined,
  file: undefined,
  thumbs: [],
  thumbsByFileId: {},
};

App.propTypes = {
  currentFileId: PropTypes.string,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    columnCount: PropTypes.number,
    path: PropTypes.string,
    useRatio: PropTypes.bool,
  }),
  settings: PropTypes.object.isRequired,
  thumbs: PropTypes.array,
  thumbsByFileId: PropTypes.object,
  visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(App);
