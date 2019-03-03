import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import { TransitionablePortal, Segment, Progress, Modal, Button, Icon, Container, Loader, Header, Divider } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import {Line, defaults} from 'react-chartjs-2';
import path from 'path';
import throttle from 'lodash/throttle';
import log from 'electron-log';
import os from 'os';
import Database from 'better-sqlite3';

import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import SortedVisibleSceneGrid from '../containers/VisibleSceneGrid';
import Conditional from '../components/Conditional';
import ErrorBoundary from '../components/ErrorBoundary';
import HeaderComponent from '../components/HeaderComponent';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import Scrub from '../components/Scrub';
import ThumbEmpty from '../components/ThumbEmpty';
import getScaleValueObject from '../utils/getScaleValueObject';
import { getLowestFrame,
  getHighestFrame,
  getVisibleThumbs,
  getColumnCount,
  getSecondsPerRow,
  getRandomSheetName,
  getSheetId,
  getSheetIdArray,
  getSheetType,
  getThumbsCount,
  getMoviePrintColor,
  getObjectProperty,
  setPosition,
  getScrubFrameNumber,
  isEquivalent,
  limitFrameNumberWithinMovieRange,
  arrayToObject,
} from '../utils/utils';
// import saveMoviePrint from '../utils/saveMoviePrint';
import styles from './App.css';
import stylesPop from './../components/Popup.css';
import {
  addIntervalSheet,
  addScene,
  addScenes,
  addThumb,
  changeThumb,
  clearScenes,
  deleteSheets,
  deleteSceneSheets,
  duplicateSheet,
  updateSheetType,
  hideMovielist,
  hideSettings,
  removeMovieListItem,
  setCurrentFileId,
  setDefaultCachedFramesSize,
  setDefaultColumnCount,
  setDefaultDetectInOutPoint,
  setDefaultMarginRatio,
  setDefaultMoviePrintWidth,
  setDefaultOutputFormat,
  setDefaultOutputPath,
  setDefaultOutputPathFromMovie,
  setDefaultPaperAspectRatioInv,
  setDefaultRoundedCorners,
  setDefaultSaveOptionIncludeIndividual,
  setDefaultSaveOptionOverwrite,
  setDefaultSceneDetectionThreshold,
  setDefaultShowDetailsInHeader,
  setDefaultShowHeader,
  setDefaultShowPaperPreview,
  setDefaultShowPathInHeader,
  setDefaultShowTimelineInHeader,
  setDefaultThumbCount,
  setDefaultThumbInfo,
  setDefaultThumbnailScale,
  setDefaultTimelineViewFlow,
  setDefaultTimelineViewMinDisplaySceneLengthInFrames,
  setDefaultTimelineViewSecondsPerRow,
  setDefaultTimelineViewWidthScale,
  setEmailAddress,
  addMoviesToList,
  setCurrentSheetId,
  setSheetFit,
  setView,
  setVisibilityFilter,
  showMovielist,
  showSettings,
  updateSheetSecondsPerRow,
  updateSheetColumnCount,
  updateSheetName,
  updateFileDetails,
  updateFileDetailUseRatio,
  updateFrameNumber,
  updateInOutPoint,
} from '../actions';
import {
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  ZOOM_SCALE,
  SCENE_DETECTION_MIN_SCENE_LENGTH,
  DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN,
  VIEW,
  SHEET_FIT,
  SHEET_TYPE,
  DEFAULT_THUMB_COUNT,
  DEFAULT_CACHED_FRAMES_SIZE,
  FRAMESDB_PATH,
} from '../utils/constants';
import {
  deleteTableFramelist,
} from '../utils/utilsForIndexedDB';
import {
  deleteTableFrameScanList,
  deleteTableMovielist,
  getAllFrames,
  getAllFramesByFileId,
  getFrameScanByFileId,
} from '../utils/utilsForSqlite';

import startupImg from '../img/MoviePrint-steps.svg';
import transparent from '../img/Thumb_TRANSPARENT.png';

const { ipcRenderer } = require('electron');
const { dialog, app } = require('electron').remote;
const opencv = require('opencv4nodejs');

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: console.log });
moviePrintDB.pragma('journal_mode = WAL');

// const DEV_OPENCV_SCENE_DETECTION = process.env.DEV_OPENCV_SCENE_DETECTION === 'true';

// Disable animating charts by default.
defaults.global.animation = false;

const loadSheetPropertiesIntoState = (
  that,
  columnCount,
  thumbCount,
  secondsPerRowTemp = undefined,
) => {
  that.setState({
    columnCountTemp: columnCount,
    thumbCountTemp: thumbCount,
    columnCount,
    thumbCount,
    secondsPerRowTemp
  });
};

class App extends Component {
  constructor() {
    super();

    this.webviewRef = React.createRef();
    this.opencvVideoCanvasRef = React.createRef();
    this.dropzoneRef = React.createRef();

    this.state = {
      containerHeight: 0,
      containerWidth: 0,
      secondsPerRowTemp: undefined,
      columnCountTemp: undefined,
      thumbCountTemp: undefined,
      columnCount: undefined,
      thumbCount: undefined,
      reCapture: true,
      colorArray: undefined,
      scaleValueObject: undefined,
      savingMoviePrint: false,
      selectedThumbObject: undefined,
      selectedSceneObject: undefined,
      // file match needs to be in sync with addMoviesToList() and onDrop() !!!
      accept: 'video/*,.divx,.mkv,.ogg,.VOB,',
      dropzoneActive: false,
      loadingFirstFile: false,
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
      showChart: false,
      chartData: {
        labels: ["Inpoint", "Outpoint"],
        datasets: [{
          label: "Empty dataset",
          backgroundColor: 'rgb(0, 99, 132)',
          data: [0, 0],
        }]
      },
      fileScanRunning: false,
      sheetsToPrint: [],
      savingAllMoviePrints: false,
      objectUrlsArray: [],
      framesToFetch: [],
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.onSelectThumbMethod = this.onSelectThumbMethod.bind(this);
    this.onSelectSceneMethod = this.onSelectSceneMethod.bind(this);

    this.showMovielist = this.showMovielist.bind(this);
    this.hideMovielist = this.hideMovielist.bind(this);
    this.toggleMovielist = this.toggleMovielist.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.showSettings = this.showSettings.bind(this);
    this.hideSettings = this.hideSettings.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onViewToggle = this.onViewToggle.bind(this);
    this.onScrubWindowMouseOver = this.onScrubWindowMouseOver.bind(this);
    this.onScrubWindowClick = this.onScrubWindowClick.bind(this);
    this.onScrubClick = this.onScrubClick.bind(this);
    // this.onSelectClick = this.onSelectClick.bind(this);
    this.onEnterClick = this.onEnterClick.bind(this);
    this.onAddThumbClick = this.onAddThumbClick.bind(this);
    this.switchToPrintView = this.switchToPrintView.bind(this);
    this.openMoviesDialog = this.openMoviesDialog.bind(this);
    this.onOpenFeedbackForm = this.onOpenFeedbackForm.bind(this);
    this.onCloseFeedbackForm = this.onCloseFeedbackForm.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);
    this.onSaveAllMoviePrints = this.onSaveAllMoviePrints.bind(this);

    this.updatecontainerWidthAndHeight = this.updatecontainerWidthAndHeight.bind(this);
    this.updateScaleValue = this.updateScaleValue.bind(this);
    this.recaptureAllFrames = this.recaptureAllFrames.bind(this);

    this.onFileListElementClick = this.onFileListElementClick.bind(this);
    this.onErrorPosterFrame = this.onErrorPosterFrame.bind(this);
    this.getThumbsForFile = this.getThumbsForFile.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onChangeColumnAndApply = this.onChangeColumnAndApply.bind(this);
    this.onShowPaperPreviewClick = this.onShowPaperPreviewClick.bind(this);
    this.onOutputPathFromMovieClick = this.onOutputPathFromMovieClick.bind(this);
    this.onPaperAspectRatioClick = this.onPaperAspectRatioClick.bind(this);
    this.onDetectInOutPointClick = this.onDetectInOutPointClick.bind(this);
    this.onReCaptureClick = this.onReCaptureClick.bind(this);
    this.onApplyNewGridClick = this.onApplyNewGridClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);

    this.onChangeMargin = this.onChangeMargin.bind(this);
    this.onChangeMinDisplaySceneLength = this.onChangeMinDisplaySceneLength.bind(this);
    this.onChangeSceneDetectionThreshold = this.onChangeSceneDetectionThreshold.bind(this);
    this.onChangeTimelineViewSecondsPerRow = this.onChangeTimelineViewSecondsPerRow.bind(this);
    this.onChangeTimelineViewWidthScale = this.onChangeTimelineViewWidthScale.bind(this);
    this.onTimelineViewFlowClick = this.onTimelineViewFlowClick.bind(this);
    this.onShowHeaderClick = this.onShowHeaderClick.bind(this);
    this.onShowPathInHeaderClick = this.onShowPathInHeaderClick.bind(this);
    this.onShowDetailsInHeaderClick = this.onShowDetailsInHeaderClick.bind(this);
    this.onShowTimelineInHeaderClick = this.onShowTimelineInHeaderClick.bind(this);
    this.onRoundedCornersClick = this.onRoundedCornersClick.bind(this);
    this.toggleZoom = this.toggleZoom.bind(this);
    this.disableZoom = this.disableZoom.bind(this);
    this.onToggleShowHiddenThumbsClick = this.onToggleShowHiddenThumbsClick.bind(this);
    this.onSetSheetFitClick = this.onSetSheetFitClick.bind(this);
    this.onShowHiddenThumbsClick = this.onShowHiddenThumbsClick.bind(this);
    this.onThumbInfoClick = this.onThumbInfoClick.bind(this);
    this.onSetViewClick = this.onSetViewClick.bind(this);
    this.onChangeSheetTypeClick = this.onChangeSheetTypeClick.bind(this);
    this.onSetSheetClick = this.onSetSheetClick.bind(this);
    this.onDuplicateSheetClick = this.onDuplicateSheetClick.bind(this);
    this.onRemoveMovieListItem = this.onRemoveMovieListItem.bind(this);
    this.onDeleteSheetClick = this.onDeleteSheetClick.bind(this);
    this.onChangeOutputPathClick = this.onChangeOutputPathClick.bind(this);
    this.onOutputFormatClick = this.onOutputFormatClick.bind(this);
    this.onCachedFramesSizeClick = this.onCachedFramesSizeClick.bind(this);
    this.onOverwriteClick = this.onOverwriteClick.bind(this);
    this.onIncludeIndividualClick = this.onIncludeIndividualClick.bind(this);
    this.onThumbnailScaleClick = this.onThumbnailScaleClick.bind(this);
    this.onMoviePrintWidthClick = this.onMoviePrintWidthClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
    this.runSceneDetection = this.runSceneDetection.bind(this);
    this.runFileScan = this.runFileScan.bind(this);
    this.calculateSceneList = this.calculateSceneList.bind(this);
    this.onToggleDetectionChart = this.onToggleDetectionChart.bind(this);
    this.onHideDetectionChart = this.onHideDetectionChart.bind(this);

