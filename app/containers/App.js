import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import fs from 'fs';
import { TransitionablePortal, Segment, Progress, Modal, Button, Icon, Container, Loader, Header, Divider, Form, Input } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import {Line, defaults} from 'react-chartjs-2';
import path from 'path';
import throttle from 'lodash/throttle';
import log from 'electron-log';
import os from 'os';
import Database from 'better-sqlite3';
import extract from 'png-chunks-extract';
import text from 'png-chunk-text';

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
import ScrubCut from '../components/ScrubCut';
import ThumbEmpty from '../components/ThumbEmpty';
import getScaleValueObject from '../utils/getScaleValueObject';
import { getLowestFrame,
  createSceneArray,
  getHighestFrame,
  getVisibleThumbs,
  getColumnCount,
  getFileStatsObject,
  getSecondsPerRow,
  getSheetCount,
  getNewSheetName,
  getSheetId,
  getSheetIdArray,
  getSheetType,
  getSheetView,
  getThumbsCount,
  getMoviePrintColor,
  getObjectProperty,
  setPosition,
  getScrubFrameNumber,
  isEquivalent,
  limitFrameNumberWithinMovieRange,
  getFramenumbersOfSheet,
  getFilePath,
  getFileTransformObject,
  getFileName,
  getSheetName,
} from '../utils/utils';
import styles from './App.css';
import stylesPop from './../components/Popup.css';
import {
  addIntervalSheet,
  addScene,
  addScenes,
  addThumb,
  changeThumb,
  clearMovieList,
  clearScenes,
  deleteSheets,
  addNewThumbsWithOrder,
  duplicateSheet,
  updateSceneArray,
  updateSheetType,
  updateSheetView,
  updateCropping,
  hideMovielist,
  hideSettings,
  removeMovieListItem,
  replaceFileDetails,
  setCurrentFileId,
  setCropping,
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
  setDefaultEmbedFrameNumbers,
  setDefaultEmbedFilePath,
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
  setDefaultSheetView,
  setView,
  setVisibilityFilter,
  showMovielist,
  showSettings,
  updateSheetSecondsPerRow,
  updateSheetColumnCount,
  updateSheetName,
  updateSheetCounter,
  updateFileDetails,
  updateFileDetailUseRatio,
  updateFrameNumber,
  updateInOutPoint,
  updateFileScanStatus,
} from '../actions';
import {
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  ZOOM_SCALE,
  SCENE_DETECTION_MIN_SCENE_LENGTH,
  DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN,
  VIEW,
  SHEETVIEW,
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
  deleteTableReduxState,
  deleteFileIdFromFrameScanList,
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
      // file match needs to be in sync with addMoviesToList(), onReplaceMovieListItemClick() and onDrop() !!!
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
      showScrubCutWindow: false,
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
      showTransformModal: false,
      transformObject: {},
      objectUrlObjects: {},
      framesToFetch: [],
      fileIdToBeRecaptured: undefined,
      fileIdToBeCaptured: undefined,
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
    this.onExpandClick = this.onExpandClick.bind(this);
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
    this.showMessage = this.showMessage.bind(this);

    this.onFileListElementClick = this.onFileListElementClick.bind(this);
    this.onAddIntervalSheet = this.onAddIntervalSheet.bind(this);
    this.onAddIntervalSheetClick = this.onAddIntervalSheetClick.bind(this);
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
    this.onImportMoviePrint = this.onImportMoviePrint.bind(this);
    this.onClearMovieList = this.onClearMovieList.bind(this);
    this.onChangeSheetViewClick = this.onChangeSheetViewClick.bind(this);
    this.onSetSheetClick = this.onSetSheetClick.bind(this);
    this.onDuplicateSheetClick = this.onDuplicateSheetClick.bind(this);
    this.onExportSheetClick = this.onExportSheetClick.bind(this);
    this.onScanMovieListItemClick = this.onScanMovieListItemClick.bind(this);
    this.onReplaceMovieListItemClick = this.onReplaceMovieListItemClick.bind(this);
    this.onEditTransformListItemClick = this.onEditTransformListItemClick.bind(this);
    this.onChangeTransform = this.onChangeTransform.bind(this);
    this.onRemoveMovieListItem = this.onRemoveMovieListItem.bind(this);
    this.onDeleteSheetClick = this.onDeleteSheetClick.bind(this);
    this.onChangeOutputPathClick = this.onChangeOutputPathClick.bind(this);
    this.onOutputFormatClick = this.onOutputFormatClick.bind(this);
    this.onCachedFramesSizeClick = this.onCachedFramesSizeClick.bind(this);
    this.onOverwriteClick = this.onOverwriteClick.bind(this);
    this.onIncludeIndividualClick = this.onIncludeIndividualClick.bind(this);
    this.onEmbedFrameNumbersClick = this.onEmbedFrameNumbersClick.bind(this);
    this.onEmbedFilePathClick = this.onEmbedFilePathClick.bind(this);
    this.onThumbnailScaleClick = this.onThumbnailScaleClick.bind(this);
    this.onMoviePrintWidthClick = this.onMoviePrintWidthClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
    this.runSceneDetection = this.runSceneDetection.bind(this);
    this.runFileScan = this.runFileScan.bind(this);
    this.calculateSceneList = this.calculateSceneList.bind(this);
    this.onToggleDetectionChart = this.onToggleDetectionChart.bind(this);
    this.onHideDetectionChart = this.onHideDetectionChart.bind(this);

    // this.addToFramesToFetch = this.addToFramesToFetch.bind(this);

    // moving ipcRenderer into constructor so it gets executed even when
    // the component can not mount and the ErrorBoundary kicks in
    ipcRenderer.on('delete-all-tables', (event) => {
      log.debug('delete-all-tables');
      deleteTableFrameScanList();
      deleteTableReduxState();
      deleteTableFramelist();
    });
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
      try {
        this.setState({
          opencvVideo: new opencv.VideoCapture(file.path),
        });
      } catch (e) {
        log.error(e);
      }
    }
  }

  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('progress', (event, fileId, progressBarPercentage) => {
      this.setState({
        progressBarPercentage: Math.ceil(progressBarPercentage)
      });
    });

    ipcRenderer.on('progressMessage', (event, status, message, time) => {
      this.showMessage(message, time);
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

    ipcRenderer.on('receive-get-file-details', (event, fileId, filePath, posterFrameId, frameCount, width, height, fps, fourCC, onlyReplace = false, onlyImport = false) => {
      store.dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-poster-frame', fileId, filePath, posterFrameId, onlyReplace, onlyImport);
    });

    // poster frames don't have thumbId
    ipcRenderer.on('receive-get-poster-frame', (event, fileId, filePath, posterFrameId, frameNumber, useRatio, onlyReplace = false, onlyImport = false) => {
      store.dispatch(updateFileDetailUseRatio(fileId, useRatio));

      // get all posterframes
      if (!onlyReplace || !onlyImport) {
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-in-and-outpoint', fileId, filePath, useRatio, store.getState().undoGroup.present.settings.defaultDetectInOutPoint);
      }
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
        store.dispatch(updateSheetName(firstFile.id, newSheetId, getNewSheetName())); // set name on firstFile
        store.dispatch(updateSheetCounter(firstFile.id));
        store.dispatch(updateSheetType(firstFile.id, newSheetId, SHEET_TYPE.INTERVAL));
        store.dispatch(updateSheetView(firstFile.id, newSheetId, SHEETVIEW.GRIDVIEW));
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
      const { objectUrlObjects } = this.state;

      // create copy so the state does not get mutated
      const copyOfObject = Object.assign({}, objectUrlObjects);

      // Update object's name property.
      copyOfObject[frameId] = objectUrl;

      this.setState({
        objectUrlObjects: copyOfObject,
      });
    });

    ipcRenderer.on('send-arrayOfObjectUrls', (event, arrayOfObjectUrls) => {
      const { objectUrlObjects } = this.state;

      // create copy so the state does not get mutated
      const copyOfObject = Object.assign({}, objectUrlObjects);
      arrayOfObjectUrls.map(item => {
        copyOfObject[item.frameId] = item.objectUrl;
        return undefined;
      });
      this.setState({
        objectUrlObjects: copyOfObject,
      });
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
      const thumb = this.props.sheetsByFileId[fileId][sheetId].thumbsArray.find(item =>
        item.thumbId === thumbId);
      if (thumb !== undefined && thumb.frameNumber !== frameNumber) {
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

    ipcRenderer.on('clearScenes', (event, fileId, sheetId) => {
      store.dispatch(clearScenes(
        fileId,
        sheetId,
      ));
    });

    ipcRenderer.on('addScene', (event, fileId, sheetId, start, length, colorArray) => {
      store.dispatch(addScene(
        fileId,
        sheetId,
        start,
        length,
        colorArray,
      ));
    });

    ipcRenderer.on('received-get-file-scan', (event, fileId, filePath, useRatio, sheetId) => {
      this.setState({
        fileScanRunning: false,
      });
      store.dispatch(updateFileScanStatus(fileId, true));
      this.runSceneDetection(fileId, filePath, useRatio, undefined, sheetId);
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
      this.showMessage(message, 3000);
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
      try {
        this.setState({
          opencvVideo: new opencv.VideoCapture(nextProps.file.path),
        });
      } catch (e) {
        log.error(e);
      }
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
    const { files, file, settings, sheetsByFileId, visibilitySettings } = this.props;
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
          store.dispatch(updateSheetName(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, getNewSheetName(getSheetCount(files, sheetToGetThumbsFor.fileId))));
          store.dispatch(updateSheetCounter(sheetToGetThumbsFor.fileId));
          store.dispatch(updateSheetType(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, SHEET_TYPE.INTERVAL));
          store.dispatch(updateSheetView(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, SHEETVIEW.GRIDVIEW));
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

        // define what sheetView to print depending on type
        const sheetView = sheet.sheetView;

        // get file to print
        const tempFile = files.find(file2 => file2.id === sheetToPrint.fileId);

        // get scenes to print
        let tempScenes;
        if (sheetView === SHEETVIEW.TIMELINEVIEW &&
          sheetsByFileId[sheetToPrint.fileId] !== undefined &&
          sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId] !== undefined) {
          tempScenes = getVisibleThumbs(
            sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId].sceneArray,
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
          sheetView === SHEETVIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
          1,
          undefined,
          true,
          tempScenes,
          secondsPerRow,
        );
        console.log(scaleValueObject);
        const dataToSend = {
          elementId: sheetView !== SHEETVIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
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
      prevProps.visibilitySettings.defaultSheetView !==
        this.props.visibilitySettings.defaultSheetView ||
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

    // if (prevState.showScrubCutWindow === false && this.state.showScrubCutWindow === true) {
    //   this.updateOpencvVideoCanvas(0);
    // }

    // replace all frames for this fileId -> fileIdToBeRecaptured
    if (this.state.fileIdToBeRecaptured !== undefined &&
      prevState.fileIdToBeRecaptured !== this.state.fileIdToBeRecaptured) {
      ipcRenderer.send(
        'message-from-mainWindow-to-opencvWorkerWindow',
        'recapture-frames',
        files,
        sheetsByFileId,
        settings.defaultCachedFramesSize,
        this.state.fileIdToBeRecaptured
      );
      this.setState({
        fileIdToBeRecaptured: undefined,
      })
    }

    // capture all frames for this fileId -> fileIdToBeCaptured
    if (this.state.fileIdToBeCaptured !== undefined &&
      prevState.fileIdToBeCaptured !== this.state.fileIdToBeCaptured) {
      ipcRenderer.send(
        'message-from-mainWindow-to-opencvWorkerWindow',
        'recapture-frames',
        files,
        sheetsByFileId,
        settings.defaultCachedFramesSize,
        this.state.fileIdToBeCaptured,
        false, // onlyReplace
      );
      this.setState({
        fileIdToBeCaptured: undefined,
      })
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
            store.dispatch(setDefaultSheetView(SHEETVIEW.GRIDVIEW));
            break;
          case 53: // press '5'
            store.dispatch(setView(VIEW.PLAYERVIEW));
            break;
          case 54: // press '6'
            store.dispatch(setDefaultSheetView(SHEETVIEW.TIMELINEVIEW));
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

  showMessage(message, time) {
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
  }

  recaptureAllFrames() {
    const { files, settings, sheetsByFileId } = this.props;

    // clear objectUrlObjects
    this.setState({
      objectUrlObjects: {},
    });

    ipcRenderer.send(
      'message-from-mainWindow-to-opencvWorkerWindow',
      'recapture-frames',
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

  onDrop(droppedFiles) {
    const { files } = this.props;

    // when user presses alt key on drop then clear list and add movies
    const clearList = this.state.keyObject.altKey;
    this.setState({
      dropzoneActive: false,
      loadingFirstFile: true
    });
    const { store } = this.context;
    log.debug('Files where dropped');
    log.debug(droppedFiles);
    // file match needs to be in sync with addMoviesToList() and accept !!!
    if (Array.from(droppedFiles).some(file => (file.type.match('video.*') ||
      file.name.match(/.divx|.mkv|.ogg|.VOB/i)))) {
      store.dispatch(setDefaultSheetView(SHEETVIEW.GRIDVIEW));
      store.dispatch(addMoviesToList(droppedFiles, clearList)).then((response) => {
        this.setState({
          filesToLoad: response,
        });
        if (clearList) {
          this.setState({
            objectUrlObjects: {}, // clear objectUrlObjects
          });
        }
        log.debug(response);
        // showMovielist if more than one movie
        if (response.length > 1 || (!clearList && files !== undefined && files.length > 0)) {
          store.dispatch(showMovielist());
        }
        return response;
      }).catch((error) => {
        log.error(error);
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
      store.dispatch(setDefaultSheetView(SHEETVIEW.GRIDVIEW));
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

  runSceneDetection(fileId, filePath, useRatio, threshold = this.props.settings.defaultSceneDetectionThreshold, sheetId = uuidV4()) {
    // this.hideSettings();
    this.onHideDetectionChart();
    const { store } = this.context;
    store.dispatch(setDefaultSheetView(SHEETVIEW.TIMELINEVIEW));
    store.dispatch(setCurrentSheetId(sheetId));
    store.dispatch(updateSheetType(fileId, sheetId, SHEET_TYPE.SCENES));
    store.dispatch(updateSheetView(fileId, sheetId, SHEETVIEW.TIMELINEVIEW));
    // get meanArray if it is stored else return false
    const arrayOfFrameScanData = getFrameScanByFileId(fileId);
    // console.log(arrayOfFrameScanData);
    // if meanArray not stored, runFileScan
    if (arrayOfFrameScanData.length === 0) {
      this.runFileScan(fileId, filePath, useRatio, threshold, sheetId);
    } else {
      const meanValueArray = arrayOfFrameScanData.map(frame => frame.meanValue)
      const meanColorArray = arrayOfFrameScanData.map(frame => JSON.parse(frame.meanColor))
      // console.log(meanColorArray);
      this.calculateSceneList(fileId, meanValueArray, meanColorArray, threshold, sheetId);
    }
    return true;
  }

  calculateSceneList(fileId, meanArray, meanColorArray, threshold = this.props.settings.defaultSceneDetectionThreshold, sheetId) {
    const { store } = this.context;
    const { files, settings } = this.props;
    let lastSceneCut = null;

    const differenceArray = [];
    meanArray.reduce((prev, curr) => {
        differenceArray.push(Math.abs(prev - curr));
        return curr;
    }, 0);

    store.dispatch(clearScenes(fileId, sheetId));

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
      const tempFile = files.find((file) => file.id === fileId);
      const clearOldScenes = true;
      store.dispatch(updateSheetType(tempFile.id, sheetId, SHEET_TYPE.SCENES));
      store.dispatch(updateSheetView(tempFile.id, sheetId, SHEETVIEW.TIMELINEVIEW));
      store.dispatch(updateSheetName(tempFile.id, sheetId, getNewSheetName(getSheetCount(files, tempFile.id))));
      store.dispatch(updateSheetCounter(tempFile.id));
      store.dispatch(setCurrentSheetId(sheetId));
      store.dispatch(setDefaultSheetView(SHEETVIEW.TIMELINEVIEW));
      store.dispatch(addScenes(tempFile, sceneList, clearOldScenes, settings.defaultCachedFramesSize, sheetId));
    } else {
      this.showMessage('No scenes detected', 3000);
    }
  }

  runFileScan(fileId, filePath, useRatio, threshold, sheetId) {
    if (this.state.fileScanRunning === false) {
      this.setState({ fileScanRunning: true });
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-scan', fileId, filePath, useRatio, threshold, sheetId);
    }
  }

  onScrubClick(file, scrubThumb) {
    const { store } = this.context;

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

    const switchToScrubCut = this.state.keyObject.ctrlKey;

    this.setState({
      showScrubWindow: !switchToScrubCut && true,
      showScrubCutWindow: switchToScrubCut && true,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
    });
    store.dispatch(hideMovielist());
    store.dispatch(hideSettings());
  }

  onExpandClick(file, sceneOrThumbId, parentSheetId) {
    const { store } = this.context;
    const { files, scenes, sheetsArray, sheetsByFileId, settings } = this.props;
    // console.log(file);
    // console.log(sceneOrThumbId);
    // console.log(parentSheetId);

    // open movie list so user sees that a new sheet got added
    this.showMovielist();

    // create scenesArray if it does not exist
    let sceneArray = scenes;
    if (sceneArray === undefined || sceneArray.length === 0) {
      sceneArray = createSceneArray(sheetsByFileId, file.id, parentSheetId);
      store.dispatch(updateSceneArray(file.id, parentSheetId, sceneArray));
    }
    // console.log(sceneArray);

    // get sceneArray
    const sceneIndex = sceneArray.findIndex(item => item.sceneId === sceneOrThumbId);
    const sheetId = sceneOrThumbId;
    // console.log(sheetId);

    // create new sheet if it does not already exist
    if (sheetsArray.findIndex(item => item === sheetId) === -1) {
      // log.debug(`addIntervalSheet as no thumbs were found for: ${file.name}`);
      store.dispatch(addIntervalSheet(
        file,
        sheetId,
        DEFAULT_THUMB_COUNT, // use constant value instead of defaultThumbCount
        sceneArray[sceneIndex].start,
        sceneArray[sceneIndex].start + sceneArray[sceneIndex].length - 1,
        settings.defaultCachedFramesSize
      ));
      store.dispatch(updateSheetName(file.id, sheetId, getNewSheetName(getSheetCount(files, file.id)))); // set name on file
      store.dispatch(updateSheetCounter(file.id));
      store.dispatch(updateSheetType(file.id, sheetId, SHEET_TYPE.INTERVAL));
    }
    store.dispatch(updateSheetView(file.id, sheetId, SHEETVIEW.GRIDVIEW));
    store.dispatch(setDefaultSheetView(SHEETVIEW.GRIDVIEW));
    store.dispatch(setCurrentSheetId(sheetId));
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
        showScrubCutWindow: false,
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
      showScrubCutWindow: false,
    });
  }

  onViewToggle() {
    const { store } = this.context;
    if (this.props.visibilitySettings.defaultView === VIEW.STANDARDVIEW) {
      this.hideSettings();
      this.hideMovielist();
      store.dispatch(setView(VIEW.PLAYERVIEW));
    } else {
      store.dispatch(setView(VIEW.STANDARDVIEW));
    }
  }

  onSaveMoviePrint() {
    const { file, settings, scenes, sheetsByFileId, visibilitySettings } = this.props;
    const { currentFileId, currentSheetId, defaultMoviePrintWidth, defaultPaperAspectRatioInv } = settings;
    const { defaultSheetView, visibilityFilter } = visibilitySettings;

    const sheet = sheetsByFileId[file.id][currentSheetId];
    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    const scaleValueObject = getScaleValueObject(
      file,
      settings,
      visibilitySettings,
      getColumnCount(sheetsByFileId, file.id, currentSheetId, settings),
      file.thumbCount,
      defaultMoviePrintWidth,
      defaultSheetView === SHEETVIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
      1,
      undefined,
      true,
      defaultSheetView !== SHEETVIEW.TIMELINEVIEW ? undefined : scenes,
      secondsPerRow,
    );

    const dataToSend = {
      // scale: 1,
      elementId: defaultSheetView !== SHEETVIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
      file,
      sheetId: currentSheetId,
      moviePrintWidth: defaultMoviePrintWidth,
      settings,
      sheet,
      visibilityFilter,
      scaleValueObject,
      scenes: defaultSheetView !== SHEETVIEW.TIMELINEVIEW ? undefined : scenes,
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

  onAddIntervalSheet(sheetsByFileId, fileId, settings) {
    const { store } = this.context;
    const { files } = this.props;

    const newSheetId = uuidV4();
    // set columnCount as it is not defined yet
    this.getThumbsForFile(fileId, newSheetId);
    const newColumnCount = getColumnCount(sheetsByFileId, fileId, newSheetId, settings);
    store.dispatch(updateSheetColumnCount(fileId, newSheetId, newColumnCount));
    store.dispatch(updateSheetName(fileId, newSheetId, getNewSheetName(getSheetCount(files, fileId))));
    store.dispatch(updateSheetCounter(fileId));
    store.dispatch(updateSheetType(fileId, newSheetId, SHEET_TYPE.INTERVAL));
    store.dispatch(updateSheetView(fileId, newSheetId, SHEETVIEW.GRIDVIEW));
    return newSheetId;
  }

  onAddIntervalSheetClick(fileId) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { store } = this.context;
    const { sheetsByFileId, settings, visibilitySettings } = this.props;

    store.dispatch(setCurrentFileId(fileId));

    const newSheetId = this.onAddIntervalSheet(sheetsByFileId, fileId, settings);

    const sheetView = getSheetView(sheetsByFileId, fileId, newSheetId, visibilitySettings);
    this.onSetSheetClick(fileId, newSheetId, sheetView);

  }

  onFileListElementClick(fileId) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { store } = this.context;
    const { sheetsByFileId, settings, visibilitySettings } = this.props;

    store.dispatch(setCurrentFileId(fileId));

    let newSheetId = getSheetId(sheetsByFileId, fileId);

    // When clicking on a filelist element for the first time
    if (newSheetId === undefined) {
      newSheetId = this.onAddIntervalSheet(sheetsByFileId, fileId, settings);
    }
    const sheetView = getSheetView(sheetsByFileId, fileId, newSheetId, visibilitySettings);
    console.log(sheetView);

    this.onSetSheetClick(fileId, newSheetId, sheetView);

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
    const { files } = this.props;
    if (files.length === 1) {
      store.dispatch(hideMovielist());
    }
    store.dispatch(removeMovieListItem(fileId));
    // store.dispatch(setCurrentSheetId(newSheetId));
  };

  onEditTransformListItemClick = (fileId) => {
    const { store } = this.context;
    const { files } = this.props;
    const file = files.find(file2 => file2.id === fileId);
    const { transformObject = {cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0} } = file; // initialise if undefined
    this.setState({
      showTransformModal: true,
      transformObject: Object.assign({fileId}, transformObject) // adding fileId
    })
  };

  onChangeTransform = (e) => {
    const { store } = this.context;
    const { transformObject } = this.state;
    const { cropTop, cropBottom, cropLeft, cropRight } = e.target;
    console.log(typeof cropTop.value);
    store.dispatch(
      updateCropping(
        transformObject.fileId,
        parseInt(cropTop.value, 10),
        parseInt(cropBottom.value, 10),
        parseInt(cropLeft.value, 10),
        parseInt(cropRight.value, 10)
        )
      );
    this.setState({
      showTransformModal: false,
      fileIdToBeRecaptured: transformObject.fileId,
    });
  };

  onScanMovieListItemClick = (fileId) => {
    const { files } = this.props;
    const file = files.find(file2 => file2.id === fileId);
    this.runSceneDetection(fileId, file.path, file.useRatio, 20.0);
  };

  onReplaceMovieListItemClick = (fileId) => {
    const { store } = this.context;
    const { files, settings, sheetsByFileId } = this.props;
    const file = files.find((file1) => file1.id === fileId);
    const { path: originalFilePath, lastModified: lastModifiedOfPrevious} = file;
    const newPathArray = dialog.showOpenDialog({
      title: 'Replace movie',
      defaultPath: originalFilePath,
      buttonLabel: 'Replace with',
      filters: [
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ['openFile']
    });
    const newFilePath = (newPathArray !== undefined ? newPathArray[0] : undefined);
    if (newFilePath) {
      log.debug(newFilePath);
      const fileName = path.basename(newFilePath);
      const { lastModified, size}  = getFileStatsObject(newFilePath);
      store.dispatch(replaceFileDetails(fileId, newFilePath, fileName, size, lastModified));

      // change video for videoPlayer to the new one
      try {
        this.setState({
          opencvVideo: new opencv.VideoCapture(newFilePath),
        });
      } catch (e) {
        log.error(e);
      }

      // change fileScanStatus
      store.dispatch(updateFileScanStatus(fileId, false));
      // remove entries from frameScanList sqlite3
      deleteFileIdFromFrameScanList(fileId);

      // use lastModified as indicator if the movie which will be replaced existed
      // if lastModified is undefined, then do not onlyReplace
      let onlyReplace = true;
      if (lastModifiedOfPrevious === undefined) {
        console.log('lastModifiedOfPrevious is undefined');
        onlyReplace = false;
      }

      const timeBefore = Date.now();
      this.setState({
        timeBefore
      });
      ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-details', fileId, newFilePath, file.posterFrameId, onlyReplace);
      if (onlyReplace) {
        this.setState({
          fileIdToBeRecaptured: fileId,
        })
      } else {
        this.setState({
          fileIdToBeCaptured: fileId,
        })
      }
    }
  };

  onDuplicateSheetClick = (fileId, sheetId) => {
    const { store } = this.context;
    const { files } = this.props;
    const newSheetId = uuidV4();
    store.dispatch(duplicateSheet(fileId, sheetId, newSheetId));
    store.dispatch(updateSheetName(fileId, newSheetId, getNewSheetName(getSheetCount(files, fileId)))); // set name on firstFile
    store.dispatch(updateSheetCounter(fileId));
    store.dispatch(setCurrentSheetId(newSheetId));
  };

  onExportSheetClick = (fileId, sheetId) => {
    const { files, settings, sheetsByFileId, visibilitySettings } = this.props;
    log.debug('onExportSheetClick');
    const frameNumberArray = getFramenumbersOfSheet(sheetsByFileId, fileId, sheetId, visibilitySettings);
    const sheetName = getSheetName(sheetsByFileId, fileId, sheetId);
    const fileName = getFileName(files, fileId);
    const filePath = getFilePath(files, fileId);
    const transformObject = getFileTransformObject(files, fileId);
    const columnCount = getColumnCount(sheetsByFileId, fileId, sheetId, settings);
    const exportObject = JSON.stringify({
      filePath,
      transformObject,
      columnCount,
      frameNumberArray,
    }, null, '\t'); // for pretty print with tab
    const filePathDirectory = path.dirname(filePath);
    const outputPath = settings.defaultOutputPathFromMovie ? filePathDirectory : settings.defaultOutputPath;
    const filePathAndName = path.join(
      outputPath,
      `${fileName}-${sheetName}.json`
    );
    const newFilePathAndName = dialog.showSaveDialog({
      defaultPath: filePathAndName,
      buttonLabel: 'Export',
      showsTagField: false,
    });
    if (newFilePathAndName !== undefined) {
      log.debug(exportObject);
      ipcRenderer.send('send-save-json-to-file', sheetId, newFilePathAndName, exportObject);
    }
  };

  onImportMoviePrint = (filePath = undefined) => {
    const { store } = this.context;
    const { files, settings } = this.props;
    log.debug('onImportMoviePrint');

    let newPath = filePath;

    // skip dialog if filePath already available
    if (filePath === undefined) {
      const newPathArray = dialog.showOpenDialog({
        filters: [
          { name: 'PNG or JSON', extensions: ['png', 'json'] },
        ],
        properties: ['openFile']
      });
      newPath = (newPathArray !== undefined ? newPathArray[0] : undefined);
    }

    if (newPath) {
      log.debug(newPath);
      fs.readFile(newPath, (err, data) => {
        if (err) {
          return log.error(err);
        }
        const fileExtension = path.extname(newPath).toLowerCase();

        let newFilePath;
        let transformObject;
        let columnCount;
        let frameNumberArray;
        let dataAvailable = false;

        if (fileExtension === '.png') {
          const chunks = extract(data);
          const textChunks = chunks.filter(chunk => chunk.name === 'tEXt')
            .map(chunk => text.decode(chunk.data));
          log.debug(`The png file ${newPath} has the following data embedded:`);
          log.debug(textChunks);

          if (textChunks.length !== 0) {
            newFilePath = textChunks.find(chunk => chunk.keyword === 'filePath').text;
            const transformObjectString = textChunks.find(chunk => chunk.keyword === 'transformObject').text;
            transformObject = (transformObjectString !== 'undefined') ? JSON.parse(transformObjectString) : undefined;
            columnCount = textChunks.find(chunk => chunk.keyword === 'columnCount').text;
            const frameNumberArrayString = textChunks.find(chunk => chunk.keyword === 'frameNumberArray').text;
            frameNumberArray = (frameNumberArrayString !== 'undefined') ? JSON.parse(frameNumberArrayString) : undefined;
            if (frameNumberArray !== undefined && frameNumberArray.length > 0) {
              dataAvailable = true;
            }
          }

        } else {
          const jsonData = JSON.parse(data);
          log.debug(`The json file ${newPath} has the following data:`);
          log.debug(jsonData);

          newFilePath = jsonData.filePath;
          transformObject = jsonData.transformObject;
          columnCount = jsonData.columnCount;
          frameNumberArray = jsonData.frameNumberArray;
          if (newFilePath !== undefined &&
            columnCount !== undefined &&
            frameNumberArray !== undefined &&
            frameNumberArray.length > 0) {
            dataAvailable = true;
          }
        }

        if (dataAvailable) {
          this.showMessage('Data is found and being loaded...', 3000);
          const fileName = path.basename(newFilePath);
          const { lastModified, size}  = getFileStatsObject(newFilePath) || {};

          const fileId = uuidV4();
          const posterFrameId = uuidV4();
          const sheetId = uuidV4();
          const fileToAdd = {
            id: fileId,
            lastModified,
            name: fileName,
            path: newFilePath,
            size,
            // type: files[key].type,
            posterFrameId,
          };
          store.dispatch({
            type: 'ADD_MOVIE_LIST_ITEMS',
            payload: [fileToAdd],
          });
          if (transformObject !== undefined) {
            store.dispatch(setCropping(fileId, transformObject.cropTop, transformObject.cropBottom, transformObject.cropLeft, transformObject.cropRight));
          }
          store.dispatch(addNewThumbsWithOrder(fileToAdd, sheetId, frameNumberArray, settings.defaultCachedFramesSize));
          store.dispatch(updateSheetName(fileId, sheetId, getNewSheetName(getSheetCount(files, fileId)))); // set name on file
          store.dispatch(updateSheetCounter(fileId));
          store.dispatch(updateSheetColumnCount(fileId, sheetId, columnCount));
          store.dispatch(updateSheetType(fileId, sheetId, SHEET_TYPE.INTERVAL));
          store.dispatch(updateSheetView(fileId, sheetId, SHEETVIEW.GRIDVIEW));
          store.dispatch(setDefaultSheetView(SHEETVIEW.GRIDVIEW));
          store.dispatch(setCurrentSheetId(sheetId));
          store.dispatch(setCurrentFileId(fileId));
          ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-file-details', fileId, newFilePath, posterFrameId, false, true);
        } else {
          this.showMessage('There is no fitting data found found or embedded', 3000);
        }
      });
    }
  };

  onClearMovieList = () => {
    const { store } = this.context;
    store.dispatch(clearMovieList());
    store.dispatch(hideMovielist());
    store.dispatch(hideSettings());
  };

  onDeleteSheetClick = (fileId, sheet) => {
    const { store } = this.context;
    const { sheetsByFileId } = this.props;
    store.dispatch(deleteSheets(fileId, sheet));
    const newSheetId = getSheetId(sheetsByFileId, fileId);
    store.dispatch(setCurrentSheetId(newSheetId));
  };

  onSetSheetClick = (fileId, sheetId, sheetView) => {
    const { store } = this.context;
    const { currentFileId } = this.props;
    if (fileId !== currentFileId) {
      store.dispatch(setCurrentFileId(fileId));
    }
    store.dispatch(setCurrentSheetId(sheetId));
    if (sheetView === SHEETVIEW.TIMELINEVIEW) {
      this.onReCaptureClick(false);
    }
    store.dispatch(setDefaultSheetView(sheetView));
  };

  onChangeSheetViewClick = (fileId, sheetId, sheetView) => {
    const { store } = this.context;
    const { sheetsByFileId, settings } = this.props;

    // if sheet type interval then create 'artificial' scene Array
    const sheetType = getSheetType(sheetsByFileId, fileId, sheetId, settings);
    if (sheetType === SHEET_TYPE.INTERVAL) {
      const sceneArray = createSceneArray(sheetsByFileId, fileId, sheetId);
      store.dispatch(updateSceneArray(fileId, sheetId, sceneArray));
      // sceneArray.map(scene => {
      //   store.dispatch(updateSceneId(fileId, sheetId, scene.thumbId, scene.sceneId));
      //   return undefined;
      // })
    }
    store.dispatch(updateSheetView(fileId, sheetId, sheetView));

    if (sheetView === SHEETVIEW.TIMELINEVIEW) {
      this.onReCaptureClick(false);
    }
    store.dispatch(setDefaultSheetView(sheetView));
  };

  onSetViewClick = (value) => {
    const { store } = this.context;
    if (value === VIEW.PLAYERVIEW) {
      this.hideSettings();
      this.hideMovielist();
    }
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

  onEmbedFrameNumbersClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultEmbedFrameNumbers(value));
  };

  onEmbedFilePathClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultEmbedFilePath(value));
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
    const { objectUrlObjects } = this.state;
    const { currentFileId, currentSheetId, allThumbs, files, sheetsByFileId, settings, visibilitySettings } = this.props;

    const fileCount = files.length;

    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);
    const sheetView = getSheetView(sheetsByFileId, currentFileId, currentSheetId, visibilitySettings);

    let isGridView = true;
    if (sheetView === SHEETVIEW.TIMELINEVIEW) {
      isGridView = false;
    }

    // get objectUrls by reading all currently visible thumbs and get the corresponding objectUrls from the objectUrlObjects
    let filteredObjectUrlObjects;
    if (allThumbs !== undefined && objectUrlObjects.length !== 0) {

      // create array of all currently visible frameIds
      const arrayOfFrameIds = allThumbs.map(thumb => thumb.frameId);

      // filter objectUrlObjects with arrayOfFrameIds
      filteredObjectUrlObjects = Object.keys(objectUrlObjects)
        .filter(key => arrayOfFrameIds.includes(key))
        .reduce((obj, key) => {
          return {
            ...obj,
            [key]: objectUrlObjects[key]
          };
        }, {});

      // console.log(filteredObjectUrlObjects);
    }

    let filteredPosterFrameObjectUrlObjects;
    if (files !== undefined && objectUrlObjects.length !== 0) {

      // get objectUrls by reading all files and get the corresponding objectUrls from the objectUrlObjects
      // create array of all currently visible frameIds
      const arrayOfPosterFrameIds = files.map(file => file.posterFrameId);

      // filter objectUrlObjects with arrayOfPosterFrameIds
      filteredPosterFrameObjectUrlObjects = Object.keys(objectUrlObjects)
        .filter(key => arrayOfPosterFrameIds.includes(key))
        .reduce((obj, key) => {
          return {
            ...obj,
            [key]: objectUrlObjects[key]
          };
        }, {});

      // console.log(filteredPosterFrameObjectUrlObjects);
    }

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
                  fileCount={fileCount}
                  toggleMovielist={this.toggleMovielist}
                  toggleSettings={this.toggleSettings}
                  toggleZoom={this.toggleZoom}
                  onToggleShowHiddenThumbsClick={this.onToggleShowHiddenThumbsClick}
                  onThumbInfoClick={this.onThumbInfoClick}
                  onImportMoviePrint={this.onImportMoviePrint}
                  onClearMovieList={this.onClearMovieList}
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
                      onAddIntervalSheetClick={this.onAddIntervalSheetClick}
                      posterobjectUrlObjects={filteredPosterFrameObjectUrlObjects}
                      sheetsByFileId={this.props.sheetsByFileId}
                      onChangeSheetViewClick={this.onChangeSheetViewClick}
                      onSetSheetClick={this.onSetSheetClick}
                      onDuplicateSheetClick={this.onDuplicateSheetClick}
                      onExportSheetClick={this.onExportSheetClick}
                      onScanMovieListItemClick={this.onScanMovieListItemClick}
                      onReplaceMovieListItemClick={this.onReplaceMovieListItemClick}
                      onEditTransformListItemClick={this.onEditTransformListItemClick}
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
                      onEmbedFrameNumbersClick={this.onEmbedFrameNumbersClick}
                      onEmbedFilePathClick={this.onEmbedFilePathClick}
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
                        objectUrlObjects={filteredObjectUrlObjects}
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
                      // (this.props.visibilitySettings.defaultSheetView === 'gridView') ? (
                      <Fragment>
                        <Conditional if={this.props.visibilitySettings.defaultSheetView !== SHEETVIEW.TIMELINEVIEW}>
                          <SortedVisibleThumbGrid
                            colorArray={this.state.colorArray}
                            sheetView={this.props.visibilitySettings.defaultSheetView}
                            view={this.props.visibilitySettings.defaultView}
                            currentSheetId={this.props.settings.currentSheetId}
                            file={this.props.file}
                            inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                            keyObject={this.state.keyObject}
                            onAddThumbClick={this.onAddThumbClick}
                            onScrubClick={this.onScrubClick}
                            onExpandClick={this.onExpandClick}
                            onThumbDoubleClick={this.onViewToggle}
                            scaleValueObject={this.state.scaleValueObject}
                            moviePrintWidth={this.state.scaleValueObject.newMoviePrintWidth}
                            selectedThumbId={this.state.selectedThumbObject ? this.state.selectedThumbObject.thumbId : undefined}
                            selectThumbMethod={this.onSelectThumbMethod}
                            settings={this.props.settings}
                            showSettings={this.props.visibilitySettings.showSettings}
                            thumbCount={this.state.thumbCountTemp}
                            objectUrlObjects={filteredObjectUrlObjects}
                            thumbs={this.props.thumbs}
                            viewForPrinting={false}
                            frameSize={this.props.settings.defaultCachedFramesSize}
                            isGridView={isGridView}
                          />
                        </Conditional>
                        <Conditional if={this.props.visibilitySettings.defaultSheetView === SHEETVIEW.TIMELINEVIEW}>
                          <SortedVisibleSceneGrid
                            sheetView={this.props.visibilitySettings.defaultSheetView}
                            view={this.props.visibilitySettings.defaultView}
                            file={this.props.file}
                            currentSheetId={this.props.settings.currentSheetId}
                            frameCount={this.props.file ? this.props.file.frameCount : undefined}
                            inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                            keyObject={this.state.keyObject}
                            selectedSceneId={this.state.selectedSceneObject ? this.state.selectedSceneObject.sceneId : undefined}
                            selectSceneMethod={this.onSelectSceneMethod}
                            onThumbDoubleClick={this.onViewToggle}
                            onExpandClick={this.onExpandClick}
                            moviePrintWidth={this.state.scaleValueObject.newMoviePrintTimelineWidth}
                            moviePrintRowHeight={this.state.scaleValueObject.newTimelineRowHeight}
                            scaleValueObject={this.state.scaleValueObject}
                            scenes={this.props.scenes}
                            settings={this.props.settings}
                            showSettings={this.props.visibilitySettings.showSettings}
                            objectUrlObjects={filteredObjectUrlObjects}
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
                  defaultSheetView={this.props.visibilitySettings.defaultSheetView}
                  defaultView={this.props.visibilitySettings.defaultView}
                />
              </div>
              { this.state.showScrubWindow &&
                <Scrub
                  opencvVideoCanvasRef={this.opencvVideoCanvasRef}
                  file={this.props.file}
                  settings={this.props.settings}
                  objectUrlObjects={filteredObjectUrlObjects}
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
              { this.state.showScrubCutWindow &&
                <ScrubCut
                  opencvVideo={this.state.opencvVideo}
                  // opencvVideoCanvasRef={this.opencvVideoCanvasRef}
                  file={this.props.file}
                  settings={this.props.settings}
                  objectUrlObjects={filteredObjectUrlObjects}
                  keyObject={this.state.keyObject}
                  scrubThumb={this.state.scrubThumb}
                  scrubThumbLeft={this.state.scrubThumbLeft}
                  scrubThumbRight={this.state.scrubThumbRight}
                  scaleValueObject={this.state.scaleValueObject}
                  containerWidth={this.state.containerWidth}
                  containerHeight={this.state.containerHeight}
                  // onScrubWindowMouseOver={this.onScrubWindowMouseOver}
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
                open={this.state.showTransformModal}
                onClose={() => this.setState({ showTransformModal: false})}
                size='small'
                closeIcon
              >
                <Modal.Header>Set transform</Modal.Header>
                <Modal.Content image>
                  <Modal.Description>
                    <Form onSubmit={this.onChangeTransform}>
                      <Form.Group>
                        <Header as='h3'>Cropping in pixel</Header>
                        <Form.Input name='cropTop' label='From top' placeholder='top' type='number' min='0' width={3} defaultValue={this.state.transformObject.cropTop} />
                        <Form.Input name='cropBottom' label='From bottom' placeholder='bottom' type='number' min='0' width={3} defaultValue={this.state.transformObject.cropBottom} />
                        <Form.Input name='cropLeft' label='From left' placeholder='left' type='number' min='0' width={3} defaultValue={this.state.transformObject.cropLeft} />
                        <Form.Input name='cropRight' label='From right' placeholder='right' type='number' min='0' width={3} defaultValue={this.state.transformObject.cropRight} />
                      </Form.Group>
                    <Form.Button content='Update cropping' />
                    </Form>
                  </Modal.Description>
                </Modal.Content>
              </Modal>
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
    );
  }
}

const mapStateToProps = state => {
  const { visibilitySettings } = state;
  const { settings, sheetsByFileId, files } = state.undoGroup.present;
  const { currentFileId, currentSheetId } = settings;
  const sheetsArray = (sheetsByFileId[currentFileId] === undefined)
    ? [] : Object.getOwnPropertyNames(sheetsByFileId[currentFileId]);
  const allThumbs = (sheetsByFileId[currentFileId] === undefined ||
    sheetsByFileId[currentFileId][settings.currentSheetId] === undefined)
    ? undefined : sheetsByFileId[currentFileId][settings.currentSheetId].thumbsArray;
  const allScenes = (sheetsByFileId[currentFileId] === undefined ||
    sheetsByFileId[currentFileId][settings.currentSheetId] === undefined)
    ? undefined : sheetsByFileId[currentFileId][settings.currentSheetId].sceneArray;
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