    // this.addToFramesToFetch = this.addToFramesToFetch.bind(this);
  }

  componentWillMount() {
    const { columnCountTemp, thumbCountTemp, containerWidth, containerHeight, zoom } = this.state;
    const { currentFileId, currentSheetId, file, scenes, settings, sheetsByFileId, visibilitySettings } = this.props;
    const { defaultShowPaperPreview, defaultThumbCountMax } = settings;

    // get objecturls from all frames in imagedb
    ipcRenderer.send(
      'message-from-mainWindow-to-indexedDBWorkerWindow',
      'get-arrayOfObjectUrls'
    );

    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    loadSheetPropertiesIntoState(
      this,
      getColumnCount(sheetsByFileId, undefined, undefined, settings),
      getThumbsCount(
        file,
        sheetsByFileId,
        settings,
        visibilitySettings
      ),
      secondsPerRow,
    );
    this.setState({
      colorArray: getMoviePrintColor(defaultThumbCountMax),
      scaleValueObject: getScaleValueObject(
        file,
        settings,
        visibilitySettings,
        columnCountTemp,
        thumbCountTemp,
        containerWidth,
        containerHeight,
        zoom ? ZOOM_SCALE : 0.95,
        zoom ? false : defaultShowPaperPreview,
        undefined,
        scenes,
        secondsPerRow,
      )
    });
    if (getObjectProperty(() => file.id)) {
      this.setState({
        opencvVideo: new opencv.VideoCapture(file.path),
      });
    }
  }

  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('delete-all-tables', (event) => {
      deleteTableMovielist();
      deleteTableFramelist();
      deleteTableFrameScanList();
    });

    ipcRenderer.on('progress', (event, fileId, progressBarPercentage) => {
      this.setState({
        progressBarPercentage: Math.ceil(progressBarPercentage)
      });
    });

    ipcRenderer.on('progressMessage', (event, status, message, time) => {
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

    ipcRenderer.on('error-savingMoviePrint', () => {
      if (this.state.savingMoviePrint) {
        setTimeout(
          this.setState({ savingMoviePrint: false }),
          1000
        ); // adding timeout to prevent clicking multiple times
      }
      ipcRenderer.send('reload-workerWindow');
    });

    ipcRenderer.on('receive-get-file-details', (event, fileId, filePath, posterFrameId, frameCount, width, height, fps, fourCC) => {
      store.dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-poster-frame', fileId, filePath, posterFrameId);
    });

    // poster frames don't have thumbId
    ipcRenderer.on('receive-get-poster-frame', (event, fileId, filePath, posterFrameId, frameNumber, useRatio) => {
      store.dispatch(updateFileDetailUseRatio(fileId, useRatio));
      // this.addToFramesToFetch(posterFrameId, true); // get posterframe to be fetched
      // get all posterframes
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-in-and-outpoint', fileId, filePath, useRatio, store.getState().undoGroup.present.settings.defaultDetectInOutPoint);
    });

    ipcRenderer.on('receive-get-in-and-outpoint', (event, fileId, fadeInPoint, fadeOutPoint) => {
      store.dispatch(updateInOutPoint(fileId, fadeInPoint, fadeOutPoint));
      // load thumbs for first item only until currentFileId is set
      // log.debug(this.props.currentFileId);
      if (this.props.currentFileId === undefined) {
        // log.debug('Hello, log, I am the firstItem');
        const newSheetId = uuidV4();
        const firstFile = store.getState().undoGroup.present.files.find((file) => file.id === fileId);
        store.dispatch(setCurrentFileId(firstFile.id));
        this.updateScaleValue(); // so the aspect ratio of the thumbs are correct after drag
        store.dispatch(clearScenes());
        store.dispatch(deleteSheets());
        // log.debug(firstFile);
        store.dispatch(addIntervalSheet(
          firstFile,
          newSheetId,
          store.getState().undoGroup.present.settings.defaultThumbCount,
          fadeInPoint,
          fadeOutPoint,
          this.props.settings.defaultCachedFramesSize
        ));
        const newColumnCount = getColumnCount(this.props.sheetsByFileId, firstFile.id, newSheetId, this.props.settings);
        store.dispatch(updateSheetColumnCount(firstFile.id, newSheetId, newColumnCount)); // set columnCount on firstFile
        store.dispatch(updateSheetName(firstFile.id, newSheetId, getRandomSheetName())); // set name on firstFile
        store.dispatch(updateSheetType(firstFile.id, newSheetId, SHEET_TYPE.INTERVAL));
        store.dispatch(setCurrentSheetId(newSheetId));
      }
      if (this.state.filesToLoad.length > 0) {
        // state should be immutable, therefor
        // make a copy with slice, then remove the first item with shift, then set new state
        const copyOfFilesToLoad = this.state.filesToLoad.slice();
        copyOfFilesToLoad.shift();
        this.setState({
          filesToLoad: copyOfFilesToLoad,
          loadingFirstFile: false,
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

    ipcRenderer.on('update-objectUrl', (event, frameId, objectUrl) => {
      const { objectUrlsArray } = this.state;
      this.setState({
        objectUrlsArray: [...objectUrlsArray, {
          frameId,
          objectUrl,
        }] // add objectUrl to array
      });
    });

    ipcRenderer.on('send-arrayOfObjectUrls', (event, arrayOfObjectUrls, append) => {
      const { objectUrlsArray } = this.state;
      if (append) {
        this.setState({
          objectUrlsArray: [...objectUrlsArray, ...arrayOfObjectUrls] // add objectUrls to array
        });
      } else {
        this.setState({
          objectUrlsArray: arrayOfObjectUrls
        });
      }
    });

    ipcRenderer.on('receive-get-thumbs', (event, fileId, sheetId, thumbId, frameId, frameNumber, lastThumb) => {
      if (lastThumb && this.state.timeBefore !== undefined) {
        const timeAfter = Date.now();
        log.debug(`receive-get-thumbs took ${timeAfter - this.state.timeBefore}ms`);
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
      }
      if (this.props.sheetsByFileId[fileId][sheetId].thumbsArray.find((thumb) =>
        thumb.thumbId === thumbId).frameNumber !== frameNumber) {
        store.dispatch(updateFrameNumber(fileId, sheetId, thumbId, frameNumber));
      }
      // check if this is the lastThumb of the sheetsToPrint when savingAllMoviePrints
      // if so change its status from gettingThumbs to readyForPrinting
      if (lastThumb && this.state.savingAllMoviePrints
        && this.state.sheetsToPrint.length > 0) {
          if (this.state.sheetsToPrint.findIndex(item => item.fileId === fileId && item.status === 'gettingThumbs' ) > -1) {
            // log.debug(this.state.sheetsToPrint);
            // state should be immutable, therefor
            const sheetsToPrint = this.state.sheetsToPrint.map((item) => {
              if(item.fileId !== fileId) {
                // This isn't the item we care about - keep it as-is
                return item;
              }
              // Otherwise, this is the one we want - return an updated value
              return {
                ...item,
                status: 'readyForPrinting'
              };
            });
            // log.debug(sheetsToPrint);
            this.setState({
              sheetsToPrint,
            });
          }
        }
    });

    ipcRenderer.on('clearScenes', (event, fileId) => {
      store.dispatch(clearScenes(
        fileId,
      ));
    });

    ipcRenderer.on('addScene', (event, fileId, start, length, colorArray) => {
      store.dispatch(addScene(
        fileId,
        start,
        length,
        colorArray,
      ));
    });

    ipcRenderer.on('received-get-file-scan', (event, fileId, filePath, useRatio) => {
      this.setState({
        fileScanRunning: false,
      });
      this.runSceneDetection(fileId, filePath, useRatio);
    });

    ipcRenderer.on('received-saved-file', (event, id, path) => {
      if (this.state.savingMoviePrint) {
        setTimeout(
          this.setState({ savingMoviePrint: false }),
          1000
        ); // adding timeout to prevent clicking multiple times
      } else if (this.state.savingAllMoviePrints) {
        // check if the sheet which was saved has been printing, then set status to done
        if (this.state.sheetsToPrint.findIndex(item => item.status === 'printing' ) > -1) {
          // state should be immutable, therefor
          const sheetsToPrint = this.state.sheetsToPrint.map((item) => {
            if(item.status !== 'printing') {
              // This isn't the item we care about - keep it as-is
              return item;
            }
            // Otherwise, this is the one we want - return an updated value
            return {
              ...item,
              status: 'done'
            };
          });
          // log.debug(sheetsToPrint);
          this.setState({
            sheetsToPrint,
          });
          // check if all files have been printed, then set savingAllMoviePrints to false
          if (this.state.sheetsToPrint.filter(item => item.status === 'done').length ===
            this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length) {
              this.setState({ savingAllMoviePrints: false });
          }
        }
      }
      log.debug(`Saved file: ${path}`);
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
      log.error(`Saved file error: ${message}`);
    });

    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('keyup', this.handleKeyUp);

    this.updatecontainerWidthAndHeight();
    window.addEventListener('resize', this.updatecontainerWidthAndHeight);
  }

  componentWillReceiveProps(nextProps) {
    const { store } = this.context;
    const { currentFileId, currentSheetId, file, settings, sheetsByFileId, visibilitySettings } = this.props;

    const secondsPerRow = getSecondsPerRow(nextProps.sheetsByFileId, nextProps.currentFileId, nextProps.currentSheetId, nextProps.settings);

    if (nextProps.file !== undefined &&
      (getObjectProperty(() => file.id) !== nextProps.file.id)) {
      this.setState({
        opencvVideo: new opencv.VideoCapture(nextProps.file.path),
      });
    }

    if (file !== undefined &&
      nextProps.file !== undefined &&
      file.id !== undefined) {

      const columnCount = getColumnCount(
        nextProps.sheetsByFileId,
        nextProps.file.id,
        nextProps.currentSheetId,
        nextProps.settings
      );

      // check if currentFileId or currentSheetId changed
      if (currentFileId !== nextProps.currentFileId ||
        currentSheetId !== nextProps.currentSheetId
      ) {
        const newThumbCount = getThumbsCount(
          nextProps.file,
          nextProps.sheetsByFileId,
          nextProps.settings,
          nextProps.visibilitySettings
        );

        loadSheetPropertiesIntoState(
          this,
          columnCount,
          newThumbCount,
          secondsPerRow,
        );
        log.debug('currentFileId or currentSheetId changed');
      }

      // check if visibleThumbCount changed
      const oldThumbCount = getThumbsCount(
        file,
        sheetsByFileId,
        settings,
        visibilitySettings
      );
      const newThumbCount = getThumbsCount(
        nextProps.file,
        nextProps.sheetsByFileId,
        nextProps.settings,
        nextProps.visibilitySettings
      );
      if (oldThumbCount !== newThumbCount) {
        loadSheetPropertiesIntoState(
          this,
          columnCount,
          newThumbCount,
          secondsPerRow,
        );
        log.debug(`visibleThumbCount changed to ${newThumbCount}`);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // log.debug('App.js componentDidUpdate');
    const { store } = this.context;
    const { filesToLoad, sheetsToPrint } = this.state;
    const { files, file, scenesByFileId, settings, sheetsByFileId, visibilitySettings } = this.props;
    const { defaultMoviePrintWidth, defaultPaperAspectRatioInv } = settings;
    const { visibilityFilter } = visibilitySettings;

    if ((filesToLoad.length !== 0) &&
    (prevState.filesToLoad.length !== filesToLoad.length)) {
      const timeBefore = Date.now();
      this.setState({
        timeBefore
      });
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-details', filesToLoad[0].id, filesToLoad[0].path, filesToLoad[0].posterFrameId);
    }

    // run if there was a change in the sheetsToPrint array
    if (sheetsToPrint.length !== 0 &&
      !isEquivalent(sheetsToPrint, prevState.sheetsToPrint)
    ) {

      const filesToUpdateStatus = [];
      // run if there is a sheet which needsThumbs, but not if there is one already gettingThumbs
      if ((sheetsToPrint.findIndex(item => item.status === 'gettingThumbs' ) === -1) &&
        (sheetsToPrint.findIndex(item => item.status === 'needsThumbs' ) > -1)) {
        // log.debug(sheetsToPrint);
        const sheetToGetThumbsFor = sheetsToPrint.find(item => item.status === 'needsThumbs' );
        // log.debug(sheetToGetThumbsFor);
        const tempFile = files.find(file1 => file1.id === sheetToGetThumbsFor.fileId);
        // log.debug(tempFile);

        // check if file could be found within files to cover the following case
        // files who could be added to the filelist, but then could not be read by opencv get removed again from the FileList
        if (tempFile !== undefined) {
          this.getThumbsForFile(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId);
          store.dispatch(updateSheetName(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, getRandomSheetName()));
          store.dispatch(updateSheetType(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, SHEET_TYPE.INTERVAL));
          filesToUpdateStatus.push({
            fileId: sheetToGetThumbsFor.fileId,
            sheetId: sheetToGetThumbsFor.sheetId,
            status: 'gettingThumbs'
          });
        } else {
          // status of file which could not be found gets set to undefined
          filesToUpdateStatus.push({
            fileId: sheetToGetThumbsFor.fileId,
            sheetId: sheetToGetThumbsFor.sheetId,
            status: 'undefined'
          });
        }
        // log.debug(filesToUpdateStatus);
      }

      // run if there is a file readyForPrinting, but not if there is one already printing
      if ((sheetsToPrint.findIndex(item => item.status === 'printing' ) === -1) &&
        (sheetsToPrint.findIndex(item => item.status === 'readyForPrinting' ) > -1)) {
        const timeBefore = Date.now();
        this.setState({
          timeBefore
        });
        // log.debug(sheetsToPrint);
        const sheetToPrint = sheetsToPrint.find(item => item.status === 'readyForPrinting' );

        // get sheet to print
        const sheet = sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId];

        // define what view to print depending on type
        let view = VIEW.GRIDVIEW;
        const sheetType = sheet.type;
        if (sheetType === SHEET_TYPE.SCENES) {
          view = VIEW.TIMELINEVIEW;
        } else {
          view = VIEW.GRIDVIEW;
        }

        // get file to print
        const tempFile = files.find(file2 => file2.id === sheetToPrint.fileId);

        // get scenes to print
        let tempScenes;
        if (view === VIEW.TIMELINEVIEW && scenesByFileId[sheetToPrint.fileId] !== undefined) {
          tempScenes = getVisibleThumbs(
            scenesByFileId[sheetToPrint.fileId].sceneArray,
            visibilitySettings.visibilityFilter
          );
        }

        const secondsPerRow = getSecondsPerRow(sheetsByFileId, sheetToPrint.fileId, sheetToPrint.sheetId, settings);

        const scaleValueObject = getScaleValueObject(
          tempFile,
          settings,
          visibilitySettings,
          getColumnCount(sheetsByFileId, sheetToPrint.fileId, sheetToPrint.sheetId, settings),
          file.thumbCount,
          defaultMoviePrintWidth,
          view === VIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
          1,
          undefined,
          true,
          tempScenes,
          secondsPerRow,
        );
        console.log(scaleValueObject);
        const dataToSend = {
          elementId: view !== VIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
          file: tempFile,
          sheetId: sheetToPrint.sheetId,
          moviePrintWidth: defaultMoviePrintWidth,
          settings,
          sheet,
          visibilityFilter,
          scaleValueObject,
          scenes: tempScenes,
          secondsPerRow,
        };

        filesToUpdateStatus.push({
          fileId: sheetToPrint.fileId,
          sheetId: sheetToPrint.sheetId,
          status: 'printing'
        });
        // console.log(filesToUpdateStatus);
        // console.log(dataToSend);
        ipcRenderer.send('message-from-mainWindow-to-workerWindow', 'action-save-MoviePrint', dataToSend);
      }

      // only update sheetsToPrint if there is any update
      if (filesToUpdateStatus.length !== 0) {
        const newSheetsToPrint = sheetsToPrint.map(el => {
          const found = filesToUpdateStatus.find(s => s.sheetId === el.sheetId);
          if (found) {
            return Object.assign(el, found);
          }
          return el;
        });
        this.setState({
          sheetsToPrint: newSheetsToPrint,
        });
      }
    }

    // updatecontainerWidthAndHeight checks if the containerWidth or height has changed
    // and if so calls updateScaleValue
    this.updatecontainerWidthAndHeight();

    // update scaleValue when these parameters change
    if (((prevProps.file === undefined || this.props.file === undefined) ?
      false : (prevProps.file.width !== this.props.file.width)) ||
      ((prevProps.file === undefined || this.props.file === undefined) ?
        false : (prevProps.file.height !== this.props.file.height)) ||
      prevProps.settings.defaultThumbnailScale !== this.props.settings.defaultThumbnailScale ||
      prevProps.settings.defaultMoviePrintWidth !== this.props.settings.defaultMoviePrintWidth ||
      prevProps.settings.defaultMarginRatio !== this.props.settings.defaultMarginRatio ||
      prevProps.settings.defaultTimelineViewSecondsPerRow !== this.props.settings.defaultTimelineViewSecondsPerRow ||
      prevProps.settings.defaultTimelineViewMinDisplaySceneLengthInFrames !== this.props.settings.defaultTimelineViewMinDisplaySceneLengthInFrames ||
      prevProps.settings.defaultTimelineViewWidthScale !== this.props.settings.defaultTimelineViewWidthScale ||
      (prevProps.scenes ? (prevProps.scenes.length !== this.props.scenes.length) : false) ||
      prevProps.settings.defaultShowHeader !== this.props.settings.defaultShowHeader ||
      prevProps.settings.defaultShowPathInHeader !== this.props.settings.defaultShowPathInHeader ||
      prevProps.settings.defaultShowDetailsInHeader !== this.props.settings.defaultShowDetailsInHeader ||
      prevProps.settings.defaultShowTimelineInHeader !== this.props.settings.defaultShowTimelineInHeader ||
      prevProps.settings.defaultRoundedCorners !== this.props.settings.defaultRoundedCorners ||
      prevProps.settings.defaultShowPaperPreview !== this.props.settings.defaultShowPaperPreview ||
      prevProps.settings.defaultPaperAspectRatioInv !== this.props.settings.defaultPaperAspectRatioInv ||
      prevState.zoom !== this.state.zoom ||
      prevProps.visibilitySettings.defaultView !==
        this.props.visibilitySettings.defaultView ||
      prevProps.visibilitySettings.defaultSheetFit !==
        this.props.visibilitySettings.defaultSheetFit ||
      prevState.secondsPerRowTemp !== this.state.secondsPerRowTemp ||
      prevState.columnCountTemp !== this.state.columnCountTemp ||
      prevState.thumbCountTemp !== this.state.thumbCountTemp ||
      prevState.columnCount !== this.state.columnCount ||
      prevState.thumbCount !== this.state.thumbCount
    ) {
      this.updateScaleValue();
    }

    if (prevState.showScrubWindow === false && this.state.showScrubWindow === true) {
      this.updateOpencvVideoCanvas(0);
    }
  }

  componentWillUnmount() {
    const { store } = this.context;

    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('keyup', this.handleKeyUp);

    window.removeEventListener('resize', this.updatecontainerWidthAndHeight);

    // close the database connection
    moviePrintDB.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Close the database connection.');
    });

  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    // only listen to key events when feedback form is not shown
    if (!this.state.showFeedbackForm && event.target.tagName !== 'INPUT') {
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
            const { file, currentFileId } = this.props;
            if (currentFileId) {
              this.runSceneDetection(file.id, file.path, file.useRatio, 20.0)
            }
            break;
          case 70: // press 'f'
            if (this.props.currentFileId) {
              this.onToggleDetectionChart();
            }
            break;
          case 80: // press 'p'
            this.onSaveMoviePrint();
            break;
          case 52: // press '4'
            store.dispatch(setView(VIEW.GRIDVIEW));
            break;
          case 53: // press '5'
            store.dispatch(setView(VIEW.PLAYERVIEW));
            break;
          case 54: // press '6'
            store.dispatch(setView(VIEW.TIMELINEVIEW));
            break;
          case 67: // press 'c' - Careful!!! might also be triggered when doing reset application Shift+Alt+Command+C
            // this.recaptureAllFrames();
            break;
          case 68: // press 'd'
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

  recaptureAllFrames() {
    const { files, settings, sheetsByFileId } = this.props;

    ipcRenderer.send(
      'message-from-mainWindow-to-opencvWorkerWindow',
      'recapture-all-frames',
      files,
      sheetsByFileId,
      settings.defaultCachedFramesSize
    );
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
    // when user presses alt key on drop then clear list and add movies
    const clearList = this.state.keyObject.altKey;
    this.setState({
      dropzoneActive: false,
      loadingFirstFile: true
    });
    const { store } = this.context;
    log.debug('Files where dropped');
    log.debug(files);
    // file match needs to be in sync with addMoviesToList() and accept !!!
    if (Array.from(files).some(file => (file.type.match('video.*') ||
      file.name.match(/.divx|.mkv|.ogg|.VOB/i)))) {
      store.dispatch(setView(VIEW.GRIDVIEW));
      store.dispatch(addMoviesToList(files, clearList)).then((response) => {
        this.setState({
          filesToLoad: response,
        });
        if (clearList) {
          this.setState({
            objectUrlsArray: [], // clear objectUrlsArray
          });
        }
        log.debug(response);
        // showMovielist if more than one movie
        if (response.length > 1 || (!clearList && this.props.files !== undefined && this.props.files.length > 0)) {
          store.dispatch(showMovielist());
        }
        return response;
      }).catch((error) => {
        log.error(error);
      });
    }
    return false;
  }

  // addToFramesToFetch(frameId, isPosterFrame = false) {
  //   this.setState(prevState => ({
  //     framesToFetch: [...prevState.framesToFetch, { frameId, isPosterFrame }]
  //   }));
  // }

  applyMimeTypes(event) {
    this.setState({
      accept: event.target.value
    });
  }

  updateScaleValue() {
    const { columnCountTemp, thumbCountTemp, containerWidth, containerHeight, zoom } = this.state;
    const { currentFileId, currentSheetId, file, scenes, settings, sheetsByFileId, visibilitySettings } = this.props;

    // log.debug(`inside updateScaleValue and containerWidth: ${this.state.containerWidth}`);
    const scaleValueObject = getScaleValueObject(
      file,
      settings,
      visibilitySettings,
      columnCountTemp,
      thumbCountTemp,
      containerWidth,
      containerHeight,
      zoom ? ZOOM_SCALE : 0.95,
      zoom ? false : settings.defaultShowPaperPreview,
      undefined,
      scenes,
      getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings),
    );
    this.setState(
      {
        scaleValueObject
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
      if ((Math.abs(this.state.containerHeight - containerHeightInner) > 10) ||
      (Math.abs(this.state.containerWidth - containerWidthInner) > 10)) {
        log.debug(`new container size: ${containerWidthInner}x${containerHeightInner}`);
        this.setState({
          containerHeight: containerHeightInner,
          containerWidth: containerWidthInner
        }, () => this.updateScaleValue());
      }
      return true;
    } catch (e) {
      log.error(e);
      return undefined;
    }
  }

  onSelectThumbMethod(thumbId, frameNumber) {
    this.setState({
      selectedThumbObject: {
        thumbId,
        frameNumber
      }
    });
  }

  onSelectSceneMethod(sceneId) {
    if (this.state.selectedSceneObject && this.state.selectedSceneObject.sceneId === sceneId) {
      this.setState({
        selectedSceneObject: undefined
      });
    } else {
      this.setState({
        selectedSceneObject: {
          sceneId,
        }
      });
    }
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
    const { currentFileId, currentSheetId, file, settings, sheetsByFileId, visibilitySettings } = this.props;
    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    store.dispatch(showSettings());

    loadSheetPropertiesIntoState(
      this,
      getColumnCount(
        sheetsByFileId,
        currentFileId,
        currentSheetId,
        settings
      ),
      getThumbsCount(
        file,
        sheetsByFileId,
        settings,
        visibilitySettings
      ),
      secondsPerRow,
    );
    this.switchToPrintView();
    this.disableZoom();
  }

  hideSettings() {
    const { store } = this.context;
    store.dispatch(hideSettings());
    this.onHideDetectionChart();
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
    if (this.props.visibilitySettings.defaultView === VIEW.PLAYERVIEW) {
      store.dispatch(setView(VIEW.GRIDVIEW));
    }
  }

  onHideDetectionChart() {
    this.setState({
      showChart: false
    });
  }

  onToggleDetectionChart() {
    this.setState({
      showChart: !this.state.showChart
    });
  }

  runSceneDetection(fileId, filePath, useRatio, threshold = this.props.settings.defaultSceneDetectionThreshold) {
    this.hideSettings();
    this.onHideDetectionChart();
    const { store } = this.context;
    store.dispatch(setView(VIEW.TIMELINEVIEW));
    // get meanArray if it is stored else return false
    const arrayOfFrameScanData = getFrameScanByFileId(fileId);
    // console.log(arrayOfFrameScanData);
    // if meanArray not stored, runFileScan
    if (arrayOfFrameScanData.length === 0) {
      this.runFileScan(fileId, filePath, useRatio, threshold);
    } else {
      const meanValueArray = arrayOfFrameScanData.map(frame => frame.meanValue)
      const meanColorArray = arrayOfFrameScanData.map(frame => JSON.parse(frame.meanColor))
      // console.log(meanColorArray);
      this.calculateSceneList(fileId, meanValueArray, meanColorArray, threshold);
    }
    return true;
  }

  calculateSceneList(fileId, meanArray, meanColorArray, threshold = this.props.settings.defaultSceneDetectionThreshold) {
    const { store } = this.context;
    let lastSceneCut = null;

    const differenceArray = [];
    meanArray.reduce((prev, curr) => {
        differenceArray.push(Math.abs(prev - curr));
        return curr;
    }, 0);

    store.dispatch(clearScenes(this.props.file.id));

    const sceneList = []
    differenceArray.map((value, index) => {
      // initialise first scene cut
      if (lastSceneCut === null) {
        lastSceneCut = index;
      }
      if (value >= threshold) {
        if ((index - lastSceneCut) >= SCENE_DETECTION_MIN_SCENE_LENGTH) {
          const length = index - lastSceneCut; // length
          const start = lastSceneCut; // start
          const colorArray = meanColorArray[lastSceneCut + Math.floor(length / 2)];
          // [frameMean.w, frameMean.x, frameMean.y], // color
          sceneList.push({
            fileId,
            start,
            length,
            colorArray,
          });
          // store.dispatch(addScene(
          //   fileId,
          //   start,
          //   length,
          //   colorArray,
          // ));
          lastSceneCut = index;
        }
      }
      // console.log(`${index} - ${lastSceneCut} = ${index - lastSceneCut} - ${value >= threshold}`);
      return true;
      }
    );
    // add last scene
    const length = meanArray.length - lastSceneCut; // meanArray.length should be frameCount
    sceneList.push({
      fileId,
      start: lastSceneCut, // start
      length,
      colorArray: [128, 128, 128],
      // [frameMean.w, frameMean.x, frameMean.y], // color
    });

    const labels = [...Array(differenceArray.length).keys()].map((x) => String(x));
    const newChartData = {
      labels,
      datasets: [{
        label: "Difference",
        backgroundColor: 'rgb(255, 80, 6)',
        pointRadius: 2,
        data: differenceArray,
      },{
        label: "Mean",
        backgroundColor: 'rgba(255, 80, 6, 0.2)',
        pointRadius: 0,
        data: meanArray,
      }]
    };
    this.setState({
      chartData: newChartData,
    });

    // console.log(sceneList);

    // check if scenes detected
    if (sceneList.length !== 0) {
      const tempFile = this.props.files.find((file) => file.id === fileId);
      const clearOldScenes = true;
      const newSheetId = uuidV4();
      store.dispatch(updateSheetType(tempFile.id, newSheetId, SHEET_TYPE.SCENES));
      store.dispatch(updateSheetName(tempFile.id, newSheetId, getRandomSheetName()));
      store.dispatch(setCurrentSheetId(newSheetId));
      store.dispatch(setView(VIEW.TIMELINEVIEW));
      store.dispatch(addScenes(tempFile, sceneList, clearOldScenes, this.props.settings.defaultCachedFramesSize, newSheetId));
    } else {
      this.setState({
        progressMessage: 'No scenes detected',
        showMessage: true,
      }, () => {
        setTimeout(() => {
          this.setState({
            showMessage: false
          });
        }, 3000);
      });
    }
  }

  runFileScan(fileId, filePath, useRatio, threshold) {
    if (this.state.fileScanRunning === false) {
      this.setState({ fileScanRunning: true });
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-scan', fileId, filePath, useRatio, threshold);
    }
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

  onEnterClick(file, sceneId) {
    const { store } = this.context;
    // console.log(file);
    // console.log(sceneId);
    const sceneArray = this.props.scenes;
    const sceneIndex = sceneArray.findIndex(item => item.sceneId === sceneId);
    const sheetName = sceneId;
    console.log(sheetName);
    if (this.props.sheetsArray.findIndex(item => item === sheetName) === -1) {
      // log.debug(`addIntervalSheet as no thumbs were found for: ${file.name}`);
      store.dispatch(addIntervalSheet(
          file,
          sheetName,
          DEFAULT_THUMB_COUNT, // use constant value instead of defaultThumbCount
          sceneArray[sceneIndex].start,
          sceneArray[sceneIndex].start + sceneArray[sceneIndex].length - 1,
          this.props.settings.defaultCachedFramesSize
        ));
    }
    store.dispatch(setCurrentSheetId(sheetName));
    store.dispatch(setView(VIEW.GRIDVIEW));
  }

  onAddThumbClick(file, existingThumb, insertWhere) {
    const { store } = this.context;
    // get thumb left and right of existingThumb
    const indexOfAllThumbs = this.props.allThumbs.findIndex((thumb) => thumb.thumbId === existingThumb.thumbId);
    const indexOfVisibleThumbs = this.props.thumbs.findIndex((thumb) => thumb.thumbId === existingThumb.thumbId);
    const existingThumbFrameNumber = existingThumb.frameNumber;
    const leftThumbFrameNumber = this.props.thumbs[Math.max(0, indexOfVisibleThumbs - 1)].frameNumber;
    const rightThumbFrameNumber = this.props.thumbs[Math.min(this.props.thumbs.length - 1, indexOfVisibleThumbs + 1)].frameNumber;
    const newFrameNumberAfter = limitFrameNumberWithinMovieRange(file, existingThumbFrameNumber + Math.round((rightThumbFrameNumber - existingThumbFrameNumber) / 2));
    const newFrameNumberBefore = limitFrameNumberWithinMovieRange(file, leftThumbFrameNumber + Math.round((existingThumbFrameNumber - leftThumbFrameNumber) / 2));

    const newThumbId = uuidV4();
    if (insertWhere === 'after') {
      store.dispatch(addThumb(
        this.props.file,
        this.props.settings.currentSheetId,
        newFrameNumberAfter,
        indexOfAllThumbs + 1,
        newThumbId,
        this.props.settings.defaultCachedFramesSize
      ));
    } else if (insertWhere === 'before') { // if shiftKey
      store.dispatch(addThumb(
        this.props.file,
        this.props.settings.currentSheetId,
        newFrameNumberBefore,
        indexOfAllThumbs,
        newThumbId,
        this.props.settings.defaultCachedFramesSize,
      ));
    }
  }

  onScrubWindowMouseOver(e) {
    if (e.clientY < (MENU_HEADER_HEIGHT + this.state.containerHeight)) {
      const scrubFrameNumber = getScrubFrameNumber(
        e.clientX,
        this.state.keyObject,
        this.state.scaleValueObject,
        this.props.file.frameCount,
        this.state.scrubThumb,
        this.state.scrubThumbLeft,
        this.state.scrubThumbRight,
      );
      this.updateOpencvVideoCanvas(scrubFrameNumber);
    } else {
      this.setState({
        showScrubWindow: false,
      });
    }
  }

  onScrubWindowClick(e) {
    const { store } = this.context;
    if (e.clientY < (MENU_HEADER_HEIGHT + this.state.containerHeight)) {

      const scrubFrameNumber = getScrubFrameNumber(
        e.clientX,
        this.state.keyObject,
        this.state.scaleValueObject,
        this.props.file.frameCount,
        this.state.scrubThumb,
        this.state.scrubThumbLeft,
        this.state.scrubThumbRight,
      );

      if (this.state.keyObject.altKey || this.state.keyObject.shiftKey) {
        const newThumbId = uuidV4();
        if (this.state.keyObject.altKey) {
          store.dispatch(addThumb(
            this.props.file,
            this.props.settings.currentSheetId,
            scrubFrameNumber,
            this.props.thumbs.find((thumb) => thumb.thumbId === this.state.scrubThumb.thumbId).index + 1,
            newThumbId,
            this.props.settings.defaultCachedFramesSize,
          ));
        } else { // if shiftKey
          store.dispatch(addThumb(
            this.props.file,
            this.props.settings.currentSheetId,
            scrubFrameNumber,
            this.props.thumbs.find((thumb) => thumb.thumbId === this.state.scrubThumb.thumbId).index,
            newThumbId,
            this.props.settings.defaultCachedFramesSize,
          ));
        }
      } else { // if normal set new thumb
        store.dispatch(changeThumb(this.props.settings.currentSheetId, this.props.file, this.state.scrubThumb.thumbId, scrubFrameNumber, this.props.settings.defaultCachedFramesSize));
      }
    }
    this.setState({
      showScrubWindow: false,
    });
  }

  onViewToggle() {
    const { store } = this.context;
    if (this.props.visibilitySettings.defaultView === VIEW.GRIDVIEW) {
      this.hideSettings();
      this.hideMovielist();
      store.dispatch(setView(VIEW.PLAYERVIEW));
    } else {
      store.dispatch(setView(VIEW.GRIDVIEW));
    }
  }

  onSaveMoviePrint() {
    const { file, settings, scenes, sheetsByFileId, visibilitySettings } = this.props;
    const { currentFileId, currentSheetId, defaultMoviePrintWidth, defaultPaperAspectRatioInv } = settings;
    const { defaultView, visibilityFilter } = visibilitySettings;

    const sheet = sheetsByFileId[file.id][currentSheetId];
    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    const scaleValueObject = getScaleValueObject(
      file,
      settings,
      visibilitySettings,
      getColumnCount(sheetsByFileId, file.id, currentSheetId, settings),
      file.thumbCount,
      defaultMoviePrintWidth,
      defaultView === VIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
      1,
      undefined,
      true,
      defaultView !== VIEW.TIMELINEVIEW ? undefined : scenes,
      secondsPerRow,
    );

    const dataToSend = {
      // scale: 1,
      elementId: defaultView !== VIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
      file,
      sheetId: currentSheetId,
      moviePrintWidth: defaultMoviePrintWidth,
      settings,
      sheet,
      visibilityFilter: visibilityFilter,
      scaleValueObject,
      scenes: defaultView !== VIEW.TIMELINEVIEW ? undefined : scenes,
      secondsPerRow,
    };
    // log.debug(dataToSend);
    this.setState(
      { savingMoviePrint: true },
      ipcRenderer.send('request-save-MoviePrint', dataToSend)
    );
  }

  onSaveAllMoviePrints() {
    log.debug('inside onSaveAllMoviePrints');
    const { files, sheetsByFileId } = this.props;
    const tempFileIds = files.map(file => file.id);
    const tempSheetObjects = [];
    files.map(file => {
      const fileId = file.id;
      const sheetIdArray = getSheetIdArray(sheetsByFileId, fileId);
      if (sheetIdArray !== undefined) {
        sheetIdArray.map(sheetId => {
          tempSheetObjects.push({
            fileId,
            sheetId,
          });
          return undefined;
        });
      } else {
        // if there are no sheets yet, add a new sheetId which
        tempSheetObjects.push({
          fileId,
          sheetId: uuidV4(),
        });
      }
      return undefined;
    });
    log.debug(tempFileIds);
    log.debug(tempSheetObjects);

    const sheetsToPrint = [];
    tempSheetObjects.forEach(sheet => {
      if (sheetsByFileId[sheet.fileId] === undefined ||
      sheetsByFileId[sheet.fileId][sheet.sheetId] === undefined ||
      sheetsByFileId[sheet.fileId][sheet.sheetId].thumbsArray === undefined) {
        // if no thumbs were found then initiate to getThumbsForFile
        sheetsToPrint.push({
          fileId: sheet.fileId,
          sheetId: sheet.sheetId,
          status: 'needsThumbs',
        });
      } else {
        // if thumbs were found then go directly to sheetsToPrint
        sheetsToPrint.push({
          fileId: sheet.fileId,
          sheetId: sheet.sheetId,
          status: 'readyForPrinting',
        });
      }
    })
    this.setState({
      sheetsToPrint,
      savingAllMoviePrints: true
    });
  }

  onFileListElementClick(fileId) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { store } = this.context;
    const { sheetsByFileId, settings } = this.props;

    store.dispatch(setCurrentFileId(fileId));

    let newSheetId = getSheetId(sheetsByFileId, fileId);

    // When clicking on a filelist element for the first time
    if (newSheetId === undefined) {
      // there are no sheetIds, so create a new sheetId
      newSheetId = uuidV4();
      // set columnCount as it is not defined yet
      this.getThumbsForFile(fileId, newSheetId);
      const newColumnCount = getColumnCount(sheetsByFileId, fileId, newSheetId, settings);
      store.dispatch(updateSheetColumnCount(fileId, newSheetId, newColumnCount));
      store.dispatch(updateSheetName(fileId, newSheetId, getRandomSheetName()));
      store.dispatch(updateSheetType(fileId, newSheetId, SHEET_TYPE.INTERVAL));
    }

    this.onSetSheetClick(fileId, newSheetId, SHEET_TYPE.INTERVAL);
  }

  onErrorPosterFrame(file) {
    const { store } = this.context;
    // store.dispatch(updateThumbObjectUrlFromDB(file.id, undefined, undefined, file.posterFrameId, true));
  }

  getThumbsForFile(fileId, newSheetId = uuidV4()) {
    log.debug(`inside getThumbsForFileId: ${fileId}`);
    const { store } = this.context;
    const { files, sheetsByFileId, settings } = this.props;
    const file = files.find(file2 =>file2.id === fileId);
    if (sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][newSheetId] === undefined ||
    sheetsByFileId[fileId][newSheetId].thumbsArray === undefined) {
      log.debug(`addIntervalSheet as no thumbs were found for: ${file.name}`);
      store.dispatch(addIntervalSheet(
          file,
          newSheetId,
          settings.defaultThumbCount,
          file.fadeInPoint,
          file.fadeOutPoint,
          settings.defaultCachedFramesSize,
        )).catch(error => {
          console.log(error)
        });
    }
  }

  openMoviesDialog() {
    log.debug('inside openMoviesDialog');
    console.log(this);
    console.log(this.dropzoneRef);
    this.dropzoneRef.current.open();
  }

  onOpenFeedbackForm() {
    log.debug('onOpenFeedbackForm');
    this.setState(
      { showFeedbackForm: true }
    )
  }

  onCloseFeedbackForm() {
    log.debug('onCloseFeedbackForm');
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
      store.dispatch(updateSheetColumnCount(
        this.props.file.id,
        this.props.currentSheetId,
        value,
      ));
      store.dispatch(setDefaultColumnCount(value));
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
      store.dispatch(updateSheetColumnCount(
        this.props.file.id,
        this.props.currentSheetId,
        value,
      ));
      store.dispatch(setDefaultColumnCount(value));
    }
    this.updateScaleValue();
  };

  onShowPaperPreviewClick = (checked) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowPaperPreview(checked));
  };

  onOutputPathFromMovieClick = (checked) => {
    const { store } = this.context;
    store.dispatch(setDefaultOutputPathFromMovie(checked));
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
    // log.debug(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    if (!checked) {
      this.setState({ thumbCountTemp: this.state.thumbCount });
    } else {
      const newThumbCount = this.state.columnCountTemp *
        Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
      this.setState({ thumbCountTemp: newThumbCount });
    }
    this.setState({ reCapture: checked });
  };

  onApplyNewGridClick = () => {
    const { store } = this.context;
    // log.debug(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    this.setState({ columnCount: this.state.columnCountTemp });
    if (this.state.reCapture) {
      this.setState({ thumbCount: this.state.thumbCountTemp });
      this.onThumbCountChange(this.state.columnCountTemp, this.state.thumbCountTemp);
    }
    if (this.props.file !== undefined) {
      store.dispatch(updateSheetColumnCount(
        this.props.file.id,
        this.props.currentSheetId,
        this.state.columnCountTemp,
      ));
    }
    // this.hideSettings();
  };

  onCancelClick = () => {
    // log.debug(this.state.columnCount);
    // log.debug(this.state.thumbCount);
    this.setState({ columnCountTemp: this.state.columnCount });
    this.setState({ thumbCountTemp: this.state.thumbCount });
    this.hideSettings();
  };

  onThumbCountChange = (columnCount, thumbCount) => {
    const { store } = this.context;
    store.dispatch(setDefaultColumnCount(columnCount));
    store.dispatch(setDefaultThumbCount(thumbCount));
    if (this.props.currentFileId !== undefined) {
      store.dispatch(addIntervalSheet(
        this.props.file,
        this.props.settings.currentSheetId,
        thumbCount,
        getLowestFrame(getVisibleThumbs(
          (this.props.sheetsByFileId[this.props.currentFileId] === undefined)
            ? undefined : this.props.sheetsByFileId[this.props.currentFileId][this.props.settings.currentSheetId].thumbsArray,
          this.props.visibilitySettings.visibilityFilter
        )),
        getHighestFrame(getVisibleThumbs(
          (this.props.sheetsByFileId[this.props.currentFileId] === undefined)
            ? undefined : this.props.sheetsByFileId[this.props.currentFileId][this.props.settings.currentSheetId].thumbsArray,
          this.props.visibilitySettings.visibilityFilter
        )),
        this.props.settings.defaultCachedFramesSize,
      ));
    }
  };

  onChangeMinDisplaySceneLength = (value) => {
    const { store } = this.context;
    store.dispatch(
      setDefaultTimelineViewMinDisplaySceneLengthInFrames(
        Math.round(
          value * this.props.file.fps
        )
      )
    );
  };

  onChangeMargin = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultMarginRatio(value /
        store.getState().undoGroup.present.settings.defaultMarginSliderFactor));
  };

  onChangeSceneDetectionThreshold = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultSceneDetectionThreshold(value));
  };

  onChangeTimelineViewSecondsPerRow = (value) => {
    const { store } = this.context;
    const { file, currentSheetId } = this.props;

    if (file !== undefined) {
      store.dispatch(updateSheetSecondsPerRow(
        file.id,
        currentSheetId,
        value,
      ));
    }
    store.dispatch(setDefaultTimelineViewSecondsPerRow(value));
  };

  onChangeTimelineViewWidthScale = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultTimelineViewWidthScale(value));
  };

  onTimelineViewFlowClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultTimelineViewFlow(value));
  };

  onShowHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowHeader(value));
  };

  onShowPathInHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowPathInHeader(value));
  };

  onShowDetailsInHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowDetailsInHeader(value));
  };

  onShowTimelineInHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowTimelineInHeader(value));
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

  onSetSheetFitClick = (value) => {
    const { store } = this.context;
    store.dispatch(setSheetFit(value));
    // disable zoom
    this.disableZoom();
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

  onRemoveMovieListItem = (fileId) => {
    const { store } = this.context;
    store.dispatch(removeMovieListItem(fileId));
    // store.dispatch(setCurrentSheetId(newSheetId));
  };

  onDuplicateSheetClick = (fileId, sheet) => {
    const { store } = this.context;
    const newSheetId = uuidV4();
    store.dispatch(duplicateSheet(fileId, sheet, newSheetId));
    store.dispatch(updateSheetName(fileId, newSheetId, getRandomSheetName())); // set name on firstFile
    store.dispatch(setCurrentSheetId(newSheetId));
  };

  onDeleteSheetClick = (fileId, sheet) => {
    const { store } = this.context;
    const { sheetsByFileId } = this.props;
    store.dispatch(deleteSheets(fileId, sheet));
    const newSheetId = getSheetId(sheetsByFileId, fileId);
    store.dispatch(setCurrentSheetId(newSheetId));
  };

  onSetSheetClick = (fileId, sheetId, type) => {
    const { store } = this.context;
    const { currentFileId } = this.props;
    if (fileId !== currentFileId) {
      store.dispatch(setCurrentFileId(fileId));
    }
    store.dispatch(setCurrentSheetId(sheetId));
    if (type === SHEET_TYPE.SCENES) {
      store.dispatch(setView(VIEW.TIMELINEVIEW));
      this.onReCaptureClick(false);
    } else {
      store.dispatch(setView(VIEW.GRIDVIEW));
    }
  };

  onChangeSheetTypeClick = (fileId, sheetId, type) => {
    const { store } = this.context;
    store.dispatch(updateSheetType(fileId, sheetId, type));
    if (type === SHEET_TYPE.SCENES) {
      store.dispatch(setView(VIEW.TIMELINEVIEW));
      this.onReCaptureClick(false);
    } else {
      store.dispatch(setView(VIEW.GRIDVIEW));
    }
  };

  onSetViewClick = (value) => {
    const { store } = this.context;
    store.dispatch(setView(value));
  };

  onChangeOutputPathClick = () => {
    const { store } = this.context;
    const newPathArray = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    const newPath = (newPathArray !== undefined ? newPathArray[0] : undefined);
    if (newPath) {
      // log.debug(newPath);
      store.dispatch(setDefaultOutputPath(newPath));
    }
  };

  onOutputFormatClick = (value) => {
    const { store } = this.context;
    // log.debug(value);
    store.dispatch(setDefaultOutputFormat(value));
  };

  onCachedFramesSizeClick = (value) => {
    const { store } = this.context;
    // log.debug(value);
    store.dispatch(setDefaultCachedFramesSize(value));
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
      const img = frame.resizeToMax(
        this.state.scaleValueObject.aspectRatioInv < 1 ?
        parseInt(this.state.scaleValueObject.scrubMovieWidth, 10) :
        parseInt(this.state.scaleValueObject.scrubMovieHeight, 10)
      );
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
    const { objectUrlsArray } = this.state;
    const { currentFileId, currentSheetId, allThumbs, files, sheetsByFileId, settings, visibilitySettings } = this.props;

    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);
    const sheetType = getSheetType(sheetsByFileId, currentFileId, currentSheetId, settings);

    let isGridView = true;
    if (sheetType === SHEET_TYPE.SCENES) {
      isGridView = false;
    }

    // get objectUrls by reading all thumbs and get the corresponding objectUrls from the objectUrlsArray
    const arrayOfObjectUrlsOfAllThumbs = [];
    if (allThumbs !== undefined && objectUrlsArray.length !== 0) {
      allThumbs.map(thumb => {
        if (objectUrlsArray.find(item => thumb.frameId === item.frameId)) {
          arrayOfObjectUrlsOfAllThumbs.push({
            frameId: thumb.frameId,
            objectUrl: objectUrlsArray.find(item => thumb.frameId === item.frameId).objectUrl,
          });
        }
        return undefined;
      });
      // console.log(arrayOfObjectUrlsOfAllThumbs);
    }
    const objectUrlObjects = arrayToObject(arrayOfObjectUrlsOfAllThumbs, 'frameId');

    // get objectUrls by reading all files and get the corresponding objectUrls from the objectUrlsArray
    const arrayOfObjectUrlsOfAllPosterFrames = [];
    if (files !== undefined && objectUrlsArray.length !== 0) {
      files.map(file => {
        if (objectUrlsArray.find(item => file.posterFrameId === item.frameId)) {
          arrayOfObjectUrlsOfAllPosterFrames.push({
            frameId: file.posterFrameId,
            objectUrl: objectUrlsArray.find(item => file.posterFrameId === item.frameId).objectUrl,
          });
        }
        return undefined;
      });
      // console.log(arrayOfObjectUrlsOfAllPosterFrames);
    }
    const posterObjectUrlObjects = arrayToObject(arrayOfObjectUrlsOfAllPosterFrames, 'frameId');

    // const chartHeight = this.state.containerHeight / 4;
    const chartHeight = 250;

    // only for savingAllMoviePrints
    // get name of file currently printing
    let fileToPrint;
    if (this.state.savingAllMoviePrints) {
      fileToPrint = getObjectProperty(
        () => this.props.files.find(
          file => file.id === getObjectProperty(
            () => this.state.sheetsToPrint.find(
              item => item.status === 'printing'
            ).fileId
          )
        ).name
      );
    }

    return (
      <ErrorBoundary>
        <Dropzone
          ref={this.dropzoneRef}
          // ref={(el) => { this.dropzoneRef = el; }}
          disableClick
          // disablePreview
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
                  <HeaderComponent
                    visibilitySettings={this.props.visibilitySettings}
                    settings={this.props.settings}
                    file={this.props.file}
                    sheetsArray={this.props.sheetsArray}
                    sceneArray={this.props.scenes}
                    toggleMovielist={this.toggleMovielist}
                    toggleSettings={this.toggleSettings}
                    toggleZoom={this.toggleZoom}
                    toggleView={this.onViewToggle}
                    onToggleShowHiddenThumbsClick={this.onToggleShowHiddenThumbsClick}
                    onThumbInfoClick={this.onThumbInfoClick}
                    onSetViewClick={this.onSetViewClick}
                    onSetSheetFitClick={this.onSetSheetFitClick}
                    openMoviesDialog={this.openMoviesDialog}
                    zoom={this.state.zoom}
                    scaleValueObject={this.state.scaleValueObject}
                    isGridView
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
                      height: `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)`,
                    }}
                  >
                    <div
                      className={`${styles.ItemSideBar} ${styles.ItemMovielist} ${this.props.visibilitySettings.showMovielist ? styles.ItemMovielistAnim : ''}`}
                    >
                      <FileList
                        files={this.props.files}
                        settings={this.props.settings}
                        visibilitySettings={this.props.visibilitySettings}
                        onFileListElementClick={this.onFileListElementClick}
                        posterObjectUrlObjects={posterObjectUrlObjects}
                        sheetsByFileId={this.props.sheetsByFileId}
                        onChangeSheetTypeClick={this.onChangeSheetTypeClick}
                        onSetSheetClick={this.onSetSheetClick}
                        onDuplicateSheetClick={this.onDuplicateSheetClick}
                        onRemoveMovieListItem={this.onRemoveMovieListItem}
                        onDeleteSheetClick={this.onDeleteSheetClick}
                        currentSheetId={this.props.currentSheetId}
                      />
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
                        onOutputPathFromMovieClick={this.onOutputPathFromMovieClick}
                        onPaperAspectRatioClick={this.onPaperAspectRatioClick}
                        onDetectInOutPointClick={this.onDetectInOutPointClick}
                        onReCaptureClick={this.onReCaptureClick}
                        onApplyNewGridClick={this.onApplyNewGridClick}
                        onCancelClick={this.onCancelClick}
                        onChangeMargin={this.onChangeMargin}
                        onChangeMinDisplaySceneLength={this.onChangeMinDisplaySceneLength}
                        sceneArray={this.props.scenes}
                        secondsPerRowTemp={secondsPerRow}
                        // secondsPerRowTemp={this.state.secondsPerRowTemp}
                        onChangeSceneDetectionThreshold={this.onChangeSceneDetectionThreshold}
                        onChangeTimelineViewSecondsPerRow={this.onChangeTimelineViewSecondsPerRow}
                        onChangeTimelineViewWidthScale={this.onChangeTimelineViewWidthScale}
                        onTimelineViewFlowClick={this.onTimelineViewFlowClick}
                        onShowHeaderClick={this.onShowHeaderClick}
                        onShowPathInHeaderClick={this.onShowPathInHeaderClick}
                        onShowDetailsInHeaderClick={this.onShowDetailsInHeaderClick}
                        onShowTimelineInHeaderClick={this.onShowTimelineInHeaderClick}
                        onRoundedCornersClick={this.onRoundedCornersClick}
                        onShowHiddenThumbsClick={this.onShowHiddenThumbsClick}
                        onThumbInfoClick={this.onThumbInfoClick}
                        onChangeOutputPathClick={this.onChangeOutputPathClick}
                        onOutputFormatClick={this.onOutputFormatClick}
                        onCachedFramesSizeClick={this.onCachedFramesSizeClick}
                        onOverwriteClick={this.onOverwriteClick}
                        onIncludeIndividualClick={this.onIncludeIndividualClick}
                        onThumbnailScaleClick={this.onThumbnailScaleClick}
                        onMoviePrintWidthClick={this.onMoviePrintWidthClick}
                        scaleValueObject={this.state.scaleValueObject}
                        runSceneDetection={this.runSceneDetection}
                        fileScanRunning={this.state.fileScanRunning}
                        showChart={this.state.showChart}
                        onToggleDetectionChart={this.onToggleDetectionChart}
                        recaptureAllFrames={this.recaptureAllFrames}
                        isGridView={isGridView}
                      />
                    </div>
                    <div
                      className={`${styles.ItemVideoPlayer} ${this.props.visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''}`}
                      style={{
                        top: `${MENU_HEADER_HEIGHT + this.props.settings.defaultBorderMargin}px`,
                        transform: this.props.visibilitySettings.defaultView === VIEW.PLAYERVIEW ? 'translate(-50%, 0px)' : `translate(-50%, ${(this.state.scaleValueObject.videoPlayerHeight + this.props.settings.defaultVideoPlayerControllerHeight) * -1}px)`,
                        overflow: this.props.visibilitySettings.defaultView === VIEW.PLAYERVIEW ? 'visible' : 'hidden'
                      }}
                    >
                      { this.props.file ? (
                        <VideoPlayer
                          // visible={this.props.visibilitySettings.defaultView === VIEW.PLAYERVIEW}
                          ref={(el) => { this.videoPlayer = el; }}
                          file={this.props.file}
                          aspectRatioInv={this.state.scaleValueObject.aspectRatioInv}
                          height={this.state.scaleValueObject.videoPlayerHeight}
                          width={this.state.scaleValueObject.videoPlayerWidth}
                          objectUrlObjects={objectUrlObjects}
                          controllerHeight={this.props.settings.defaultVideoPlayerControllerHeight}
                          selectedThumbId={this.state.selectedThumbObject ?
                            this.state.selectedThumbObject.thumbId : undefined}
                          frameNumber={this.state.selectedThumbObject ?
                            this.state.selectedThumbObject.frameNumber : 0}
                          onThumbDoubleClick={this.onViewToggle}
                          selectThumbMethod={this.onSelectThumbMethod}
                          keyObject={this.state.keyObject}
                          opencvVideo={this.state.opencvVideo}
                          frameSize={this.props.settings.defaultCachedFramesSize}
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
                      className={`${styles.ItemMain} ${this.props.visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainRightAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainEdit : ''} ${this.props.visibilitySettings.defaultView === VIEW.PLAYERVIEW ? styles.ItemMainTopAnim : ''}`}
                      style={{
                        width: ( // use window with if any of these are true
                          this.props.visibilitySettings.showSettings ||
                          (this.props.visibilitySettings.defaultView !== VIEW.PLAYERVIEW &&
                            this.props.visibilitySettings.defaultSheetFit !== SHEET_FIT.HEIGHT &&
                            !this.state.zoom
                          ) ||
                          this.state.scaleValueObject.newMoviePrintWidth < this.state.containerWidth // if smaller, width has to be undefined otherwise the center align does not work
                        )
                          ? undefined : this.state.scaleValueObject.newMoviePrintWidth,
                        marginTop: this.props.visibilitySettings.defaultView !== VIEW.PLAYERVIEW ? undefined :
                          `${this.state.scaleValueObject.videoPlayerHeight +
                            (this.props.settings.defaultBorderMargin * 2)}px`,
                        minHeight: this.props.visibilitySettings.defaultView !== VIEW.PLAYERVIEW ? `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)` : undefined,
                        // backgroundImage: `url(${paperBorderPortrait})`,
                        backgroundImage: ((this.props.visibilitySettings.showSettings && this.props.settings.defaultShowPaperPreview) ||
                          (this.props.file && this.props.visibilitySettings.defaultView !== VIEW.PLAYERVIEW && this.props.settings.defaultShowPaperPreview)) ?
                          `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${(this.props.settings.defaultPaperAspectRatioInv < this.state.scaleValueObject.moviePrintAspectRatioInv) ? (this.state.scaleValueObject.newMoviePrintHeight / this.props.settings.defaultPaperAspectRatioInv) : this.state.scaleValueObject.newMoviePrintWidth}' height='${(this.props.settings.defaultPaperAspectRatioInv < this.state.scaleValueObject.moviePrintAspectRatioInv) ? this.state.scaleValueObject.newMoviePrintHeight : (this.state.scaleValueObject.newMoviePrintWidth * this.props.settings.defaultPaperAspectRatioInv)}' style='background-color: rgba(245,245,245,${this.props.visibilitySettings.showSettings ? 1 : 0.02});'></svg>")` : undefined,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: `calc(50% - ${DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN / 2}px) 50%`,
                      }}
                    >
                      { (this.props.file || this.props.visibilitySettings.showSettings || this.state.loadingFirstFile) ? (
                        // (this.props.visibilitySettings.defaultView === 'gridView') ? (
                        <Fragment>
                          <Conditional if={this.props.visibilitySettings.defaultView !== VIEW.TIMELINEVIEW}>
                            <SortedVisibleThumbGrid
                              colorArray={this.state.colorArray}
                              view={this.props.visibilitySettings.defaultView}
                              currentSheetId={this.props.settings.currentSheetId}
                              file={this.props.file}
                              inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                              keyObject={this.state.keyObject}
                              onAddThumbClick={this.onAddThumbClick}
                              onScrubClick={this.onScrubClick}
                              onThumbDoubleClick={this.onViewToggle}
                              scaleValueObject={this.state.scaleValueObject}
                              moviePrintWidth={this.state.scaleValueObject.newMoviePrintWidth}
                              selectedThumbId={this.state.selectedThumbObject ? this.state.selectedThumbObject.thumbId : undefined}
                              selectThumbMethod={this.onSelectThumbMethod}
                              settings={this.props.settings}
                              showSettings={this.props.visibilitySettings.showSettings}
                              thumbCount={this.state.thumbCountTemp}
                              objectUrlObjects={objectUrlObjects}
                              thumbs={this.props.thumbs}
                              viewForPrinting={false}
                              frameSize={this.props.settings.defaultCachedFramesSize}
                              isGridView={isGridView}
                            />
                          </Conditional>
                          <Conditional if={this.props.visibilitySettings.defaultView === VIEW.TIMELINEVIEW}>
                            <SortedVisibleSceneGrid
                              view={this.props.visibilitySettings.defaultView}
                              file={this.props.file}
                              frameCount={this.props.file ? this.props.file.frameCount : undefined}
                              inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                              keyObject={this.state.keyObject}
                              selectedSceneId={this.state.selectedSceneObject ? this.state.selectedSceneObject.sceneId : undefined}
                              selectSceneMethod={this.onSelectSceneMethod}
                              onEnterClick={this.onEnterClick}
                              moviePrintWidth={this.state.scaleValueObject.newMoviePrintTimelineWidth}
                              moviePrintRowHeight={this.state.scaleValueObject.newTimelineRowHeight}
                              scaleValueObject={this.state.scaleValueObject}
                              scenes={this.props.scenes}
                              settings={this.props.settings}
                              showSettings={this.props.visibilitySettings.showSettings}
                              objectUrlObjects={objectUrlObjects}
                              thumbs={this.props.thumbs}
                              currentSheetId={this.props.settings.currentSheetId}
                            />
                          </Conditional>
                          {false && <div
                            style={{
                              // background: 'green',
                              pointerEvents: 'none',
                              border: '5px solid green',
                              width: this.state.scaleValueObject.newMoviePrintTimelineWidth,
                              height: this.state.scaleValueObject.newMoviePrintTimelineHeight,
                              position: 'absolute',
                              left: this.props.visibilitySettings.showSettings ? '' : '50%',
                              top: '50%',
                              marginLeft: this.props.visibilitySettings.showSettings ? '' : this.state.scaleValueObject.newMoviePrintTimelineWidth/-2,
                              marginTop: this.state.scaleValueObject.newMoviePrintTimelineHeight/-2,
                            }}
                          />}
                        </Fragment>
                      ) :
                      (
                        <div
                          className={styles.ItemMainStartupContainer}
                        >
                          <img
                            data-tid='startupImg'
                            src={startupImg}
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
                          // log.debug(event);
                          log.debug(event.channel);
                          if (event.channel === 'wpcf7mailsent') {
                            const rememberEmail = event.args[0].findIndex((argument) => argument.name === 'checkbox-remember-email[]') >= 0;
                            if (rememberEmail) {
                              const emailAddressFromForm = event.args[0].find((argument) => argument.name === 'your-email').value;
                              store.dispatch(setEmailAddress(emailAddressFromForm));
                            }
                            this.onCloseFeedbackForm();
                          }
                        })
                        // log.debug(this.webviewRef.current.getWebContents());
                        // this.webviewRef.current.addEventListener('dom-ready', () => {
                        //   this.webviewRef.current.openDevTools();
                        // })
                        // this.webviewRef.current.addEventListener('did-stop-loading', (event) => {
                        //   log.debug(event);
                        // });
                        // this.webviewRef.current.addEventListener('did-start-loading', (event) => {
                        //   log.debug(event);
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
                        src={`http://movieprint.fakob.com/feedback-for-movieprint-app?app-version=${process.platform}-${os.release()}-${app.getName()}-${app.getVersion()}&your-email=${this.props.settings.emailAddress}`}
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
                    onSaveAllMoviePrints={this.onSaveAllMoviePrints}
                    savingMoviePrint={this.state.savingMoviePrint}
                    savingAllMoviePrints={this.state.savingAllMoviePrints}
                    defaultView={this.props.visibilitySettings.defaultView}
                  />
                </div>
                { this.state.showScrubWindow &&
                  <Scrub
                    opencvVideoCanvasRef={this.opencvVideoCanvasRef}
                    file={this.props.file}
                    settings={this.props.settings}
                    objectUrlObjects={objectUrlObjects}
                    keyObject={this.state.keyObject}
                    scrubThumb={this.state.scrubThumb}
                    scrubThumbLeft={this.state.scrubThumbLeft}
                    scrubThumbRight={this.state.scrubThumbRight}
                    scaleValueObject={this.state.scaleValueObject}
                    containerWidth={this.state.containerWidth}
                    containerHeight={this.state.containerHeight}
                    onScrubWindowMouseOver={this.onScrubWindowMouseOver}
                    onScrubWindowClick={this.onScrubWindowClick}
                  />
                }
                { this.state.showChart &&
                  <div
                    className={styles.chart}
                    style={{
                      height: `${chartHeight}px`,
                    }}
                  >
                    <Line
                      data={this.state.chartData}
                      // width={this.state.scaleValueObject.newMoviePrintWidth}
                      // width={this.state.containerWidth}
                      height={chartHeight}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        barPercentage: 1.0,
                        categoryPercentage: 1.0,
                        elements: {
                          line: {
                            tension: 0, // disables bezier curves
                          }
                        },
                        animation: {
                          duration: 0, // general animation time
                        },
                        hover: {
                          animationDuration: 0, // duration of animations when hovering an item
                        },
                        responsiveAnimationDuration: 0, // animation duration after a resize
                      }}
                    />
                  </div>
                }
                <Modal
                  open={this.state.savingAllMoviePrints}
                  basic
                  size='tiny'
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    margin: 'auto !important'
                  }}
                >
                  <Container
                    textAlign='center'
                  >
                    <Header as='h2' inverted>
                      {`Saving ${this.state.sheetsToPrint.filter(item => item.status === 'done').length + 1} of ${this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length} MoviePrints`}
                    </Header>
                    {!fileToPrint && <Loader
                      active
                      size='mini'
                      inline
                    />}
                    {fileToPrint || ' '}
                    <Progress
                      percent={
                        ((this.state.sheetsToPrint.filter(item => item.status === 'done').length + 1.0) /
                        this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length) * 100
                      }
                      size='tiny'
                      indicating
                      inverted
                    />
                    <Divider hidden />
                    <Button
                      color='red'
                      onClick={() => this.setState({ savingAllMoviePrints: false})}
                    >
                      <Icon name='remove' /> Cancel
                    </Button>
                  </Container>
                </Modal>
                { dropzoneActive &&
                  <div
                    className={`${styles.dropzoneshow} ${isDragAccept ? styles.dropzoneshowAccept : ''} ${isDragReject ? styles.dropzoneshowReject : ''}`}
                  >
                    <div
                      className={styles.dropzoneshowContent}
                    >
                      {`${isDragAccept ? (this.state.keyObject.altKey ? 'CLEAR LIST AND ADD MOVIES' : 'ADD MOVIES TO LIST') : ''} ${isDragReject ? 'NOT ALLOWED' : ''}`}
                      <div
                        className={styles.dropZoneSubline}
                      >
                        {`${isDragAccept ? (this.state.keyObject.altKey ? '' : 'PRESS ALT TO CLEAR LIST AND ADD MOVIES') : ''}`}
                      </div>
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
  const { visibilitySettings } = state;
  const { settings, sheetsByFileId, scenesByFileId, files } = state.undoGroup.present;
  const { currentFileId, currentSheetId } = settings;
  const sheetsArray = (sheetsByFileId[currentFileId] === undefined)
    ? [] : Object.getOwnPropertyNames(sheetsByFileId[currentFileId]);
  const allThumbs = (sheetsByFileId[currentFileId] === undefined ||
    sheetsByFileId[currentFileId][settings.currentSheetId] === undefined)
    ? undefined : sheetsByFileId[currentFileId][settings.currentSheetId].thumbsArray;
  const allScenes = (scenesByFileId[currentFileId] === undefined)
    ? [] : scenesByFileId[currentFileId].sceneArray;
  return {
    sheetsArray,
    sheetsByFileId,
    thumbs: getVisibleThumbs(
      allThumbs,
      visibilitySettings.visibilityFilter
    ),
    allThumbs,
    currentFileId,
    currentSheetId,
    files,
    file: files
      .find((file) => file.id === currentFileId),
    scenesByFileId,
    scenes: getVisibleThumbs(
      allScenes,
      visibilitySettings.visibilityFilter
    ),
    settings,
    visibilitySettings,
    defaultThumbCount: settings.defaultThumbCount,
    defaultColumnCount: settings.defaultColumnCount,
  };
};

App.contextTypes = {
  store: PropTypes.object
};

App.defaultProps = {
  currentFileId: undefined,
  currentSheetId: undefined,
  file: undefined,
  thumbs: [],
  sheetsByFileId: {},
  scenes: [],
};

App.propTypes = {
  currentFileId: PropTypes.string,
  currentSheetId: PropTypes.string,
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
  sheetsByFileId: PropTypes.object,
  scenes: PropTypes.array,
  visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(App);
