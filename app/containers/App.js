import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import fs from 'fs';
import {
  Progress,
  Modal,
  Button,
  Icon,
  Container,
  Dimmer,
  Loader,
  Header,
  Divider,
  Form,
  Popup,
} from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import { Line, defaults } from 'react-chartjs-2';
import path from 'path';
import log from 'electron-log';
import os from 'os';
import Database from 'better-sqlite3';
import extract from 'png-chunks-extract';
import text from 'png-chunk-text';
import { Zoom, ToastContainer, toast } from 'react-toastify';
import axios from 'axios';

import '../app.global.css';
import FileList from './FileList';
import SettingsList from './SettingsList';
import SortedVisibleThumbGrid from './VisibleThumbGrid';
import SortedVisibleSceneGrid from './VisibleSceneGrid';
import Conditional from '../components/Conditional';
import HeaderComponent from '../components/HeaderComponent';
import FloatingMenu from '../components/FloatingMenu';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import Scrub from '../components/Scrub';
import getScaleValueObject from '../utils/getScaleValueObject';
import {
  calculateSceneListFromDifferenceArray,
  createSceneArray,
  doesFileFolderExist,
  doesSheetExist,
  getAdjacentSceneIndicesFromCut,
  getColumnCount,
  getEDLscenes,
  getFaceIdOfThumb,
  getFile,
  getFileName,
  getFilePath,
  getFileStatsObject,
  getFileTransformObject,
  getFrameCount,
  getFrameNumberArrayOfOccurrences,
  getFramenumbersOfSheet,
  getHighestFrame,
  getIntervalArray,
  getLeftAndRightThumb,
  getLowestFrame,
  getMoviePrintColor,
  getNewSheetName,
  getObjectProperty,
  getParentSheetId,
  getSceneFromFrameNumber,
  getSceneScrubFrameNumber,
  getScrubFrameNumber,
  getSecondsPerRow,
  getSheetCount,
  getSheetId,
  getSheetIdArray,
  getSheetName,
  getSheetType,
  getSheetView,
  getThumbsCount,
  getVisibleThumbs,
  isEquivalent,
  limitFrameNumberWithinMovieRange,
  repairFrameScanData,
  setPosition,
  sortArray,
  sortThumbsArray,
} from '../utils/utils';
import styles from './App.css';
import stylesPop from '../components/Popup.css';
import {
  addIntervalSheet,
  addMoviesToList,
  addNewThumbsWithOrder,
  addScenesFromSceneList,
  addScenesWithoutCapturingThumbs,
  addThumb,
  addThumbs,
  changeThumb,
  changeAndSortThumbArray,
  clearMovieList,
  clearScenes,
  cutScene,
  deleteSheets,
  duplicateSheet,
  hideMovielist,
  hideSettings,
  mergeScenes,
  removeMovieListItem,
  replaceFileDetails,
  setCropping,
  setCurrentFileId,
  setCurrentSheetId,
  setDefaultCachedFramesSize,
  setDefaultColumnCount,
  setDefaultDetectInOutPoint,
  setDefaultEmbedFilePath,
  setDefaultEmbedFrameNumbers,
  setDefaultFaceSizeThreshold,
  setDefaultFaceConfidenceThreshold,
  setDefaultFaceUniquenessThreshold,
  setDefaultFrameinfoBackgroundColor,
  setDefaultFrameinfoColor,
  setDefaultFrameinfoMargin,
  setDefaultFrameinfoPosition,
  setDefaultFrameinfoScale,
  setDefaultMarginRatio,
  setDefaultMoviePrintBackgroundColor,
  setDefaultMoviePrintName,
  setDefaultSingleThumbName,
  setDefaultAllThumbsName,
  setDefaultMoviePrintWidth,
  setDefaultOpenFileExplorerAfterSaving,
  setDefaultOutputFormat,
  setDefaultOutputPath,
  setDefaultOutputPathFromMovie,
  setDefaultPaperAspectRatioInv,
  setDefaultRoundedCorners,
  setDefaultSaveOptionIncludeIndividual,
  setDefaultSaveOptionOverwrite,
  setDefaultSceneDetectionThreshold,
  setDefaultSheetView,
  setDefaultShotDetectionMethod,
  setDefaultShowDetailsInHeader,
  setDefaultShowHeader,
  setDefaultShowImages,
  setDefaultShowFaceRect,
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
  setSheetFit,
  setView,
  setVisibilityFilter,
  showMovielist,
  showSettings,
  showThumbsByFrameNumberArray,
  updateCropping,
  updateFileDetails,
  updateFileDetailUseRatio,
  updateFileMissingStatus,
  updateFileScanStatus,
  updateFrameNumberAndColorArray,
  updateInOutPoint,
  updateOrder,
  updateSceneArray,
  updateSheetColumnCount,
  updateSheetCounter,
  updateSheetName,
  updateSheetParent,
  updateSheetSecondsPerRow,
  updateSheetType,
  updateSheetView,
} from '../actions';
import {
  DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN,
  DEFAULT_THUMB_COUNT,
  EXPORT_FORMAT_OPTIONS,
  SORT_METHOD,
  FRAMESDB_PATH,
  MENU_FOOTER_HEIGHT,
  MENU_HEADER_HEIGHT,
  SHEET_FIT,
  SHEET_TYPE,
  SHEET_VIEW,
  SHOT_DETECTION_METHOD,
  URL_CHANGE_LOG,
  URL_FEEDBACK_FORM,
  URL_REST_API_CHECK_FOR_UPDATES,
  VIEW,
  ZOOM_SCALE,
} from '../utils/constants';
import { deleteTableFramelist } from '../utils/utilsForIndexedDB';
import {
  deleteTableFrameScanList,
  deleteTableReduxState,
  getFaceScanByFileId,
  getFrameScanByFileId,
  getFrameScanCount,
} from '../utils/utilsForSqlite';

import startupImg from '../img/MoviePrint-steps.svg';

const compareVersions = require('compare-versions');

const { ipcRenderer } = require('electron');
const { dialog, app, shell } = require('electron').remote;
const opencv = require('opencv4nodejs');

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: console.log });
moviePrintDB.pragma('journal_mode = WAL');

// const DEV_OPENCV_SCENE_DETECTION = process.env.DEV_OPENCV_SCENE_DETECTION === 'true';

// Disable animating charts by default.
defaults.global.animation = false;

const loadSheetPropertiesIntoState = (that, columnCount, thumbCount, secondsPerRowTemp = undefined) => {
  that.setState({
    columnCountTemp: columnCount,
    thumbCountTemp: thumbCount,
    columnCount,
    thumbCount,
    secondsPerRowTemp,
  });
};

class App extends Component {
  constructor() {
    super();

    this.webviewRef = React.createRef();
    this.opencvVideoCanvasRef = React.createRef();
    this.dropzoneRef = React.createRef();
    this.videoPlayer = React.createRef();

    this.state = {
      containerHeight: 360,
      containerWidth: 640,
      secondsPerRowTemp: undefined,
      columnCountTemp: undefined,
      thumbCountTemp: undefined,
      columnCount: undefined,
      thumbCount: undefined,
      reCapture: true,
      emptyColorsArray: undefined,
      scaleValueObject: undefined,
      savingMoviePrint: false,
      selectedThumbsArray: [],
      jumpToFrameNumber: undefined,
      // file match needs to be in sync with addMoviesToList(), onReplaceMovieListItemClick() and onDrop() !!!
      accept: 'video/*,.divx,.mkv,.ogg,.VOB,',
      dropzoneActive: false,
      loadingFirstFile: false,
      keyObject: {
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        which: undefined,
      },
      zoom: false,
      filesToLoad: [],
      showMessage: false,
      progressBarPercentage: 100,
      showFeedbackForm: false,
      feedbackFormIsLoading: false,
      intendToCloseFeedbackForm: false,
      opencvVideo: undefined,
      showScrubWindow: false,
      scrubThumb: undefined,
      scrubScene: undefined,
      showChart: false,
      chartData: {
        labels: ['Inpoint', 'Outpoint'],
        datasets: [
          {
            label: 'Empty dataset',
            backgroundColor: 'rgb(0, 99, 132)',
            data: [0, 0],
          },
        ],
      },
      fileScanRunning: false,
      sheetsToPrint: [],
      sheetsToUpdate: [],
      savingAllMoviePrints: false,
      showTransformModal: false,
      showSaveThumbModal: false,
      transformObject: {},
      objectUrlObjects: {},
      framesToFetch: [],
      fileIdToBeRecaptured: undefined,
      fileIdToBeCaptured: undefined,
      requestIdleCallbackForScenesHandle: undefined,
      requestIdleCallbackForImagesHandle: undefined,
      requestIdleCallbackForObjectUrlHandle: undefined,
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.onSelectThumbMethod = this.onSelectThumbMethod.bind(this);
    this.onDeselectThumbMethod = this.onDeselectThumbMethod.bind(this);

    this.showMovielist = this.showMovielist.bind(this);
    this.hideMovielist = this.hideMovielist.bind(this);
    this.toggleMovielist = this.toggleMovielist.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.showSettings = this.showSettings.bind(this);
    this.hideSettings = this.hideSettings.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onViewToggle = this.onViewToggle.bind(this);
    this.onChangeThumb = this.onChangeThumb.bind(this);
    this.onAddThumb = this.onAddThumb.bind(this);
    this.onScrubWindowMouseOver = this.onScrubWindowMouseOver.bind(this);
    this.onScrubWindowClick = this.onScrubWindowClick.bind(this);
    this.onScrubClick = this.onScrubClick.bind(this);
    this.onExpandClick = this.onExpandClick.bind(this);
    this.onAddThumbClick = this.onAddThumbClick.bind(this);
    this.onJumpToCutThumbClick = this.onJumpToCutThumbClick.bind(this);
    this.onJumpToCutSceneClick = this.onJumpToCutSceneClick.bind(this);
    this.onCutSceneClick = this.onCutSceneClick.bind(this);
    this.onMergeSceneClick = this.onMergeSceneClick.bind(this);
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
    this.onBackToParentClick = this.onBackToParentClick.bind(this);
    this.onAddIntervalSheet = this.onAddIntervalSheet.bind(this);
    this.onAddIntervalSheetClick = this.onAddIntervalSheetClick.bind(this);
    this.onAddFaceSheetClick = this.onAddFaceSheetClick.bind(this);
    this.onRescanFaceSheet = this.onRescanFaceSheet.bind(this);
    this.onErrorPosterFrame = this.onErrorPosterFrame.bind(this);
    this.getThumbsForFile = this.getThumbsForFile.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onChangeColumnAndApply = this.onChangeColumnAndApply.bind(this);
    this.onChangeShowFaceRectClick = this.onChangeShowFaceRectClick.bind(this);
    this.onShowPaperPreviewClick = this.onShowPaperPreviewClick.bind(this);
    this.onOutputPathFromMovieClick = this.onOutputPathFromMovieClick.bind(this);
    this.onPaperAspectRatioClick = this.onPaperAspectRatioClick.bind(this);
    this.onDetectInOutPointClick = this.onDetectInOutPointClick.bind(this);
    this.onReCaptureClick = this.onReCaptureClick.bind(this);
    this.onApplyNewGridClick = this.onApplyNewGridClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);

    this.onChangeMargin = this.onChangeMargin.bind(this);
    this.onChangeFaceSizeThreshold = this.onChangeFaceSizeThreshold.bind(this);
    this.onChangeFaceConfidenceThreshold = this.onChangeFaceConfidenceThreshold.bind(this);
    this.onChangeFaceUniquenessThreshold = this.onChangeFaceUniquenessThreshold.bind(this);
    this.onChangeFrameinfoScale = this.onChangeFrameinfoScale.bind(this);
    this.onChangeFrameinfoMargin = this.onChangeFrameinfoMargin.bind(this);
    this.onChangeMinDisplaySceneLength = this.onChangeMinDisplaySceneLength.bind(this);
    this.onChangeSceneDetectionThreshold = this.onChangeSceneDetectionThreshold.bind(this);
    this.onChangeTimelineViewSecondsPerRow = this.onChangeTimelineViewSecondsPerRow.bind(this);
    this.onChangeTimelineViewWidthScale = this.onChangeTimelineViewWidthScale.bind(this);
    this.onTimelineViewFlowClick = this.onTimelineViewFlowClick.bind(this);
    this.onToggleHeaderClick = this.onToggleHeaderClick.bind(this);
    this.onToggleImagesClick = this.onToggleImagesClick.bind(this);
    this.onToggleFaceRectClick = this.onToggleFaceRectClick.bind(this);
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
    this.onOpenFileExplorer = this.onOpenFileExplorer.bind(this);
    this.onClearMovieList = this.onClearMovieList.bind(this);
    this.onChangeSheetViewClick = this.onChangeSheetViewClick.bind(this);
    this.onSubmitMoviePrintNameClick = this.onSubmitMoviePrintNameClick.bind(this);
    this.toggleSheetView = this.toggleSheetView.bind(this);
    this.setOrToggleDefaultSheetView = this.setOrToggleDefaultSheetView.bind(this);
    this.onSetSheetClick = this.onSetSheetClick.bind(this);
    this.onDuplicateSheetClick = this.onDuplicateSheetClick.bind(this);
    this.onExportSheetClick = this.onExportSheetClick.bind(this);
    this.onScanMovieListItemClick = this.onScanMovieListItemClick.bind(this);
    this.onReplaceMovieListItemClick = this.onReplaceMovieListItemClick.bind(this);
    this.onEditTransformListItemClick = this.onEditTransformListItemClick.bind(this);
    this.onChangeTransform = this.onChangeTransform.bind(this);
    this.onRemoveMovieListItem = this.onRemoveMovieListItem.bind(this);
    this.onDeleteSheetClick = this.onDeleteSheetClick.bind(this);
    this.onChangeDefaultMoviePrintName = this.onChangeDefaultMoviePrintName.bind(this);
    this.onChangeOutputPathClick = this.onChangeOutputPathClick.bind(this);
    this.onFrameinfoPositionClick = this.onFrameinfoPositionClick.bind(this);
    this.onOutputFormatClick = this.onOutputFormatClick.bind(this);
    this.onCachedFramesSizeClick = this.onCachedFramesSizeClick.bind(this);
    this.onOverwriteClick = this.onOverwriteClick.bind(this);
    this.onIncludeIndividualClick = this.onIncludeIndividualClick.bind(this);
    this.onEmbedFrameNumbersClick = this.onEmbedFrameNumbersClick.bind(this);
    this.onEmbedFilePathClick = this.onEmbedFilePathClick.bind(this);
    this.onOpenFileExplorerAfterSavingClick = this.onOpenFileExplorerAfterSavingClick.bind(this);
    this.onThumbnailScaleClick = this.onThumbnailScaleClick.bind(this);
    this.onMoviePrintWidthClick = this.onMoviePrintWidthClick.bind(this);
    this.onShotDetectionMethodClick = this.onShotDetectionMethodClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
    this.runSceneDetection = this.runSceneDetection.bind(this);
    this.cancelFileScan = this.cancelFileScan.bind(this);
    this.calculateSceneList = this.calculateSceneList.bind(this);
    this.onToggleDetectionChart = this.onToggleDetectionChart.bind(this);
    this.onSortSheet = this.onSortSheet.bind(this);
    this.addFaceData = this.addFaceData.bind(this);
    this.onHideDetectionChart = this.onHideDetectionChart.bind(this);
    this.checkForUpdates = this.checkForUpdates.bind(this);

    this.pullScenesFromOpencvWorker = this.pullScenesFromOpencvWorker.bind(this);

    // moving ipcRenderer into constructor so it gets executed even when
    // the component can not mount and the ErrorBoundary kicks in
    ipcRenderer.on('delete-all-tables', event => {
      log.debug('delete-all-tables');
      deleteTableFrameScanList();
      deleteTableReduxState();
      deleteTableFramelist();
    });
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const { columnCountTemp, thumbCountTemp, containerWidth, containerHeight, zoom } = this.state;
    const {
      currentFileId,
      currentSheetId,
      file,
      files,
      scenes,
      settings,
      sheetsByFileId,
      visibilitySettings,
    } = this.props;
    const { defaultShowPaperPreview, defaultThumbCountMax } = settings;

    // check if all movies exist
    // if not then mark them with fileMissingStatus
    if (files.length > 0) {
      files.map(item => {
        if (doesFileFolderExist(item.path) === false) {
          console.log(item.path);
          dispatch(updateFileMissingStatus(item.id, true));
        }
      });
    }

    // get objecturls from all frames in imagedb
    ipcRenderer.send('message-from-mainWindow-to-indexedDBWorkerWindow', 'get-arrayOfObjectUrls');

    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    loadSheetPropertiesIntoState(
      this,
      getColumnCount(sheetsByFileId, undefined, undefined, settings),
      getThumbsCount(sheetsByFileId, currentFileId, currentSheetId, settings, visibilitySettings),
      secondsPerRow,
    );
    this.setState({
      emptyColorsArray: getMoviePrintColor(defaultThumbCountMax),
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
      ),
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
    const { dispatch, settings } = this.props;

    ipcRenderer.on('progress', (event, fileId, progressBarPercentage) => {
      this.setState({
        progressBarPercentage: Math.ceil(progressBarPercentage),
      });
      if (progressBarPercentage === 100) {
        toast.update(fileId, {
          className: `${stylesPop.toast} ${stylesPop.toastSuccess}`,
          progress: null,
          render: 'Detection finished',
          hideProgressBar: true,
          autoClose: 3000,
          closeButton: true,
          closeOnClick: true,
        });
      } else {
        toast.update(fileId, {
          progress: progressBarPercentage / 100.0,
        });
      }
    });

    ipcRenderer.on('progressMessage', (event, status, message, time = 3000) => {
      this.showMessage(message, time, status);
    });

    ipcRenderer.on('error-savingMoviePrint', () => {
      if (this.state.savingMoviePrint) {
        setTimeout(this.setState({ savingMoviePrint: false }), 1000); // adding timeout to prevent clicking multiple times
      }
      ipcRenderer.send('reload-workerWindow');
    });

    ipcRenderer.on(
      'receive-get-file-details',
      (
        event,
        fileId,
        filePath,
        posterFrameId,
        frameCount,
        width,
        height,
        fps,
        fourCC,
        onlyReplace = false,
        onlyImport = false,
      ) => {
        dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
        ipcRenderer.send(
          'message-from-mainWindow-to-opencvWorkerWindow',
          'send-get-poster-frame',
          fileId,
          filePath,
          posterFrameId,
          onlyReplace,
          onlyImport,
        );
      },
    );

    // poster frames don't have thumbId
    ipcRenderer.on(
      'receive-get-poster-frame',
      (event, fileId, filePath, posterFrameId, frameNumber, useRatio, onlyReplace = false, onlyImport = false) => {
        dispatch(updateFileDetailUseRatio(fileId, useRatio));

        // get all posterframes
        if (!onlyReplace || !onlyImport) {
          ipcRenderer.send(
            'message-from-mainWindow-to-opencvWorkerWindow',
            'send-get-in-and-outpoint',
            fileId,
            filePath,
            useRatio,
            settings.defaultDetectInOutPoint,
          );
        }
      },
    );

    ipcRenderer.on('receive-get-in-and-outpoint', (event, fileId, fadeInPoint, fadeOutPoint) => {
      const { filesToLoad } = this.state;

      dispatch(updateInOutPoint(fileId, fadeInPoint, fadeOutPoint));

      // check if this was not the last file coming back from the renderer
      if (filesToLoad.length > 0) {
        // check if the movie just coming back from the renderer should be displayed
        // this parameter is set in onDrop (when files are added)
        if (filesToLoad[0].displayMe) {
          this.onAddIntervalSheetClick(filesToLoad[0].id);
        }

        // state should be immutable, therefor
        // make a copy with slice, then remove the first item with shift, then set new state
        const copyOfFilesToLoad = filesToLoad.slice();
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
          filesToLoad: copyOfFilesToLoad,
        });
        dispatch(removeMovieListItem(fileId));
      }
    });

    ipcRenderer.on('update-objectUrl', (event, frameId, objectUrl) => {
      const { objectUrlObjects } = this.state;

      // create copy so the state does not get mutated
      const copyOfObject = { ...objectUrlObjects };

      // Update object's name property.
      copyOfObject[frameId] = objectUrl;

      this.setState({
        objectUrlObjects: copyOfObject,
      });
    });

    ipcRenderer.on('send-arrayOfObjectUrls', (event, arrayOfObjectUrls) => {
      const { objectUrlObjects, requestIdleCallbackForObjectUrlHandle } = this.state;

      // if arrayOfObjectUrls not empty setState and renew
      if (arrayOfObjectUrls.length !== 0) {
        // create copy so the state does not get mutated
        const copyOfObject = { ...objectUrlObjects };
        arrayOfObjectUrls.map(item => {
          copyOfObject[item.frameId] = item.objectUrl;
          return undefined;
        });
        this.setState({
          objectUrlObjects: copyOfObject,
        });
        const newRequestIdleCallbackHandle = window.requestIdleCallback(this.pullObjectUrlFromIndexedDBWorkerWindow);
        this.setState({
          requestIdleCallbackForObjectUrlHandle: newRequestIdleCallbackHandle,
        });
        log.debug('now I requestIdleCallbackForObjectUrl again');
      } else {
        // cancel pullObjectUrlFromIndexedDBWorkerWindow
        window.cancelIdleCallback(requestIdleCallbackForObjectUrlHandle);
        this.setState({
          requestIdleCallbackForObjectUrlHandle: undefined,
        });
      }
    });

    ipcRenderer.on('start-requestIdleCallback-for-objectUrlQueue', event => {
      const { requestIdleCallbackForObjectUrlHandle } = this.state;

      // start requestIdleCallback until it is cancelled
      if (requestIdleCallbackForObjectUrlHandle === undefined) {
        const newRequestIdleCallbackHandle = window.requestIdleCallback(this.pullObjectUrlFromIndexedDBWorkerWindow);
        this.setState({
          requestIdleCallbackForObjectUrlHandle: newRequestIdleCallbackHandle,
        });
        log.debug('now I requestIdleCallbackForObjectUrl');
      } else {
        log.debug(
          'requestIdleCallbackForObjectUrl already running. no new requestIdleCallbackForObjectUrl will be started.',
        );
      }
    });

    ipcRenderer.on('update-frameNumber-and-colorArray', (event, frameNumberAndColorArray) => {
      dispatch(updateFrameNumberAndColorArray(frameNumberAndColorArray));
    });

    ipcRenderer.on('update-sort-order', (event, detectionArray) => {
      // dispatch(updateFrameNumberAndColorArray(detectionArray));
    });

    ipcRenderer.on(
      'finished-getting-faces',
      (event, fileId, sheetId, detectionArray, faceSortMethod, updateSheet = false) => {
        const { sheetsToUpdate } = this.state;
        const { files } = this.props;
        console.log(detectionArray);
        console.log(faceSortMethod);
        console.log(sheetId);

        this.setState({
          fileScanRunning: false,
        });

        // only run if there is at least 1 face
        if (detectionArray !== 0) {
          // sort and filter faces by faceSortMethod
          const sortedArray = sortArray(detectionArray, faceSortMethod);

          // extract frameNumbers
          const frameNumberArrayFromFaceDetection = sortedArray.map(item => item.frameNumber);
          console.log(frameNumberArrayFromFaceDetection);

          if (updateSheet) {
            sheetsToUpdate.push({
              fileId,
              sheetId,
              status: 'addFaceData',
              sortMethod: faceSortMethod,
            });
            dispatch(
              updateSheetColumnCount(fileId, sheetId, Math.ceil(Math.sqrt(frameNumberArrayFromFaceDetection.length))),
            );
          } else {
            // create new sheet and add face thumbs
            const newSheetId = uuidV4();
            const file = getFile(files, fileId);
            dispatch(addThumbs(file, newSheetId, frameNumberArrayFromFaceDetection))
              .then(() => {
                sheetsToUpdate.push({
                  fileId,
                  sheetId: newSheetId,
                  status: 'addFaceData',
                  sortMethod: faceSortMethod,
                });
                const sheetCount = getSheetCount(files, fileId);
                const newSheetName = getNewSheetName(sheetCount);
                dispatch(updateSheetName(fileId, newSheetId, newSheetName));
                dispatch(updateSheetCounter(fileId));
                dispatch(updateSheetType(fileId, newSheetId, SHEET_TYPE.FACES));
                dispatch(updateSheetView(fileId, newSheetId, SHEET_VIEW.GRIDVIEW));
                dispatch(
                  updateSheetColumnCount(
                    fileId,
                    newSheetId,
                    Math.ceil(Math.sqrt(frameNumberArrayFromFaceDetection.length)),
                  ),
                );
                dispatch(setCurrentSheetId(newSheetId));
                return undefined;
              })
              .catch(err => {
                log.error(err);
              });
          }
        }
      },
    );

    ipcRenderer.on('finished-getting-thumbs', (event, fileId, sheetId) => {
      const { settings, sheetsByFileId } = this.props;

      // check if this is savingAllMoviePrints
      // if so change its status from gettingThumbs to readyForPrinting
      if (this.state.savingAllMoviePrints && this.state.sheetsToPrint.length > 0) {
        if (
          this.state.sheetsToPrint.findIndex(item => item.fileId === fileId && item.status === 'gettingThumbs') > -1
        ) {
          // log.debug(this.state.sheetsToPrint);
          // state should be immutable, therefor
          const sheetsToPrint = this.state.sheetsToPrint.map(item => {
            if (item.fileId !== fileId) {
              // This isn't the item we care about - keep it as-is
              return item;
            }
            // Otherwise, this is the one we want - return an updated value
            return {
              ...item,
              status: 'readyForPrinting',
            };
          });
          // log.debug(sheetsToPrint);
          this.setState({
            sheetsToPrint,
          });
        }
      }

      // update artificial sceneArray if interval scene
      if (getSheetType(sheetsByFileId, fileId, sheetId, settings) === SHEET_TYPE.INTERVAL) {
        const sceneArray = createSceneArray(sheetsByFileId, fileId, sheetId);
        dispatch(updateSceneArray(fileId, sheetId, sceneArray));
      }
    });

    ipcRenderer.on('clearScenes', (event, fileId, sheetId) => {
      dispatch(clearScenes(fileId, sheetId));
    });

    ipcRenderer.on('received-get-file-scan', (event, fileId, filePath, useRatio, sheetId) => {
      const { files } = this.props;
      const { requestIdleCallbackForScenesHandle } = this.state;
      const file = getFile(files, fileId);

      // cancel pullScenesFromOpencvWorker
      window.cancelIdleCallback(requestIdleCallbackForScenesHandle);
      this.setState({
        requestIdleCallbackForScenesHandle: undefined,
      });
      log.debug('now I cancelIdleCallbackForScenes');

      this.setState({
        fileScanRunning: false,
      });
      dispatch(updateFileScanStatus(fileId, true));
      this.runSceneDetection(fileId, filePath, useRatio, undefined, sheetId, file.transformObject);
    });

    ipcRenderer.on('receive-some-scenes-from-sceneQueue', (event, someScenes) => {
      const { requestIdleCallbackForScenesHandle } = this.state;

      // log.debug(someScenes);
      if (someScenes.length > 0) {
        // add scenes in reveres as they are stored inverse in the queue
        dispatch(addScenesWithoutCapturingThumbs(someScenes.reverse()));
      }

      // schedule the next one until scan is done and requestIdleCallback is cancelled
      if (requestIdleCallbackForScenesHandle !== undefined) {
        const newRequestIdleCallbackHandle = window.requestIdleCallback(this.pullScenesFromOpencvWorker);
        this.setState({
          requestIdleCallbackForScenesHandle: newRequestIdleCallbackHandle,
        });
        log.debug('now I requestIdleCallbackForScenes');
      } else {
        log.debug('requestIdleCallback already cancelled. no new requestIdleCallbackForScenes will be started.');
      }
    });

    ipcRenderer.on('start-requestIdleCallback-for-sceneQueue', event => {
      const { requestIdleCallbackForScenesHandle } = this.state;

      // start requestIdleCallback until it is cancelled
      if (requestIdleCallbackForScenesHandle === undefined) {
        const newRequestIdleCallbackHandle = window.requestIdleCallback(this.pullScenesFromOpencvWorker);
        this.setState({
          requestIdleCallbackForScenesHandle: newRequestIdleCallbackHandle,
        });
        log.debug('now I requestIdleCallbackForScenes');
      } else {
        log.debug('requestIdleCallbackForScenes already running. no new requestIdleCallbackForScenes will be started.');
      }
    });

    ipcRenderer.on('received-saved-file', (event, id, path) => {
      const { settings } = this.props;
      const { defaultOpenFileExplorerAfterSaving } = settings;
      if (this.state.savingMoviePrint) {
        setTimeout(this.setState({ savingMoviePrint: false }), 1000); // adding timeout to prevent clicking multiple times
        // open file explorer if checked
        if (defaultOpenFileExplorerAfterSaving) {
          this.onOpenFileExplorer(path);
        }
      } else if (this.state.savingAllMoviePrints) {
        // check if the sheet which was saved has been printing, then set status to done
        if (this.state.sheetsToPrint.findIndex(item => item.status === 'printing') > -1) {
          // state should be immutable, therefor
          const sheetsToPrint = this.state.sheetsToPrint.map(item => {
            if (item.status !== 'printing') {
              // This isn't the item we care about - keep it as-is
              return item;
            }
            // Otherwise, this is the one we want - return an updated value
            return {
              ...item,
              status: 'done',
            };
          });
          // log.debug(sheetsToPrint);
          this.setState({
            sheetsToPrint,
          });
          // check if all files have been printed, then set savingAllMoviePrints to false
          if (
            this.state.sheetsToPrint.filter(item => item.status === 'done').length ===
            this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length
          ) {
            this.setState({ savingAllMoviePrints: false });

            // open file explorer if checked
            if (defaultOpenFileExplorerAfterSaving) {
              this.onOpenFileExplorer(path);
            }
          }
        }
      }

      log.debug(`Saved file: ${path}`);
    });

    ipcRenderer.on('received-saved-file-error', (event, message) => {
      this.showMessage(message, 5000, 'error');
      setTimeout(this.setState({ savingMoviePrint: false }), 1000); // adding timeout to prevent clicking multiple times
      log.error(`Saved file error: ${message}`);
    });

    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('keyup', this.handleKeyUp);

    this.updatecontainerWidthAndHeight();
    window.addEventListener('resize', this.updatecontainerWidthAndHeight);

    log.debug('App.js reports: componentDidMount');
    log.debug(`Operating system: ${process.platform}-${os.release()}`);
    log.debug(`App version: ${app.getName()}-${app.getVersion()}`);
    log.debug(`Chromium version: ${process.versions.chrome}`);
  }

  componentWillReceiveProps(nextProps) {
    const { currentFileId, currentSheetId, file, settings, sheetsByFileId, visibilitySettings } = this.props;

    const secondsPerRow = getSecondsPerRow(
      nextProps.sheetsByFileId,
      nextProps.currentFileId,
      nextProps.currentSheetId,
      nextProps.settings,
    );

    if (file !== undefined && nextProps.file !== undefined && file.id !== undefined) {
      const columnCount = getColumnCount(
        nextProps.sheetsByFileId,
        nextProps.file.id,
        nextProps.currentSheetId,
        nextProps.settings,
      );

      // check if currentFileId or currentSheetId changed
      if (currentFileId !== nextProps.currentFileId || currentSheetId !== nextProps.currentSheetId) {
        const newThumbCount = getThumbsCount(
          nextProps.sheetsByFileId,
          nextProps.file.id,
          nextProps.currentSheetId,
          nextProps.settings,
          nextProps.visibilitySettings,
        );

        loadSheetPropertiesIntoState(this, columnCount, newThumbCount, secondsPerRow);
        log.debug('currentFileId or currentSheetId changed');
      }

      // check if visibleThumbCount changed
      const oldThumbCount = getThumbsCount(sheetsByFileId, file.id, currentSheetId, settings, visibilitySettings);
      const newThumbCount = getThumbsCount(
        nextProps.sheetsByFileId,
        nextProps.file.id,
        nextProps.currentSheetId,
        nextProps.settings,
        nextProps.visibilitySettings,
      );
      if (oldThumbCount !== newThumbCount) {
        loadSheetPropertiesIntoState(this, columnCount, newThumbCount, secondsPerRow);
        log.debug(`visibleThumbCount changed to ${newThumbCount}`);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // log.debug('App.js componentDidUpdate');
    const { dispatch } = this.props;
    const { filesToLoad, sheetsToPrint, sheetsToUpdate } = this.state;
    const { files, file, settings, sheetsByFileId, visibilitySettings } = this.props;
    const { defaultMoviePrintWidth, defaultPaperAspectRatioInv } = settings;
    const { visibilityFilter } = visibilitySettings;

    if (file !== undefined && getObjectProperty(() => prevProps.file.id) !== file.id) {
      try {
        this.setState({
          opencvVideo: new opencv.VideoCapture(file.path),
        });
      } catch (e) {
        log.error(e);
      }
    }

    if (filesToLoad.length !== 0 && prevState.filesToLoad.length !== filesToLoad.length) {
      ipcRenderer.send(
        'message-from-mainWindow-to-opencvWorkerWindow',
        'send-get-file-details',
        filesToLoad[0].id,
        filesToLoad[0].path,
        filesToLoad[0].posterFrameId,
      );
    }

    // run if there was a change in the sheetsToPrint array
    if (sheetsToPrint.length !== 0 && !isEquivalent(sheetsToPrint, prevState.sheetsToPrint)) {
      const filesToUpdateStatus = [];
      // run if there is a sheet which needsThumbs, but not if there is one already gettingThumbs
      if (
        sheetsToPrint.findIndex(item => item.status === 'gettingThumbs') === -1 &&
        sheetsToPrint.findIndex(item => item.status === 'needsThumbs') > -1
      ) {
        // log.debug(sheetsToPrint);
        const sheetToGetThumbsFor = sheetsToPrint.find(item => item.status === 'needsThumbs');
        // log.debug(sheetToGetThumbsFor);
        const tempFile = getFile(files, sheetToGetThumbsFor.fileId);
        // log.debug(tempFile);

        // check if file could be found within files to cover the following case
        // files who could be added to the filelist, but then could not be read by opencv get removed again from the FileList
        if (tempFile !== undefined) {
          this.getThumbsForFile(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId);
          dispatch(
            updateSheetName(
              sheetToGetThumbsFor.fileId,
              sheetToGetThumbsFor.sheetId,
              getNewSheetName(getSheetCount(files, sheetToGetThumbsFor.fileId)),
            ),
          );
          dispatch(updateSheetCounter(sheetToGetThumbsFor.fileId));
          dispatch(updateSheetType(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, SHEET_TYPE.INTERVAL));
          dispatch(updateSheetView(sheetToGetThumbsFor.fileId, sheetToGetThumbsFor.sheetId, SHEET_VIEW.GRIDVIEW));
          filesToUpdateStatus.push({
            fileId: sheetToGetThumbsFor.fileId,
            sheetId: sheetToGetThumbsFor.sheetId,
            status: 'gettingThumbs',
          });
        } else {
          // status of file which could not be found gets set to undefined
          filesToUpdateStatus.push({
            fileId: sheetToGetThumbsFor.fileId,
            sheetId: sheetToGetThumbsFor.sheetId,
            status: 'undefined',
          });
        }
        // log.debug(filesToUpdateStatus);
      }

      // run if there is a file readyForPrinting, but not if there is one already printing
      if (
        sheetsToPrint.findIndex(item => item.status === 'printing') === -1 &&
        sheetsToPrint.findIndex(item => item.status === 'readyForPrinting') > -1
      ) {
        // log.debug(sheetsToPrint);
        const sheetToPrint = sheetsToPrint.find(item => item.status === 'readyForPrinting');

        // get sheet to print
        const sheet = sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId];

        // define what sheetView to print depending on type
        const { sheetView } = sheet;

        // get file to print
        const tempFile = getFile(files, sheetToPrint.fileId);

        // get scenes to print
        let tempScenes;
        if (
          sheetView === SHEET_VIEW.TIMELINEVIEW &&
          sheetsByFileId[sheetToPrint.fileId] !== undefined &&
          sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId] !== undefined
        ) {
          tempScenes = getVisibleThumbs(
            sheetsByFileId[sheetToPrint.fileId][sheetToPrint.sheetId].sceneArray,
            visibilitySettings.visibilityFilter,
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
          sheetView === SHEET_VIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
          1,
          undefined,
          true,
          tempScenes,
          secondsPerRow,
        );
        // console.log(scaleValueObject);
        const dataToSend = {
          elementId: sheetView !== SHEET_VIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
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
          status: 'printing',
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

    // run if there was a change in the sheetsToUpdate array
    if (sheetsToUpdate.length !== 0) {
      const copyOfSheetsToUpdate = sheetsToUpdate.slice();
      // read the first item
      const {
        fileId: myFileId,
        sheetId: mySheetId,
        sortMethod: mySortMethod = undefined,
        status: myStatus,
      } = copyOfSheetsToUpdate[0];
      const thumbCount = getThumbsCount(sheetsByFileId, myFileId, mySheetId, settings, visibilitySettings, true);
      if (thumbCount !== 0) {
        if (myStatus === 'addFaceData') {
          this.addFaceData(myFileId, mySheetId, mySortMethod);
          // remove the first item
          copyOfSheetsToUpdate.shift();
          this.setState({
            sheetsToUpdate: copyOfSheetsToUpdate,
          });
        }
      }
    }

    // updatecontainerWidthAndHeight checks if the containerWidth or height has changed
    // and if so calls updateScaleValue
    this.updatecontainerWidthAndHeight();

    // update scaleValue when these parameters change
    if (
      (prevProps.file === undefined || this.props.file === undefined
        ? false
        : prevProps.file.width !== this.props.file.width) ||
      (prevProps.file === undefined || this.props.file === undefined
        ? false
        : prevProps.file.height !== this.props.file.height) ||
      prevProps.settings.defaultThumbnailScale !== this.props.settings.defaultThumbnailScale ||
      prevProps.settings.defaultMoviePrintWidth !== this.props.settings.defaultMoviePrintWidth ||
      prevProps.settings.defaultMarginRatio !== this.props.settings.defaultMarginRatio ||
      prevProps.settings.defaultTimelineViewSecondsPerRow !== this.props.settings.defaultTimelineViewSecondsPerRow ||
      prevProps.settings.defaultTimelineViewMinDisplaySceneLengthInFrames !==
        this.props.settings.defaultTimelineViewMinDisplaySceneLengthInFrames ||
      prevProps.settings.defaultTimelineViewWidthScale !== this.props.settings.defaultTimelineViewWidthScale ||
      (prevProps.scenes ? prevProps.scenes.length !== this.props.scenes.length : false) ||
      prevProps.settings.defaultShowHeader !== this.props.settings.defaultShowHeader ||
      prevProps.settings.defaultShowPathInHeader !== this.props.settings.defaultShowPathInHeader ||
      prevProps.settings.defaultShowDetailsInHeader !== this.props.settings.defaultShowDetailsInHeader ||
      prevProps.settings.defaultShowTimelineInHeader !== this.props.settings.defaultShowTimelineInHeader ||
      prevProps.settings.defaultRoundedCorners !== this.props.settings.defaultRoundedCorners ||
      prevProps.settings.defaultShowPaperPreview !== this.props.settings.defaultShowPaperPreview ||
      prevProps.settings.defaultPaperAspectRatioInv !== this.props.settings.defaultPaperAspectRatioInv ||
      prevState.zoom !== this.state.zoom ||
      prevProps.visibilitySettings.defaultView !== this.props.visibilitySettings.defaultView ||
      prevProps.visibilitySettings.defaultSheetView !== this.props.visibilitySettings.defaultSheetView ||
      prevProps.visibilitySettings.defaultSheetFit !== this.props.visibilitySettings.defaultSheetFit ||
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

    // replace all frames for this fileId -> fileIdToBeRecaptured
    if (
      this.state.fileIdToBeRecaptured !== undefined &&
      prevState.fileIdToBeRecaptured !== this.state.fileIdToBeRecaptured
    ) {
      ipcRenderer.send(
        'message-from-mainWindow-to-opencvWorkerWindow',
        'recapture-frames',
        files,
        sheetsByFileId,
        settings.defaultCachedFramesSize,
        this.state.fileIdToBeRecaptured,
      );
      this.setState({
        fileIdToBeRecaptured: undefined,
      });
    }

    // capture all frames for this fileId -> fileIdToBeCaptured
    if (this.state.fileIdToBeCaptured !== undefined && prevState.fileIdToBeCaptured !== this.state.fileIdToBeCaptured) {
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
      });
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('keyup', this.handleKeyUp);

    window.removeEventListener('resize', this.updatecontainerWidthAndHeight);

    // close the database connection
    moviePrintDB.close(err => {
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
      const { dispatch } = this.props;
      const { currentFileId, currentSheetId, file, settings, sheetsByFileId, visibilitySettings } = this.props;
      const sheetType = getSheetType(sheetsByFileId, currentFileId, currentSheetId, settings);

      if (event) {
        switch (event.which) {
          case 32: // press 'space bar'
            if (visibilitySettings.defaultView === VIEW.PLAYERVIEW && sheetType === SHEET_TYPE.SCENES) {
              this.setOrToggleDefaultSheetView();
            }
            break;
          case 49: // press 1
            this.toggleMovielist();
            break;
          case 50: // press 2
            if (visibilitySettings.defaultView === VIEW.STANDARDVIEW) {
              this.onSetViewClick(VIEW.PLAYERVIEW);
            } else {
              this.onSetViewClick(VIEW.STANDARDVIEW);
            }
            break;
          case 51: // press 3
            if (visibilitySettings.showSettings) {
              this.onCancelClick();
            } else {
              this.showSettings();
            }
            break;
          case 52: // press '4'
            break;
          case 53: // press '5'
            this.onSortSheet(SORT_METHOD.FACECONFIDENCE);
            break;
          case 54: // press '6'
            this.onSortSheet(SORT_METHOD.FACEOCCURRENCE);
            break;
          case 55: // press '7'
            this.onSortSheet(SORT_METHOD.UNIQUE);
            break;
          case 56: // press '8'
            break;
          case 65: // press 'a'
            this.openMoviesDialog();
            break;
          case 67: // press 'c' - Careful!!! might also be triggered when doing reset application Shift+Alt+Command+C
            // this.recaptureAllFrames();
            break;
          case 68: // press 'd'
            break;
          case 69: // press 'e'
            break;
          case 70: // press 'f'
            if (currentFileId) {
              this.onToggleDetectionChart();
            }
            break;
          case 71: // press 'g'
            this.toggleSheetView(currentFileId, currentSheetId);
            break;
          case 77: // press 'm'
            this.onSaveMoviePrint();
            break;
          case 80: // press 'p'
            break;
          case 81: // press 'q'
            // // display toast and set toastId to fileId
            // toast(({ closeToast }) => (
            //   <div>
            //       This is a test toast
            //       <Button
            //         compact
            //         floated='right'
            //         content='Cancel'
            //         onClick={() => {
            //           closeToast();
            //         }}
            //       />
            //   </div>
            // ), {
            //   className: `${stylesPop.toast} ${stylesPop.toastInfo}`,
            //   hideProgressBar: false,
            //   autoClose: 100000,
            //   closeButton: false,
            //   closeOnClick: false,
            // });
            break;
          case 83: // press 's'
            if (currentFileId) {
              this.runSceneDetection(file.id, file.path, file.useRatio, undefined, undefined, file.transformObject);
            }
            break;
          default:
        }
        this.setState({
          keyObject: {
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            which: event.which,
          },
        });
      }
    }
  }

  showMessage(message, time, status = 'info') {
    toast(message, {
      className: `${stylesPop.toast} ${status === 'info' ? stylesPop.toastInfo : ''}  ${
        status === 'error' ? stylesPop.toastError : ''
      }  ${status === 'success' ? stylesPop.toastSuccess : ''}`,
      autoClose: time,
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
      settings.defaultCachedFramesSize,
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
          which: undefined,
        },
      });
    }
  }

  onDragEnter() {
    this.setState({
      dropzoneActive: true,
    });
  }

  onDragLeave() {
    this.setState({
      dropzoneActive: false,
    });
  }

  onDrop(droppedFiles) {
    const { dispatch, files } = this.props;

    // when user presses alt key on drop then clear list and add movies
    const clearList = this.state.keyObject.altKey;
    this.setState({
      dropzoneActive: false,
      loadingFirstFile: true,
    });
    log.debug('Files where dropped');
    log.debug(droppedFiles);
    // file match needs to be in sync with addMoviesToList() and accept !!!
    if (Array.from(droppedFiles).some(file => file.type.match('video.*') || file.name.match(/.divx|.mkv|.ogg|.VOB/i))) {
      dispatch(setDefaultSheetView(SHEET_VIEW.GRIDVIEW));
      dispatch(addMoviesToList(droppedFiles, clearList))
        .then(response => {
          // add a property to first movie indicating that it should be displayed when ready
          response[0].displayMe = true;

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
            dispatch(showMovielist());
          }
          return response;
        })
        .catch(error => {
          log.error(error);
        });
    }
    return false;
  }

  checkForUpdates() {
    // check for updates
    this.setState({
      isCheckingForUpdates: true,
    });
    let latestVersion = null;
    const { platform } = process;
    axios
      .get(URL_REST_API_CHECK_FOR_UPDATES, {
        timeout: 30000,
      })
      .then(response => {
        log.debug(response.data.acf);
        if (platform === 'darwin') {
          latestVersion = response.data.acf.mac_version_number;
        } else if (platform === 'win32') {
          latestVersion = response.data.acf.windows_version_number;
        }
        const thisVersion = app.getVersion();
        const updateAvailable = compareVersions(latestVersion, thisVersion);
        log.debug(
          `this version: ${thisVersion}, latest version: ${latestVersion}, update available: ${updateAvailable}`,
        );
        if (updateAvailable > 0) {
          toast(
            ({ closeToast }) => (
              <div>
                An update is available: {latestVersion} <br />
                Your version is: {thisVersion} <br />
                <br />
                <Button
                  compact
                  fluid
                  content="See what's new"
                  onClick={() => {
                    shell.openExternal(URL_CHANGE_LOG);
                    closeToast();
                  }}
                />
              </div>
            ),
            {
              className: `${stylesPop.toast} ${stylesPop.toastSuccess}`,
              autoClose: false,
            },
          );
        } else {
          this.showMessage(`Your version is up to date: ${thisVersion}`, 3000, 'info');
        }

        this.setState({
          isCheckingForUpdates: undefined,
        });

        return undefined;
      })
      .catch(error => {
        this.showMessage(
          `There has been an error while checking for updates:
        ${error}`,
          3000,
          'error',
        );
        log.error(error);

        this.setState({
          isCheckingForUpdates: undefined,
        });
      });
  }

  applyMimeTypes(event) {
    this.setState({
      accept: event.target.value,
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
    this.setState({
      scaleValueObject,
    });
  }

  updatecontainerWidthAndHeight() {
    // wrapped in try catch as in a global error case this.siteContent ref is not set
    try {
      // set default values for clientWidth and clientHeight
      // as on start up this.siteContent ref is not set yet
      const { clientWidth = 1366, clientHeight = 768 } = this.siteContent;
      const { file, visibilitySettings } = this.props;
      const { containerHeight, containerWidth } = this.state;
      const containerWidthInner =
        clientWidth -
        (visibilitySettings.showMovielist ? 350 : 0) -
        (visibilitySettings.showSettings ? 350 : 0) -
        (file ? 0 : 300); // for startup
      const containerHeightInner = clientHeight - (file ? 0 : 100); // for startup
      if (
        Math.abs(containerHeight - containerHeightInner) > 10 ||
        Math.abs(containerWidth - containerWidthInner) > 10
      ) {
        log.debug(`new container size: ${containerWidthInner}x${containerHeightInner}`);
        this.setState(
          {
            containerHeight: containerHeightInner,
            containerWidth: containerWidthInner,
          },
          () => this.updateScaleValue(),
        );
      }
      return true;
    } catch (e) {
      log.error(e);
      return undefined;
    }
  }

  onDeselectThumbMethod() {
    this.setState({
      selectedThumbsArray: [],
    });
  }

  onSelectThumbMethod(thumbId, frameNumber = undefined) {
    this.setState({
      selectedThumbsArray: [
        {
          thumbId,
        },
      ],
      jumpToFrameNumber: frameNumber,
    });
  }

  showMovielist() {
    const { dispatch } = this.props;
    dispatch(showMovielist());
  }

  hideMovielist() {
    const { dispatch } = this.props;
    dispatch(hideMovielist());
  }

  toggleMovielist() {
    if (this.props.visibilitySettings.showMovielist) {
      this.hideMovielist();
    } else {
      this.showMovielist();
    }
  }

  showSettings() {
    const { dispatch } = this.props;
    const { currentFileId, currentSheetId, file, settings, sheetsByFileId, visibilitySettings } = this.props;
    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    dispatch(showSettings());

    loadSheetPropertiesIntoState(
      this,
      getColumnCount(sheetsByFileId, currentFileId, currentSheetId, settings),
      getThumbsCount(sheetsByFileId, currentFileId, currentSheetId, settings, visibilitySettings),
      secondsPerRow,
    );
    this.disableZoom();
  }

  hideSettings() {
    const { dispatch } = this.props;
    dispatch(hideSettings());
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
    const { dispatch } = this.props;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
      dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  }

  onHideDetectionChart() {
    this.setState({
      showChart: false,
    });
  }

  onToggleDetectionChart() {
    this.setState({
      showChart: !this.state.showChart,
    });
  }

  onSortSheet(sortMethod, reverseSortOrder, fileId = undefined, sheetId = undefined) {
    const { currentFileId, currentSheetId, dispatch, settings, sheetsByFileId, visibilitySettings } = this.props;

    const theFileId = fileId || currentFileId;
    const theSheetId = sheetId || currentSheetId;
    const { thumbsArray } = sheetsByFileId[theFileId][theSheetId];
    const sheetType = getSheetType(sheetsByFileId, currentFileId, currentSheetId, settings);
    const isFaceType = sheetType === SHEET_TYPE.FACES;

    // get visible thumbs and only request faces scan data for them
    const visibleThumbs = getVisibleThumbs(thumbsArray, visibilitySettings.visibilityFilter);

    let baseArray = visibleThumbs;
    let sortedThumbsArray;

    if (sortMethod !== SORT_METHOD.REVERSE) {
      if (isFaceType) {
        const visibleThumbsFrameNumbers = visibleThumbs.map(thumb => thumb.frameNumber);
        baseArray = getFaceScanByFileId(theFileId, visibleThumbsFrameNumbers);
        // console.log(faceScanArray);
      }

      const sortOrderArray = sortArray(baseArray, sortMethod, reverseSortOrder);

      // sort thumbs array
      sortedThumbsArray = sortThumbsArray(thumbsArray, sortOrderArray);

      // update the thumb order
      dispatch(updateOrder(theFileId, theSheetId, sortedThumbsArray));

      // hide other thumbs as filtering could happen
      const frameNumberArray = sortOrderArray.map(item => item.frameNumber);
      dispatch(showThumbsByFrameNumberArray(theFileId, theSheetId, frameNumberArray));
    } else {
      sortedThumbsArray = baseArray.slice().reverse();

      // update the thumb order
      dispatch(updateOrder(theFileId, theSheetId, sortedThumbsArray));
    }
  }

  addFaceData(fileId, sheetId, sortMethod = undefined) {
    const { dispatch, sheetsByFileId, visibilitySettings } = this.props;

    const arrayOfFrameNumbers = getFramenumbersOfSheet(sheetsByFileId, fileId, sheetId, visibilitySettings);
    console.log(arrayOfFrameNumbers);
    const faceScanArray = getFaceScanByFileId(fileId, arrayOfFrameNumbers);
    console.log(faceScanArray);
    // add detection information to thumbs
    dispatch(changeAndSortThumbArray(fileId, sheetId, faceScanArray, sortMethod));
    // this.onSortSheet(fileId, sheetId, sortMethod);
  }

  pullObjectUrlFromIndexedDBWorkerWindow(deadline) {
    // it pulls objectUrls from worker_indexedDB objectUrlQueue during idle time
    log.debug('now I am not busy - requestIdleCallbackForObjectUrl');
    ipcRenderer.send(
      'message-from-mainWindow-to-indexedDBWorkerWindow',
      'get-some-objectUrls-from-objectUrlQueue',
      100, // amount
    );
  }

  runSceneDetection(
    fileId,
    filePath,
    useRatio,
    threshold = this.props.settings.defaultSceneDetectionThreshold,
    sheetId = uuidV4(),
    transformObject = undefined,
  ) {
    const { dispatch } = this.props;
    const { settings } = this.props;
    const { defaultShotDetectionMethod = SHOT_DETECTION_METHOD.MEAN } = settings;
    const { fileScanRunning } = this.state;
    const timeBeforeGetFrameScanByFileId = Date.now();
    const arrayOfFrameScanData = getFrameScanByFileId(fileId);

    const timeAfterGetFrameScanByFileId = Date.now();
    log.debug(`getFrameScanByFileId duration: ${timeAfterGetFrameScanByFileId - timeBeforeGetFrameScanByFileId}`);

    // only start creating a sheet if there is already scanned data or
    // there is no fileScanRunning
    if (arrayOfFrameScanData.length !== 0 || fileScanRunning === false) {
      this.onHideDetectionChart();
      dispatch(setDefaultSheetView(SHEET_VIEW.TIMELINEVIEW));
      dispatch(setCurrentSheetId(sheetId));
      dispatch(updateSheetType(fileId, sheetId, SHEET_TYPE.SCENES));
      dispatch(updateSheetView(fileId, sheetId, SHEET_VIEW.TIMELINEVIEW));
      // get meanArray if it is stored else return false
      // console.log(arrayOfFrameScanData);
      // if meanArray not stored, runFileScan
      if (arrayOfFrameScanData.length === 0) {
        this.setState({ fileScanRunning: true });
        // display toast and set toastId to fileId
        toast(
          ({ closeToast }) => (
            <div>
              Shot detection in progress
              <Button
                compact
                floated="right"
                content="Cancel"
                onClick={() => {
                  this.cancelFileScan(fileId);
                  closeToast();
                }}
              />
            </div>
          ),
          {
            toastId: fileId,
            className: `${stylesPop.toast} ${stylesPop.toastInfo}`,
            hideProgressBar: false,
            autoClose: false,
            closeButton: false,
            closeOnClick: false,
          },
        );
        ipcRenderer.send(
          'message-from-mainWindow-to-opencvWorkerWindow',
          'send-get-file-scan',
          fileId,
          filePath,
          useRatio,
          threshold,
          sheetId,
          transformObject,
          defaultShotDetectionMethod,
        );
      } else {
        // console.log(meanColorArray);
        this.calculateSceneList(fileId, arrayOfFrameScanData, threshold, sheetId);
      }
    } else {
      this.showMessage('Sorry, only one shot detection at a time.', 3000, 'error');
    }

    return true;
  }

  pullScenesFromOpencvWorker(deadline) {
    // this is used to show a scene detection preview
    // it pulls scenes from worker_opencv sceneQueue during idle time
    log.debug('now I am not busy - requestIdleCallbackForScenes');
    ipcRenderer.send(
      'message-from-mainWindow-to-opencvWorkerWindow',
      'get-some-scenes-from-sceneQueue',
      10, // amount
    );
  }

  calculateSceneList(
    fileId,
    arrayOfFrameScanData,
    threshold = this.props.settings.defaultSceneDetectionThreshold,
    sheetId,
  ) {
    const { dispatch } = this.props;
    const { files, settings } = this.props;

    // check if frameScanData is complete
    const frameCount = getFrameCount(files, fileId);
    const frameScanDataLength = getFrameScanCount(fileId);
    console.log(getFrameScanCount(fileId));
    if (frameScanDataLength / frameCount < 0.9) {
      // consider less than 90% as incomplete
      // frameScanData is not complete
      // arrayOfFrameScanData will be repaired in place
      log.error(`frameScanData is not complete: ${frameCount}:${frameScanDataLength}`);
      repairFrameScanData(arrayOfFrameScanData, frameCount);
    }

    const differenceValueArray = arrayOfFrameScanData.map(frame => frame.differenceValue);
    const meanColorArray = arrayOfFrameScanData.map(frame => JSON.parse(frame.meanColor));

    // calculate threshold with kmeans
    // convert differenceValueArray into histogram
    const matFromArray = new opencv.Mat([differenceValueArray], opencv.CV_8UC1);
    const vHist = opencv
      .calcHist(matFromArray, [
        {
          channel: 0,
          bins: 256,
          ranges: [0, 256],
        },
      ])
      .convertTo(opencv.CV_32F);

    // convert histogram to array of points
    const histAsArray = vHist.getDataAsArray();
    const points2 = histAsArray.map(([x], index) => new opencv.Point(index, x));

    // run kmeans
    const { labels: kmeansLabels, centers } = opencv.kmeans(
      points2,
      3, // k
      new opencv.TermCriteria(opencv.termCriteria.EPS || opencv.termCriteria.MAX_ITER, 10, 0.1), // termCriteria
      5, // attempts
      opencv.KMEANS_RANDOM_CENTERS, // flags
    );

    // get mainCenter
    const centersYArray = centers.map(center => center.y);
    // get index of max value
    const mainCenterIndex = centersYArray.indexOf(Math.max(...centersYArray));
    // double to get boundary + 1 to compensate for starting with 0
    const calcThreshold = Math.round(centers[mainCenterIndex].x) * 2 + 1;
    console.log(calcThreshold);

    const sceneList = calculateSceneListFromDifferenceArray(fileId, differenceValueArray, meanColorArray, threshold);
    console.log(sceneList.map(shot => shot.start));

    const labels = [...Array(differenceValueArray.length).keys()].map(x => String(x));
    const thresholdLine = [
      {
        x: String(0),
        y: String(threshold),
      },
      {
        x: String(differenceValueArray.length - 1),
        y: String(threshold),
      },
    ];
    const calcThresholdLine = [
      {
        x: String(0),
        y: String(calcThreshold),
      },
      {
        x: String(differenceValueArray.length - 1),
        y: String(calcThreshold),
      },
    ];
    const newChartData = {
      labels,
      datasets: [
        {
          label: 'Difference',
          backgroundColor: 'rgb(255, 80, 6)',
          pointRadius: 2,
          data: differenceValueArray,
        },
        {
          label: 'Threshold',
          borderColor: 'rgba(255, 0, 0, 1)',
          borderWidth: 1,
          pointRadius: 0,
          data: thresholdLine,
        },
        {
          label: 'Calculated Threshold',
          borderColor: 'rgba(0, 255, 0, 1)',
          borderWidth: 1,
          pointRadius: 0,
          data: calcThresholdLine,
        },
      ],
    };
    this.setState({
      chartData: newChartData,
    });

    // dispatch(clearScenes(fileId, sheetId));

    // check if scenes detected
    if (sceneList.length !== 0) {
      const tempFile = getFile(files, fileId);
      const clearOldScenes = true;
      dispatch(updateSheetType(tempFile.id, sheetId, SHEET_TYPE.SCENES));
      dispatch(updateSheetView(tempFile.id, sheetId, SHEET_VIEW.TIMELINEVIEW));
      dispatch(updateSheetName(tempFile.id, sheetId, getNewSheetName(getSheetCount(files, tempFile.id))));
      dispatch(updateSheetCounter(tempFile.id));
      dispatch(setCurrentSheetId(sheetId));
      dispatch(updateSheetColumnCount(tempFile.id, sheetId, Math.ceil(Math.sqrt(sceneList.length))));
      dispatch(setDefaultSheetView(SHEET_VIEW.TIMELINEVIEW));
      dispatch(addScenesFromSceneList(tempFile, sceneList, clearOldScenes, settings.defaultCachedFramesSize, sheetId));
    } else {
      this.showMessage('No scenes detected', 3000);
    }
  }

  cancelFileScan(fileId) {
    const { requestIdleCallbackForScenesHandle } = this.state;

    console.error(`Cancel file scan for: ${fileId}`);

    // cancel pullScenesFromOpencvWorker
    window.cancelIdleCallback(requestIdleCallbackForScenesHandle);
    this.setState({
      requestIdleCallbackForScenesHandle: undefined,
    });
    log.debug('now I cancelIdleCallback');

    ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'cancelFileScan', fileId);

    this.setState({
      fileScanRunning: false,
    });
    toast.update(fileId, {
      className: `${stylesPop.toast} ${stylesPop.toastError}`,
      // hideProgressBar: false,
      render: 'Detection was cancelled !',
      autoClose: 3000,
      closeButton: true,
      closeOnClick: true,
    });
    // toast.error("Shot detection was cancelled !", {
    //   toastId: `${fileId}-fileScanCancelled`,
    //   autoClose: 3000,
    // });
  }

  onScrubClick(file, scrubThumb, scrubWindowTriggerTime) {
    const { dispatch } = this.props;
    const { allScenes, thumbs } = this.props;

    dispatch(hideMovielist());
    dispatch(hideSettings());

    let scrubScene;
    if (allScenes !== undefined) {
      scrubScene = allScenes.find(scene => scene.sceneId === scrubThumb.thumbId);
    }

    const { thumbLeft: scrubThumbLeft, thumbRight: scrubThumbRight } = getLeftAndRightThumb(thumbs, scrubThumb.thumbId);

    this.setState({
      showScrubWindow: true,
      scrubWindowTriggerTime,
      scrubThumb,
      scrubScene,
      scrubThumbLeft,
      scrubThumbRight,
    });
  }

  onExpandClick(file, sceneOrThumbId, parentSheetId, isFaceType = false) {
    const { dispatch } = this.props;
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
      dispatch(updateSceneArray(file.id, parentSheetId, sceneArray));
    }
    // console.log(sceneArray);

    // get sceneArray
    const sceneIndex = sceneArray.findIndex(item => item.sceneId === sceneOrThumbId);
    const sheetId = sceneOrThumbId;
    // console.log(sheetId);

    // create new sheet if it does not already exist
    if (sheetsArray.findIndex(item => item === sheetId) === -1) {
      if (isFaceType) {
        // get faceId
        const faceIdOfThumb = getFaceIdOfThumb(sheetsByFileId, file.id, parentSheetId, sceneOrThumbId);
        console.log(faceIdOfThumb);
        // get frameNumbers of occurrences of faceId
        const detectionArray = getFaceScanByFileId(file.id);
        const frameNumberArray = getFrameNumberArrayOfOccurrences(detectionArray, faceIdOfThumb);

        // get thumbs
        dispatch(addNewThumbsWithOrder(file, sheetId, frameNumberArray, settings.defaultCachedFramesSize));

        dispatch(updateSheetName(file.id, sheetId, `Occurrences of #${faceIdOfThumb}`)); // set name on file
        // dispatch(updateSheetCounter(file.id));
        dispatch(updateSheetType(file.id, sheetId, SHEET_TYPE.FACES));
      } else {
        // log.debug(`addIntervalSheet as no thumbs were found for: ${file.name}`);
        dispatch(
          addIntervalSheet(
            file,
            sheetId,
            DEFAULT_THUMB_COUNT, // use constant value instead of defaultThumbCount
            sceneArray[sceneIndex].start,
            sceneArray[sceneIndex].start + sceneArray[sceneIndex].length - 1,
            settings.defaultCachedFramesSize,
            true, // limitToRange -> do not get more thumbs then between in and out available
          ),
        );
        dispatch(updateSheetName(file.id, sheetId, getNewSheetName(getSheetCount(files, file.id)))); // set name on file
        dispatch(updateSheetCounter(file.id));
        dispatch(updateSheetType(file.id, sheetId, SHEET_TYPE.INTERVAL));
      }
      dispatch(updateSheetParent(file.id, sheetId, parentSheetId));
    }
    dispatch(updateSheetView(file.id, sheetId, SHEET_VIEW.GRIDVIEW));
    dispatch(setCurrentSheetId(sheetId));
  }

  onAddThumbClick(file, existingThumb, insertWhere) {
    const { dispatch } = this.props;
    // get thumb left and right of existingThumb
    const indexOfAllThumbs = this.props.allThumbs.findIndex(thumb => thumb.thumbId === existingThumb.thumbId);
    const indexOfVisibleThumbs = this.props.thumbs.findIndex(thumb => thumb.thumbId === existingThumb.thumbId);
    const existingThumbFrameNumber = existingThumb.frameNumber;
    const leftThumbFrameNumber = this.props.thumbs[Math.max(0, indexOfVisibleThumbs - 1)].frameNumber;
    const rightThumbFrameNumber = this.props.thumbs[Math.min(this.props.thumbs.length - 1, indexOfVisibleThumbs + 1)]
      .frameNumber;
    const newFrameNumberAfter = limitFrameNumberWithinMovieRange(
      file,
      existingThumbFrameNumber + Math.round((rightThumbFrameNumber - existingThumbFrameNumber) / 2),
    );
    const newFrameNumberBefore = limitFrameNumberWithinMovieRange(
      file,
      leftThumbFrameNumber + Math.round((existingThumbFrameNumber - leftThumbFrameNumber) / 2),
    );

    const newThumbId = uuidV4();
    if (insertWhere === 'after') {
      dispatch(
        addThumb(
          this.props.file,
          this.props.settings.currentSheetId,
          newFrameNumberAfter,
          indexOfAllThumbs + 1,
          newThumbId,
          this.props.settings.defaultCachedFramesSize,
        ),
      );
    } else if (insertWhere === 'before') {
      // if shiftKey
      dispatch(
        addThumb(
          this.props.file,
          this.props.settings.currentSheetId,
          newFrameNumberBefore,
          indexOfAllThumbs,
          newThumbId,
          this.props.settings.defaultCachedFramesSize,
        ),
      );
    }
  }

  onJumpToCutThumbClick(file, thumbId, otherSceneIs) {
    const { currentSheetId } = this.props;
    this.onChangeSheetViewClick(file.id, currentSheetId, SHEET_VIEW.TIMELINEVIEW);
    this.onJumpToCutSceneClick(file, thumbId, otherSceneIs);
  }

  onJumpToCutSceneClick(file, thumbId, otherSceneIs) {
    const { dispatch } = this.props;
    const { allScenes, currentSheetId, sheetsByFileId, visibilitySettings } = this.props;

    dispatch(setView(VIEW.PLAYERVIEW));

    // get all scenes
    let otherScene;
    let cutFrameNumber;
    const selectedThumbsArray = [];
    const clickedScene = allScenes.find(scene => scene.sceneId === thumbId);
    const indexOfVisibleScenes = allScenes.findIndex(scene => scene.sceneId === thumbId);

    // get scene before or after
    if (otherSceneIs === 'after') {
      // only set if before last scene
      if (indexOfVisibleScenes < allScenes.length - 1) {
        otherScene = allScenes[indexOfVisibleScenes + 1];
        cutFrameNumber = otherScene.start;
        selectedThumbsArray.push({
          thumbId: otherScene.sceneId,
        });
      }
    } else if (otherSceneIs === 'before') {
      // only set if after first scene
      if (indexOfVisibleScenes > 0) {
        cutFrameNumber = clickedScene.start;
        selectedThumbsArray.push({
          thumbId: clickedScene.sceneId,
        });
      }
    }
    this.setState({
      selectedThumbsArray,
      jumpToFrameNumber: cutFrameNumber,
    });
  }

  onCutSceneClick(frameToCut) {
    const { dispatch } = this.props;
    const { allScenes, currentSheetId, file, thumbs } = this.props;

    const scene = getSceneFromFrameNumber(allScenes, frameToCut);

    // only cut if there isn't already a cut
    if (frameToCut !== scene.start) {
      dispatch(cutScene(thumbs, allScenes, file, currentSheetId, scene, frameToCut));
    } else {
      const message = 'There is already a cut';
      log.debug(message);
      this.showMessage(message, 3000);
    }
  }

  onMergeSceneClick(frameToCut) {
    const { dispatch } = this.props;
    const { allScenes, currentSheetId, file, thumbs } = this.props;

    const adjacentSceneIndicesArray = getAdjacentSceneIndicesFromCut(allScenes, frameToCut);
    // console.log(adjacentSceneIndicesArray);
    if (adjacentSceneIndicesArray.length === 2) {
      dispatch(mergeScenes(thumbs, allScenes, file, currentSheetId, adjacentSceneIndicesArray));
    }
    const firstSceneId = allScenes[adjacentSceneIndicesArray[0]].sceneId;
    // console.log(firstSceneId);
    this.onSelectThumbMethod(firstSceneId); // select first scene
  }

  onScrubWindowMouseOver(e, sheetType) {
    const { file } = this.props;
    const { state } = this;

    if (e.clientY < MENU_HEADER_HEIGHT + state.containerHeight) {
      // const { sheetsByFileId, settings } = this.props;
      // // if sheet type interval then create 'artificial' scene Array
      // const sheetType = getSheetType(sheetsByFileId, fileId, sheetId, settings);

      let scrubFrameNumber;
      if (sheetType === SHEET_TYPE.INTERVAL) {
        scrubFrameNumber = getScrubFrameNumber(
          e.clientX,
          state.keyObject,
          state.scaleValueObject,
          file.frameCount,
          state.scrubThumb,
          state.scrubThumbLeft,
          state.scrubThumbRight,
        );
      } else {
        scrubFrameNumber = getSceneScrubFrameNumber(
          e.clientX,
          state.scaleValueObject,
          state.scrubThumb,
          state.scrubScene,
        );
      }
      this.updateOpencvVideoCanvas(scrubFrameNumber);
    } else {
      this.setState({
        showScrubWindow: false,
      });
    }
  }

  onScrubWindowClick(e, sheetType) {
    const { dispatch } = this.props;
    const { file, settings, thumbs } = this.props;
    const { state } = this;

    if (e.clientY < MENU_HEADER_HEIGHT + state.containerHeight) {
      let scrubFrameNumber;
      if (sheetType === SHEET_TYPE.SCENES) {
        scrubFrameNumber = getSceneScrubFrameNumber(
          e.clientX,
          state.scaleValueObject,
          state.scrubThumb,
          state.scrubScene,
        );
        this.onChangeThumb(
          file,
          settings.currentSheetId,
          state.scrubThumb.thumbId,
          scrubFrameNumber,
          settings.defaultCachedFramesSize,
        );
      } else {
        scrubFrameNumber = getScrubFrameNumber(
          e.clientX,
          state.keyObject,
          state.scaleValueObject,
          file.frameCount,
          state.scrubThumb,
          state.scrubThumbLeft,
          state.scrubThumbRight,
        );
        if (state.keyObject.altKey || state.keyObject.shiftKey) {
          const newThumbId = uuidV4();
          if (state.keyObject.altKey) {
            dispatch(
              addThumb(
                file,
                settings.currentSheetId,
                scrubFrameNumber,
                thumbs.find(thumb => thumb.thumbId === state.scrubThumb.thumbId).index + 1,
                newThumbId,
                settings.defaultCachedFramesSize,
              ),
            );
          } else {
            // if shiftKey
            dispatch(
              addThumb(
                file,
                settings.currentSheetId,
                scrubFrameNumber,
                thumbs.find(thumb => thumb.thumbId === state.scrubThumb.thumbId).index,
                newThumbId,
                settings.defaultCachedFramesSize,
              ),
            );
          }
        } else {
          // if normal set new thumb
          this.onChangeThumb(
            file,
            settings.currentSheetId,
            state.scrubThumb.thumbId,
            scrubFrameNumber,
            settings.defaultCachedFramesSize,
          );
        }
      }
    }
    this.setState({
      showScrubWindow: false,
      scrubWindowTriggerTime: undefined,
    });
  }

  onChangeThumb(file, sheetId, thumbId, frameNumber, defaultCachedFramesSize) {
    const { dispatch } = this.props;
    dispatch(changeThumb(sheetId, file, thumbId, frameNumber, defaultCachedFramesSize));
  }

  onAddThumb(file, sheetId, newThumbId, frameNumber, index, defaultCachedFramesSize) {
    const { dispatch } = this.props;
    dispatch(addThumb(file, sheetId, frameNumber, index, newThumbId, defaultCachedFramesSize));
  }

  onViewToggle() {
    const { dispatch } = this.props;
    if (this.props.visibilitySettings.defaultView === VIEW.STANDARDVIEW) {
      this.hideSettings();
      this.hideMovielist();
      dispatch(setView(VIEW.PLAYERVIEW));
    } else {
      dispatch(setView(VIEW.STANDARDVIEW));
    }
  }

  onSaveMoviePrint() {
    const { file, settings, scenes, sheetsByFileId, visibilitySettings } = this.props;
    const { currentFileId, currentSheetId, defaultMoviePrintWidth, defaultPaperAspectRatioInv } = settings;
    const { visibilityFilter } = visibilitySettings;

    const sheet = sheetsByFileId[file.id][currentSheetId];
    const sheetView = getSheetView(sheetsByFileId, currentFileId, currentSheetId, visibilitySettings);
    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);

    const scaleValueObject = getScaleValueObject(
      file,
      settings,
      visibilitySettings,
      getColumnCount(sheetsByFileId, file.id, currentSheetId, settings),
      file.thumbCount,
      defaultMoviePrintWidth,
      sheetView === SHEET_VIEW.TIMELINEVIEW ? defaultMoviePrintWidth * defaultPaperAspectRatioInv : undefined,
      1,
      undefined,
      true,
      sheetView !== SHEET_VIEW.TIMELINEVIEW ? undefined : scenes,
      secondsPerRow,
    );

    const dataToSend = {
      // scale: 1,
      elementId: sheetView !== SHEET_VIEW.TIMELINEVIEW ? 'ThumbGrid' : 'SceneGrid',
      file,
      sheetId: currentSheetId,
      moviePrintWidth: defaultMoviePrintWidth,
      settings,
      sheet,
      visibilityFilter,
      scaleValueObject,
      scenes: sheetView !== SHEET_VIEW.TIMELINEVIEW ? undefined : scenes,
      secondsPerRow,
    };
    // log.debug(dataToSend);
    this.setState({ savingMoviePrint: true }, ipcRenderer.send('request-save-MoviePrint', dataToSend));
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
      if (
        sheetsByFileId[sheet.fileId] === undefined ||
        sheetsByFileId[sheet.fileId][sheet.sheetId] === undefined ||
        sheetsByFileId[sheet.fileId][sheet.sheetId].thumbsArray === undefined
      ) {
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
    });
    this.setState({
      sheetsToPrint,
      savingAllMoviePrints: true,
    });
  }

  onAddIntervalSheet(sheetsByFileId, fileId, settings, thumbCount = undefined, columnCount = undefined) {
    const { dispatch } = this.props;
    const { files } = this.props;

    const newSheetId = uuidV4();
    // set columnCount as it is not defined yet
    this.getThumbsForFile(fileId, newSheetId, thumbCount);
    const newColumnCount = columnCount || getColumnCount(sheetsByFileId, fileId, newSheetId, settings);
    dispatch(updateSheetColumnCount(fileId, newSheetId, newColumnCount));
    dispatch(updateSheetName(fileId, newSheetId, getNewSheetName(getSheetCount(files, fileId))));
    dispatch(updateSheetCounter(fileId));
    dispatch(updateSheetType(fileId, newSheetId, SHEET_TYPE.INTERVAL));
    dispatch(updateSheetView(fileId, newSheetId, SHEET_VIEW.GRIDVIEW));
    return newSheetId;
  }

  onAddIntervalSheetClick(fileId = undefined, thumbCount = undefined, columnCount = undefined) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { dispatch } = this.props;
    const { currentFileId, sheetsByFileId, settings, visibilitySettings } = this.props;

    // if fileId is undefined then use currentFileId
    const theFileId = fileId || currentFileId;

    dispatch(setCurrentFileId(theFileId));

    const newSheetId = this.onAddIntervalSheet(sheetsByFileId, theFileId, settings, thumbCount, columnCount);

    const sheetView = getSheetView(sheetsByFileId, theFileId, newSheetId, visibilitySettings);
    this.onSetSheetClick(theFileId, newSheetId, sheetView);
  }

  onAddFaceSheetClick(scanResolution, scanWholeMovie = false) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { currentFileId, currentSheetId, file, sheetsByFileId, settings, visibilitySettings } = this.props;
    const { defaultFaceConfidenceThreshold, defaultFaceSizeThreshold, defaultFaceUniquenessThreshold } = settings;

    console.log(currentFileId);
    console.log(file);
    const { frameCount, path: filePath, useRatio, transformObject } = file;

    const updateSheet = false;
    const newSheetId = uuidV4();

    let frameNumberArray;
    if (scanWholeMovie) {
      frameNumberArray = getIntervalArray(Math.round(frameCount * scanResolution), 0, frameCount, frameCount);
    } else {
      const lowestFrame = getLowestFrame(
        getVisibleThumbs(
          sheetsByFileId[currentFileId] === undefined
            ? undefined
            : sheetsByFileId[currentFileId][currentSheetId].thumbsArray,
          visibilitySettings.visibilityFilter,
        ),
      );
      const highestFrame = getHighestFrame(
        getVisibleThumbs(
          sheetsByFileId[currentFileId] === undefined
            ? undefined
            : sheetsByFileId[currentFileId][currentSheetId].thumbsArray,
          visibilitySettings.visibilityFilter,
        ),
      );
      const frameCountOfSelection = Math.abs(highestFrame - lowestFrame);
      console.log(`${lowestFrame} | ${highestFrame} | ${frameCountOfSelection}`);
      frameNumberArray = getIntervalArray(
        Math.round(frameCountOfSelection * scanResolution),
        lowestFrame,
        highestFrame,
        frameCount,
      );
    }

    this.setState({ fileScanRunning: true });
    // display toast and set toastId to fileId
    toast(({ closeToast }) => <div>Face detection in progress</div>, {
      toastId: currentFileId,
      className: `${stylesPop.toast} ${stylesPop.toastInfo}`,
      hideProgressBar: false,
      autoClose: false,
      closeButton: false,
      closeOnClick: false,
    });

    ipcRenderer.send(
      'message-from-mainWindow-to-opencvWorkerWindow',
      'send-get-faces-sync',
      currentFileId,
      filePath,
      newSheetId,
      frameNumberArray,
      useRatio,
      settings.defaultCachedFramesSize,
      transformObject,
      defaultFaceConfidenceThreshold,
      defaultFaceSizeThreshold,
      defaultFaceUniquenessThreshold,
      SORT_METHOD.FACESIZE,
      updateSheet,
    );
  }

  onRescanFaceSheet() {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { currentFileId, currentSheetId, file, sheetsByFileId, settings, visibilitySettings } = this.props;
    const { defaultFaceConfidenceThreshold, defaultFaceSizeThreshold, defaultFaceUniquenessThreshold } = settings;

    console.log(currentFileId);
    console.log(file);
    const { frameCount, path: filePath, useRatio, transformObject } = file;

    const updateSheet = true;

    const frameNumberArray = getVisibleThumbs(
      sheetsByFileId[currentFileId] === undefined
        ? undefined
        : sheetsByFileId[currentFileId][currentSheetId].thumbsArray,
      visibilitySettings.visibilityFilter,
    ).map(thumb => thumb.frameNumber);

    this.setState({ fileScanRunning: true });
    // display toast and set toastId to fileId
    toast(({ closeToast }) => <div>Face detection in progress</div>, {
      toastId: currentFileId,
      className: `${stylesPop.toast} ${stylesPop.toastInfo}`,
      hideProgressBar: false,
      autoClose: false,
      closeButton: false,
      closeOnClick: false,
    });

    ipcRenderer.send(
      'message-from-mainWindow-to-opencvWorkerWindow',
      'send-get-faces-sync',
      currentFileId,
      filePath,
      currentSheetId,
      frameNumberArray,
      useRatio,
      settings.defaultCachedFramesSize,
      transformObject,
      defaultFaceConfidenceThreshold,
      defaultFaceSizeThreshold,
      defaultFaceUniquenessThreshold,
      SORT_METHOD.FACESIZE,
      updateSheet,
    );
  }

  onFileListElementClick(fileId) {
    // log.debug(`FileListElement clicked: ${file.name}`);
    const { dispatch } = this.props;
    const { sheetsByFileId, settings, visibilitySettings } = this.props;

    dispatch(setCurrentFileId(fileId));

    let newSheetId = getSheetId(sheetsByFileId, fileId);

    // When clicking on a filelist element for the first time
    if (newSheetId === undefined) {
      newSheetId = this.onAddIntervalSheet(sheetsByFileId, fileId, settings);
    }
    const sheetView = getSheetView(sheetsByFileId, fileId, newSheetId, visibilitySettings);
    // console.log(sheetView);

    this.onSetSheetClick(fileId, newSheetId, sheetView);
  }

  onBackToParentClick() {
    const { currentFileId, currentSheetId, sheetsByFileId, visibilitySettings } = this.props;

    const parentSheetId = getParentSheetId(sheetsByFileId, currentFileId, currentSheetId);
    const isParentSheet = doesSheetExist(sheetsByFileId, currentFileId, parentSheetId);

    if (isParentSheet) {
      const sheetView = getSheetView(sheetsByFileId, currentFileId, parentSheetId, visibilitySettings);
      this.onSetSheetClick(currentFileId, parentSheetId, sheetView);
    } else {
      toast('The parent MoviePrint does not exist anymore', {
        className: `${stylesPop.toast} ${stylesPop.toastError}`,
        autoClose: 3000,
        closeButton: true,
        closeOnClick: true,
      });
    }
  }

  onErrorPosterFrame(file) {
    const { dispatch } = this.props;
    // dispatch(updateThumbObjectUrlFromDB(file.id, undefined, undefined, file.posterFrameId, true));
  }

  getThumbsForFile(fileId, newSheetId = uuidV4(), thumbCount = this.props.settings.defaultThumbCount) {
    log.debug(`inside getThumbsForFileId: ${fileId}`);
    const { dispatch } = this.props;
    const { files, sheetsByFileId, settings } = this.props;
    const file = getFile(files, fileId);

    if (
      sheetsByFileId[fileId] === undefined ||
      sheetsByFileId[fileId][newSheetId] === undefined ||
      sheetsByFileId[fileId][newSheetId].thumbsArray === undefined
    ) {
      log.debug(`addIntervalSheet as no thumbs were found for: ${file.name}`);
      dispatch(
        addIntervalSheet(
          file,
          newSheetId,
          thumbCount,
          file.fadeInPoint,
          file.fadeOutPoint,
          settings.defaultCachedFramesSize,
        ),
      ).catch(error => {
        console.log(error);
      });
    }
  }

  openMoviesDialog() {
    log.debug('inside openMoviesDialog');
    // console.log(this);
    // console.log(this.dropzoneRef);
    this.dropzoneRef.current.open();
  }

  onOpenFeedbackForm() {
    log.debug('onOpenFeedbackForm');
    this.setState({
      showFeedbackForm: true,
      feedbackFormIsLoading: true,
    });
  }

  onCloseFeedbackForm() {
    log.debug('onCloseFeedbackForm');
    this.setState({ showFeedbackForm: false });
  }

  onChangeRow = value => {
    this.setState({ thumbCountTemp: this.state.columnCountTemp * value });
    this.updateScaleValue();
  };

  onChangeColumn = value => {
    const { dispatch } = this.props;
    const tempRowCount = Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
    this.setState({ columnCountTemp: value });
    if (this.state.reCapture) {
      this.setState({ thumbCountTemp: tempRowCount * value });
    }
    if (this.props.file !== undefined) {
      dispatch(updateSheetColumnCount(this.props.file.id, this.props.currentSheetId, value));
      dispatch(setDefaultColumnCount(value));
    }
    this.updateScaleValue();
  };

  onChangeColumnAndApply = value => {
    const { dispatch } = this.props;
    this.setState({
      columnCountTemp: value,
      columnCount: value,
    });
    if (this.props.file !== undefined) {
      dispatch(updateSheetColumnCount(this.props.file.id, this.props.currentSheetId, value));
      dispatch(setDefaultColumnCount(value));
    }
    this.updateScaleValue();
  };

  onToggleFaceRectClick = value => {
    const { dispatch } = this.props;
    if (value === undefined) {
      const { settings } = this.props;
      const { defaultShowFaceRect } = settings;
      dispatch(setDefaultShowFaceRect(!defaultShowFaceRect));
    } else {
      dispatch(setDefaultShowFaceRect(value));
    }
  };

  onChangeShowFaceRectClick = checked => {
    const { dispatch } = this.props;
    dispatch(setDefaultShowFaceRect(checked));
  };

  onShowPaperPreviewClick = checked => {
    const { dispatch } = this.props;
    dispatch(setDefaultShowPaperPreview(checked));
  };

  onOutputPathFromMovieClick = checked => {
    const { dispatch } = this.props;
    dispatch(setDefaultOutputPathFromMovie(checked));
  };

  onPaperAspectRatioClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultPaperAspectRatioInv(value));
  };

  onDetectInOutPointClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultDetectInOutPoint(value));
  };

  onReCaptureClick = checked => {
    // log.debug(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    if (!checked) {
      this.setState({ thumbCountTemp: this.state.thumbCount });
    } else {
      const newThumbCount =
        this.state.columnCountTemp * Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
      this.setState({ thumbCountTemp: newThumbCount });
    }
    this.setState({ reCapture: checked });
  };

  onApplyNewGridClick = () => {
    const { dispatch } = this.props;
    // log.debug(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    this.setState({ columnCount: this.state.columnCountTemp });
    if (this.state.reCapture) {
      this.setState({ thumbCount: this.state.thumbCountTemp });
      this.onThumbCountChange(this.state.columnCountTemp, this.state.thumbCountTemp);
    }
    if (this.props.file !== undefined) {
      dispatch(updateSheetColumnCount(this.props.file.id, this.props.currentSheetId, this.state.columnCountTemp));
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
    const { dispatch } = this.props;
    dispatch(setDefaultColumnCount(columnCount));
    dispatch(setDefaultThumbCount(thumbCount));
    if (this.props.currentFileId !== undefined) {
      dispatch(
        addIntervalSheet(
          this.props.file,
          this.props.settings.currentSheetId,
          thumbCount,
          getLowestFrame(
            getVisibleThumbs(
              this.props.sheetsByFileId[this.props.currentFileId] === undefined
                ? undefined
                : this.props.sheetsByFileId[this.props.currentFileId][this.props.settings.currentSheetId].thumbsArray,
              this.props.visibilitySettings.visibilityFilter,
            ),
          ),
          getHighestFrame(
            getVisibleThumbs(
              this.props.sheetsByFileId[this.props.currentFileId] === undefined
                ? undefined
                : this.props.sheetsByFileId[this.props.currentFileId][this.props.settings.currentSheetId].thumbsArray,
              this.props.visibilitySettings.visibilityFilter,
            ),
          ),
          this.props.settings.defaultCachedFramesSize,
        ),
      );
    }
  };

  onChangeMinDisplaySceneLength = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultTimelineViewMinDisplaySceneLengthInFrames(Math.round(value * this.props.file.fps)));
  };

  onChangeMargin = value => {
    const { dispatch, settings } = this.props;
    dispatch(setDefaultMarginRatio(value / settings.defaultMarginSliderFactor));
  };

  onChangeFaceSizeThreshold = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultFaceSizeThreshold(value));
  };

  onChangeFaceConfidenceThreshold = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultFaceConfidenceThreshold(value));
  };

  onChangeFaceUniquenessThreshold = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultFaceUniquenessThreshold(value));
  };

  onChangeFrameinfoScale = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultFrameinfoScale(value));
  };

  onChangeFrameinfoMargin = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultFrameinfoMargin(value));
  };

  onChangeSceneDetectionThreshold = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultSceneDetectionThreshold(value));
  };

  onChangeTimelineViewSecondsPerRow = value => {
    const { dispatch } = this.props;
    const { file, currentSheetId } = this.props;

    if (file !== undefined) {
      dispatch(updateSheetSecondsPerRow(file.id, currentSheetId, value));
    }
    dispatch(setDefaultTimelineViewSecondsPerRow(value));
  };

  onChangeTimelineViewWidthScale = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultTimelineViewWidthScale(value));
  };

  onTimelineViewFlowClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultTimelineViewFlow(value));
  };

  onToggleHeaderClick = value => {
    const { dispatch } = this.props;
    if (value === undefined) {
      const { settings } = this.props;
      const { defaultShowHeader } = settings;
      dispatch(setDefaultShowHeader(!defaultShowHeader));
    } else {
      dispatch(setDefaultShowHeader(value));
    }
  };

  onToggleImagesClick = value => {
    const { dispatch } = this.props;
    if (value === undefined) {
      const { settings } = this.props;
      const { defaultShowImages } = settings;
      dispatch(setDefaultShowImages(!defaultShowImages));
    } else {
      dispatch(setDefaultShowImages(value));
    }
  };

  onShowPathInHeaderClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultShowPathInHeader(value));
  };

  onShowDetailsInHeaderClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultShowDetailsInHeader(value));
  };

  onShowTimelineInHeaderClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultShowTimelineInHeader(value));
  };

  onRoundedCornersClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultRoundedCorners(value));
  };

  onMoviePrintBackgroundColorClick = (colorLocation, color) => {
    const { dispatch } = this.props;
    switch (colorLocation) {
      case 'moviePrintBackgroundColor':
        dispatch(setDefaultMoviePrintBackgroundColor(color));
        break;
      case 'frameninfoBackgroundColor':
        dispatch(setDefaultFrameinfoBackgroundColor(color));
        break;
      case 'frameinfoColor':
        dispatch(setDefaultFrameinfoColor(color));
        break;
      default:
        dispatch(setDefaultMoviePrintBackgroundColor(color));
    }
  };

  toggleZoom = () => {
    this.setState({
      zoom: !this.state.zoom,
    });
  };

  disableZoom = () => {
    this.setState({
      zoom: false,
    });
  };

  onToggleShowHiddenThumbsClick = () => {
    const { dispatch } = this.props;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_ALL') {
      dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    } else {
      dispatch(setVisibilityFilter('SHOW_ALL'));
    }
  };

  onSetSheetFitClick = value => {
    const { dispatch } = this.props;
    dispatch(setSheetFit(value));
    // disable zoom
    this.disableZoom();
  };

  onShowHiddenThumbsClick = value => {
    const { dispatch } = this.props;
    if (value) {
      dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  };

  onThumbInfoClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultThumbInfo(value));
  };

  onRemoveMovieListItem = fileId => {
    const { dispatch } = this.props;
    const { files } = this.props;
    if (files.length === 1) {
      dispatch(hideMovielist());
    }
    dispatch(removeMovieListItem(fileId));
    // dispatch(setCurrentSheetId(newSheetId));
  };

  onEditTransformListItemClick = fileId => {
    const { dispatch } = this.props;
    const { files } = this.props;
    const file = getFile(files, fileId);

    const { transformObject = { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 } } = file; // initialise if undefined
    this.setState({
      showTransformModal: true,
      transformObject: { fileId, ...transformObject }, // adding fileId
    });
  };

  onChangeTransform = e => {
    const { dispatch } = this.props;
    const { transformObject } = this.state;
    const { cropTop, cropBottom, cropLeft, cropRight } = e.target;
    // console.log(typeof cropTop.value);
    dispatch(
      updateCropping(
        transformObject.fileId,
        parseInt(cropTop.value, 10),
        parseInt(cropBottom.value, 10),
        parseInt(cropLeft.value, 10),
        parseInt(cropRight.value, 10),
      ),
    );
    this.setState({
      showTransformModal: false,
      fileIdToBeRecaptured: transformObject.fileId,
    });
  };

  onScanMovieListItemClick = fileId => {
    const { currentFileId, files } = this.props;

    // if fileId is undefined then use currentFileId
    const theFileId = fileId || currentFileId;
    const file = getFile(files, theFileId);

    this.runSceneDetection(theFileId, file.path, file.useRatio, undefined, undefined, file.transformObject);
  };

  onReplaceMovieListItemClick = fileId => {
    const { dispatch } = this.props;
    const { files, settings, sheetsByFileId } = this.props;
    const file = getFile(files, fileId);
    const { path: originalFilePath, lastModified: lastModifiedOfPrevious } = file;
    const newPathArray = dialog.showOpenDialogSync({
      title: 'Replace movie',
      defaultPath: originalFilePath,
      buttonLabel: 'Replace with',
      filters: [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });
    const newFilePath = newPathArray !== undefined ? newPathArray[0] : undefined;
    if (newFilePath) {
      log.debug(newFilePath);
      const fileName = path.basename(newFilePath);
      const { lastModified, size } = getFileStatsObject(newFilePath);
      dispatch(replaceFileDetails(fileId, newFilePath, fileName, size, lastModified));

      // change video for videoPlayer to the new one
      try {
        this.setState({
          opencvVideo: new opencv.VideoCapture(newFilePath),
        });
      } catch (e) {
        log.error(e);
      }

      // // change fileScanStatus
      // dispatch(updateFileScanStatus(fileId, false));
      // // remove entries from frameScanList sqlite3
      // deleteFileIdFromFrameScanList(fileId);

      dispatch(updateFileMissingStatus(fileId, false));

      // use lastModified as indicator if the movie which will be replaced existed
      // if lastModified is undefined, then do not onlyReplace
      let onlyReplace = true;
      if (lastModifiedOfPrevious === undefined) {
        log.debug('lastModifiedOfPrevious is undefined');
        onlyReplace = false;
      }

      ipcRenderer.send(
        'message-from-mainWindow-to-opencvWorkerWindow',
        'send-get-file-details',
        fileId,
        newFilePath,
        file.posterFrameId,
        onlyReplace,
      );
      if (onlyReplace) {
        this.setState({
          fileIdToBeRecaptured: fileId,
        });
      } else {
        this.setState({
          fileIdToBeCaptured: fileId,
        });
      }
    }
  };

  onDuplicateSheetClick = (fileId, sheetId) => {
    const { dispatch } = this.props;
    const { currentFileId, currentSheetId, files, settings, sheetsByFileId } = this.props;

    // if fileId  and or sheetId are undefined then use currentFileId and or currentSheetId
    const theFileId = fileId || currentFileId;
    const theSheetId = sheetId || currentSheetId;

    const newSheetId = uuidV4();
    dispatch(duplicateSheet(theFileId, theSheetId, newSheetId));
    dispatch(updateSheetName(theFileId, newSheetId, getNewSheetName(getSheetCount(files, theFileId)))); // set name on firstFile
    dispatch(updateSheetCounter(theFileId));
    dispatch(setCurrentSheetId(newSheetId));

    // if interval scene then create artificial sceneArray
    if (getSheetType(sheetsByFileId, theFileId, newSheetId, settings) === SHEET_TYPE.INTERVAL) {
      const sceneArray = createSceneArray(sheetsByFileId, theFileId, newSheetId);
      dispatch(updateSceneArray(theFileId, newSheetId, sceneArray));
    }
  };

  onExportSheetClick = (fileId, sheetId, exportType, fps) => {
    const { files, settings, sheetsByFileId, visibilitySettings } = this.props;
    log.debug(`onExportSheetClick: ${exportType}`);
    const sheetName = getSheetName(sheetsByFileId, fileId, sheetId);
    const fileName = getFileName(files, fileId);
    const filePath = getFilePath(files, fileId);
    // not sure if that is needed so I deactivated it for now
    // const isDropFrame = (roundNumber(fps) === 29.97) || (roundNumber(fps) === 59.94);
    const isDropFrame = false;
    let exportObject;
    if (exportType === EXPORT_FORMAT_OPTIONS.JSON) {
      const frameNumberArray = getFramenumbersOfSheet(sheetsByFileId, fileId, sheetId, visibilitySettings);
      const transformObject = getFileTransformObject(files, fileId);
      const columnCount = getColumnCount(sheetsByFileId, fileId, sheetId, settings);
      exportObject = JSON.stringify(
        {
          filePath,
          transformObject,
          columnCount,
          frameNumberArray,
        },
        null,
        '\t',
      ); // for pretty print with tab
    } else if (exportType === EXPORT_FORMAT_OPTIONS.EDL) {
      const sceneArray = getEDLscenes(sheetsByFileId, fileId, sheetId, visibilitySettings, fps);
      exportObject = sceneArray.join(`
* FROM CLIP NAME: ${fileName}

`);
      exportObject = `TITLE: ${fileName}
FCM: ${isDropFrame ? 'DROP FRAME' : 'NON-DROP FRAME'}

${exportObject}`;
    }
    const filePathDirectory = path.dirname(filePath);
    const outputPath = settings.defaultOutputPathFromMovie ? filePathDirectory : settings.defaultOutputPath;
    const filePathAndName = path.join(outputPath, `${fileName}-${sheetName}.${exportType}`);
    const newFilePathAndName = dialog.showSaveDialogSync({
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
    const { dispatch } = this.props;
    const { files, settings } = this.props;
    log.debug('onImportMoviePrint');

    let newPath = filePath;

    // skip dialog if filePath already available
    if (filePath === undefined) {
      const newPathArray = dialog.showOpenDialogSync({
        filters: [{ name: 'PNG or JSON', extensions: ['png', 'json'] }],
        properties: ['openFile'],
      });
      newPath = newPathArray !== undefined ? newPathArray[0] : undefined;
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
          const textChunks = chunks.filter(chunk => chunk.name === 'tEXt').map(chunk => text.decode(chunk.data));
          log.debug(`The png file ${newPath} has the following data embedded:`);
          log.debug(textChunks);

          if (textChunks.length !== 0) {
            newFilePath = decodeURIComponent(textChunks.find(chunk => chunk.keyword === 'filePath').text);
            const transformObjectString = textChunks.find(chunk => chunk.keyword === 'transformObject').text;
            transformObject = transformObjectString !== 'undefined' ? JSON.parse(transformObjectString) : undefined;
            columnCount = textChunks.find(chunk => chunk.keyword === 'columnCount').text;
            const frameNumberArrayString = textChunks.find(chunk => chunk.keyword === 'frameNumberArray').text;
            frameNumberArray = frameNumberArrayString !== 'undefined' ? JSON.parse(frameNumberArrayString) : undefined;
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
          columnCount = Number(jsonData.columnCount);
          frameNumberArray = jsonData.frameNumberArray;
          if (
            newFilePath !== undefined &&
            columnCount !== undefined &&
            frameNumberArray !== undefined &&
            frameNumberArray.length > 0
          ) {
            dataAvailable = true;
          }
        }

        if (dataAvailable) {
          this.showMessage('Data was found! Loading...', 3000, 'success');
          const fileName = path.basename(newFilePath);
          const { lastModified, size } = getFileStatsObject(newFilePath) || {};

          const fileId = uuidV4();
          const posterFrameId = uuidV4();
          const sheetId = uuidV4();
          const fileToAdd = {
            id: fileId,
            lastModified,
            name: fileName,
            path: newFilePath,
            size,
            fileMissingStatus: lastModified === undefined, // if lastModified is undefined than file missing
            posterFrameId,
          };
          dispatch({
            type: 'ADD_MOVIE_LIST_ITEMS',
            payload: [fileToAdd],
          });
          if (transformObject !== undefined) {
            dispatch(
              setCropping(
                fileId,
                transformObject.cropTop,
                transformObject.cropBottom,
                transformObject.cropLeft,
                transformObject.cropRight,
              ),
            );
          }
          dispatch(addNewThumbsWithOrder(fileToAdd, sheetId, frameNumberArray, settings.defaultCachedFramesSize));
          dispatch(updateSheetName(fileId, sheetId, getNewSheetName(getSheetCount(files, fileId)))); // set name on file
          dispatch(updateSheetCounter(fileId));
          dispatch(updateSheetColumnCount(fileId, sheetId, columnCount));
          dispatch(updateSheetType(fileId, sheetId, SHEET_TYPE.INTERVAL));
          dispatch(updateSheetView(fileId, sheetId, SHEET_VIEW.GRIDVIEW));
          dispatch(setCurrentSheetId(sheetId));
          dispatch(setCurrentFileId(fileId));
          ipcRenderer.send(
            'message-from-mainWindow-to-opencvWorkerWindow',
            'send-get-file-details',
            fileId,
            newFilePath,
            posterFrameId,
            false,
            true,
          );
        } else {
          this.showMessage('No fitting data found or embedded', 3000, 'error');
        }
      });
    }
  };

  onOpenFileExplorer = (value = undefined) => {
    const { file, settings } = this.props;
    const { defaultOutputPath, defaultOutputPathFromMovie } = settings;
    // open default output path if undefined
    let path;
    let isFolder = false;
    if (value === undefined) {
      path = defaultOutputPathFromMovie ? file.path : defaultOutputPath;
      isFolder = !defaultOutputPathFromMovie;
    } else {
      path = value;
    }
    ipcRenderer.send('open-file-explorer', path, isFolder);
  };

  onClearMovieList = () => {
    const { dispatch } = this.props;
    dispatch(setView(VIEW.STANDARDVIEW));
    dispatch(clearMovieList());
    dispatch(hideMovielist());
    dispatch(hideSettings());
  };

  onDeleteSheetClick = (fileId, sheetId) => {
    const { dispatch } = this.props;
    const { currentSheetId, sheetsByFileId } = this.props;
    dispatch(deleteSheets(fileId, sheetId));
    // if the currentSheet is deleted then switch to the first sheet of the file
    if (currentSheetId === sheetId) {
      const newSheetId = getSheetId(sheetsByFileId, fileId);
      dispatch(setCurrentSheetId(newSheetId));
    }
  };

  onSetSheetClick = (fileId, sheetId, sheetView) => {
    const { dispatch } = this.props;
    const { currentFileId } = this.props;
    if (fileId !== currentFileId) {
      dispatch(setCurrentFileId(fileId));
    }
    dispatch(setCurrentSheetId(sheetId));
    if (sheetView === SHEET_VIEW.TIMELINEVIEW) {
      this.onReCaptureClick(false);
    }
    dispatch(setDefaultSheetView(sheetView));
  };

  onSubmitMoviePrintNameClick = (fileId, sheetId, newName) => {
    const { dispatch } = this.props;

    dispatch(updateSheetName(fileId, sheetId, newName));
  };

  onChangeSheetViewClick = (fileId, sheetId, sheetView) => {
    const { dispatch } = this.props;
    const { currentFileId, currentSheetId, sheetsByFileId, settings } = this.props;

    // if fileId  and or sheetId are undefined then use currentFileId and or currentSheetId
    const theFileId = fileId || currentFileId;
    const theSheetId = sheetId || currentSheetId;

    // if sheet type interval then create 'artificial' scene Array
    const sheetType = getSheetType(sheetsByFileId, theFileId, theSheetId, settings);
    if (sheetType === SHEET_TYPE.INTERVAL) {
      const sceneArray = createSceneArray(sheetsByFileId, theFileId, theSheetId);
      dispatch(updateSceneArray(theFileId, theSheetId, sceneArray));
    }
    dispatch(updateSheetView(theFileId, theSheetId, sheetView));

    if (sheetView === SHEET_VIEW.TIMELINEVIEW) {
      this.onReCaptureClick(false);
    }
  };

  toggleSheetView = (fileId, sheetId) => {
    const { sheetsByFileId, visibilitySettings } = this.props;
    const sheetView = getSheetView(sheetsByFileId, fileId, sheetId, visibilitySettings);
    let newSheetView;
    if (sheetView === SHEET_VIEW.GRIDVIEW) {
      newSheetView = SHEET_VIEW.TIMELINEVIEW;
    } else {
      newSheetView = SHEET_VIEW.GRIDVIEW;
    }
    this.onChangeSheetViewClick(fileId, sheetId, newSheetView);
  };

  setOrToggleDefaultSheetView = (sheetView = undefined) => {
    const { dispatch } = this.props;
    const { visibilitySettings } = this.props;
    let newSheetView = sheetView;
    if (newSheetView === undefined) {
      if (visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW) {
        newSheetView = SHEET_VIEW.TIMELINEVIEW;
      } else if (visibilitySettings.defaultSheetView === SHEET_VIEW.TIMELINEVIEW) {
        newSheetView = SHEET_VIEW.GRIDVIEW;
      }
    }
    dispatch(setDefaultSheetView(newSheetView));
  };

  onSetViewClick = value => {
    const { dispatch } = this.props;
    const { currentFileId, currentSheetId, scenes, sheetsByFileId, settings } = this.props;

    if (value === VIEW.PLAYERVIEW) {
      this.hideSettings();
      this.hideMovielist();
    }

    // change defaultSheetView to gridview for interval type as it should not have
    // a cut mode (timelineview) in playerview
    const sheetType = getSheetType(sheetsByFileId, currentFileId, currentSheetId, settings);
    if (sheetType === SHEET_TYPE.INTERVAL) {
      dispatch(setDefaultSheetView(SHEET_VIEW.GRIDVIEW));
    }
    // remove selection when switching back to standard view
    if (value === VIEW.STANDARDVIEW) {
      this.onDeselectThumbMethod();
    }
    dispatch(setView(value));
  };

  onChangeDefaultMoviePrintName = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultMoviePrintName(value));
  };

  onChangeDefaultSingleThumbName = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultSingleThumbName(value));
  };

  onChangeDefaultAllThumbsName = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultAllThumbsName(value));
  };

  onChangeOutputPathClick = () => {
    const { dispatch } = this.props;
    const newPathArray = dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    });
    const newPath = newPathArray !== undefined ? newPathArray[0] : undefined;
    if (newPath) {
      // log.debug(newPath);
      dispatch(setDefaultOutputPath(newPath));
    }
  };

  onOutputFormatClick = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultOutputFormat(value));
  };

  onFrameinfoPositionClick = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultFrameinfoPosition(value));
  };

  onCachedFramesSizeClick = value => {
    const { dispatch } = this.props;
    // log.debug(value);
    dispatch(setDefaultCachedFramesSize(value));
  };

  onOverwriteClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultSaveOptionOverwrite(value));
  };

  onIncludeIndividualClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultSaveOptionIncludeIndividual(value));
  };

  onEmbedFrameNumbersClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultEmbedFrameNumbers(value));
  };

  onEmbedFilePathClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultEmbedFilePath(value));
  };

  onOpenFileExplorerAfterSavingClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultOpenFileExplorerAfterSaving(value));
  };

  onThumbnailScaleClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultThumbnailScale(value));
  };

  onMoviePrintWidthClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultMoviePrintWidth(value));
  };

  onShotDetectionMethodClick = value => {
    const { dispatch } = this.props;
    dispatch(setDefaultShotDetectionMethod(value));
  };

  updateOpencvVideoCanvas(currentFrame) {
    setPosition(this.state.opencvVideo, currentFrame, this.props.file.useRatio);
    const frame = this.state.opencvVideo.read();
    if (!frame.empty) {
      const img = frame.resizeToMax(
        this.state.scaleValueObject.aspectRatioInv < 1
          ? parseInt(this.state.scaleValueObject.scrubMovieWidth, 10)
          : parseInt(this.state.scaleValueObject.scrubMovieHeight, 10),
      );
      // renderImage(matResized, this.opencvVideoCanvasRef, opencv);
      const matRGBA = img.channels === 1 ? img.cvtColor(opencv.COLOR_GRAY2RGBA) : img.cvtColor(opencv.COLOR_BGR2RGBA);

      this.opencvVideoCanvasRef.current.height = img.rows;
      this.opencvVideoCanvasRef.current.width = img.cols;
      const imgData = new ImageData(new Uint8ClampedArray(matRGBA.getData()), img.cols, img.rows);
      const ctx = this.opencvVideoCanvasRef.current.getContext('2d');
      ctx.putImageData(imgData, 0, 0);
    }
  }

  render() {
    const { accept, dropzoneActive, feedbackFormIsLoading, objectUrlObjects, scaleValueObject } = this.state;
    const { dispatch } = this.props;
    const {
      allScenes,
      allThumbs,
      currentFileId,
      currentSheetId,
      file,
      files,
      scenes,
      sheetsByFileId,
      settings,
      visibilitySettings,
    } = this.props;

    const fileCount = files.length;

    const secondsPerRow = getSecondsPerRow(sheetsByFileId, currentFileId, currentSheetId, settings);
    const sheetView = getSheetView(sheetsByFileId, currentFileId, currentSheetId, visibilitySettings);
    const sheetType = getSheetType(sheetsByFileId, currentFileId, currentSheetId, settings);
    const sheetName = getSheetName(sheetsByFileId, currentFileId, currentSheetId);
    const hasParent = getParentSheetId(sheetsByFileId, currentFileId, currentSheetId) !== undefined;
    const { defaultSheetView } = visibilitySettings;

    let isGridView = true;
    if (sheetView === SHEET_VIEW.TIMELINEVIEW) {
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
            [key]: objectUrlObjects[key],
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
            [key]: objectUrlObjects[key],
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
        () =>
          this.props.files.find(
            file =>
              file.id ===
              getObjectProperty(() => this.state.sheetsToPrint.find(item => item.status === 'printing').fileId),
          ).name,
      );
    }

    return (
      <Dropzone
        ref={this.dropzoneRef}
        noClick
        noKeyboard
        style={{ position: 'relative' }}
        accept={this.state.accept}
        onDrop={this.onDrop.bind(this)}
        onDragEnter={this.onDragEnter.bind(this)}
        onDragLeave={this.onDragLeave.bind(this)}
        className={styles.dropzoneshow}
        acceptClassName={styles.dropzoneshowAccept}
        rejectClassName={styles.dropzoneshowReject}
      >
        {({ getRootProps, getInputProps, isDragAccept, isDragReject }) => {
          return (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div className={`${styles.Site}`}>
                <HeaderComponent
                  visibilitySettings={visibilitySettings}
                  settings={settings}
                  file={file}
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
                  checkForUpdates={this.checkForUpdates}
                  onOpenFeedbackForm={this.onOpenFeedbackForm}
                  zoom={this.state.zoom}
                  isCheckingForUpdates={this.state.isCheckingForUpdates}
                  scaleValueObject={scaleValueObject}
                  isGridView
                />
                {file && (
                  <FloatingMenu
                    visibilitySettings={visibilitySettings}
                    settings={settings}
                    scaleValueObject={scaleValueObject}
                    sheetType={sheetType}
                    sheetView={sheetView}
                    fileMissingStatus={file.fileMissingStatus}
                    toggleMovielist={this.toggleMovielist}
                    onAddIntervalSheetClick={this.onAddIntervalSheetClick}
                    onAddFaceSheetClick={this.onAddFaceSheetClick}
                    onRescanFaceSheet={this.onRescanFaceSheet}
                    onScanMovieListItemClick={this.onScanMovieListItemClick}
                    onSortSheet={this.onSortSheet}
                    onDuplicateSheetClick={this.onDuplicateSheetClick}
                    onChangeSheetViewClick={this.onChangeSheetViewClick}
                    hasParent={hasParent}
                    onBackToParentClick={this.onBackToParentClick}
                    zoom={this.state.zoom}
                    onSetViewClick={this.onSetViewClick}
                    onSetSheetFitClick={this.onSetSheetFitClick}
                    toggleZoom={this.toggleZoom}
                    onToggleShowHiddenThumbsClick={this.onToggleShowHiddenThumbsClick}
                    onThumbInfoClick={this.onThumbInfoClick}
                    onToggleHeaderClick={this.onToggleHeaderClick}
                    onToggleImagesClick={this.onToggleImagesClick}
                    onToggleFaceRectClick={this.onToggleFaceRectClick}
                    toggleSettings={this.toggleSettings}
                  />
                )}
                <div
                  className={`${styles.SiteContent}`}
                  ref={el => {
                    this.siteContent = el;
                  }}
                  style={{
                    height: `calc(100vh - ${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px)`,
                  }}
                >
                  <Popup
                    trigger={
                      <div
                        className={`${styles.openCloseMovieList} ${styles.ItemMovielist} ${
                          visibilitySettings.showMovielist ? styles.ItemMovielistAnim : ''
                        }`}
                        onClick={this.toggleMovielist}
                        data-tid={visibilitySettings.showMovielist === false ? 'showMovieListBtn' : 'hideMovieListBtn'}
                      >
                        <Icon
                          className={`${styles.normalButton} ${
                            visibilitySettings.showMovielist === false ? '' : styles.selected
                          }`}
                          style={{
                            marginRight: '16px',
                            marginTop: '18px',
                            marginLeft: '50px',
                          }}
                          size="large"
                          name={visibilitySettings.showMovielist ? 'angle left' : 'angle right'}
                        />
                      </div>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position="right center"
                    className={stylesPop.popup}
                    content={
                      visibilitySettings.showMovielist === false ? (
                        <span>
                          Show Movie and Sheets list <mark>1</mark>
                        </span>
                      ) : (
                        <span>
                          Hide Movie list <mark>1</mark>
                        </span>
                      )
                    }
                  />
                  <div
                    className={`${styles.ItemSideBar} ${styles.ItemMovielist} ${
                      visibilitySettings.showMovielist ? styles.ItemMovielistAnim : ''
                    }`}
                  >
                    <FileList
                      files={files}
                      settings={settings}
                      visibilitySettings={visibilitySettings}
                      onFileListElementClick={this.onFileListElementClick}
                      onOpenFileExplorer={this.onOpenFileExplorer}
                      onAddIntervalSheetClick={this.onAddIntervalSheetClick}
                      posterobjectUrlObjects={filteredPosterFrameObjectUrlObjects}
                      sheetsByFileId={sheetsByFileId}
                      onChangeSheetViewClick={this.onChangeSheetViewClick}
                      onSubmitMoviePrintNameClick={this.onSubmitMoviePrintNameClick}
                      onSetSheetClick={this.onSetSheetClick}
                      onDuplicateSheetClick={this.onDuplicateSheetClick}
                      onExportSheetClick={this.onExportSheetClick}
                      onScanMovieListItemClick={this.onScanMovieListItemClick}
                      onReplaceMovieListItemClick={this.onReplaceMovieListItemClick}
                      onEditTransformListItemClick={this.onEditTransformListItemClick}
                      onRemoveMovieListItem={this.onRemoveMovieListItem}
                      onDeleteSheetClick={this.onDeleteSheetClick}
                      currentSheetId={currentSheetId}
                    />
                  </div>
                  <Popup
                    trigger={
                      <div
                        className={`${styles.openCloseSettings} ${styles.ItemSettings} ${
                          visibilitySettings.showSettings ? styles.ItemSettingsAnim : ''
                        }`}
                        onClick={this.toggleSettings}
                        data-tid={visibilitySettings.showSettings === false ? 'moreSettingsBtn' : 'hideSettingsBtn'}
                      >
                        <Icon
                          className={`${styles.normalButton} ${
                            visibilitySettings.showSettings === false ? '' : styles.selected
                          }`}
                          style={{
                            // marginRight: '16px',
                            marginTop: '18px',
                            marginLeft: '6px',
                          }}
                          size="large"
                          name={visibilitySettings.showSettings ? 'angle right' : 'angle left'}
                        />
                      </div>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position="left center"
                    className={stylesPop.popup}
                    content={
                      visibilitySettings.showSettings === false ? (
                        <span>
                          Show settings <mark>3</mark>
                        </span>
                      ) : (
                        <span>
                          Hide settings <mark>3</mark>
                        </span>
                      )
                    }
                  />
                  <div
                    className={`${styles.ItemSideBar} ${styles.ItemSettings} ${
                      visibilitySettings.showSettings ? styles.ItemSettingsAnim : ''
                    }`}
                  >
                    <SettingsList
                      settings={settings}
                      visibilitySettings={visibilitySettings}
                      file={file}
                      sheetType={sheetType}
                      sheetName={sheetName}
                      columnCountTemp={this.state.columnCountTemp}
                      thumbCountTemp={this.state.thumbCountTemp}
                      thumbCount={this.state.thumbCount}
                      rowCountTemp={Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp)}
                      columnCount={this.state.columnCount}
                      rowCount={Math.ceil(this.state.thumbCount / this.state.columnCount)}
                      reCapture={this.state.reCapture}
                      onChangeColumn={this.onChangeColumn}
                      onChangeColumnAndApply={this.onChangeColumnAndApply}
                      onChangeRow={this.onChangeRow}
                      onChangeShowFaceRectClick={this.onChangeShowFaceRectClick}
                      onShowPaperPreviewClick={this.onShowPaperPreviewClick}
                      onOutputPathFromMovieClick={this.onOutputPathFromMovieClick}
                      onPaperAspectRatioClick={this.onPaperAspectRatioClick}
                      onDetectInOutPointClick={this.onDetectInOutPointClick}
                      onReCaptureClick={this.onReCaptureClick}
                      onApplyNewGridClick={this.onApplyNewGridClick}
                      onCancelClick={this.onCancelClick}
                      onChangeMargin={this.onChangeMargin}
                      onChangeFaceSizeThreshold={this.onChangeFaceSizeThreshold}
                      onChangeFaceConfidenceThreshold={this.onChangeFaceConfidenceThreshold}
                      onChangeFaceUniquenessThreshold={this.onChangeFaceUniquenessThreshold}
                      onChangeFrameinfoScale={this.onChangeFrameinfoScale}
                      onChangeFrameinfoMargin={this.onChangeFrameinfoMargin}
                      onChangeMinDisplaySceneLength={this.onChangeMinDisplaySceneLength}
                      sceneArray={scenes}
                      secondsPerRowTemp={secondsPerRow}
                      // secondsPerRowTemp={this.state.secondsPerRowTemp}
                      onChangeSceneDetectionThreshold={this.onChangeSceneDetectionThreshold}
                      onChangeTimelineViewSecondsPerRow={this.onChangeTimelineViewSecondsPerRow}
                      onChangeTimelineViewWidthScale={this.onChangeTimelineViewWidthScale}
                      onTimelineViewFlowClick={this.onTimelineViewFlowClick}
                      onToggleHeaderClick={this.onToggleHeaderClick}
                      onShowPathInHeaderClick={this.onShowPathInHeaderClick}
                      onShowDetailsInHeaderClick={this.onShowDetailsInHeaderClick}
                      onShowTimelineInHeaderClick={this.onShowTimelineInHeaderClick}
                      onRoundedCornersClick={this.onRoundedCornersClick}
                      onShowHiddenThumbsClick={this.onShowHiddenThumbsClick}
                      onThumbInfoClick={this.onThumbInfoClick}
                      onChangeDefaultMoviePrintName={this.onChangeDefaultMoviePrintName}
                      onChangeDefaultSingleThumbName={this.onChangeDefaultSingleThumbName}
                      onChangeDefaultAllThumbsName={this.onChangeDefaultAllThumbsName}
                      onChangeOutputPathClick={this.onChangeOutputPathClick}
                      onFrameinfoPositionClick={this.onFrameinfoPositionClick}
                      onOutputFormatClick={this.onOutputFormatClick}
                      onCachedFramesSizeClick={this.onCachedFramesSizeClick}
                      onOverwriteClick={this.onOverwriteClick}
                      onIncludeIndividualClick={this.onIncludeIndividualClick}
                      onEmbedFrameNumbersClick={this.onEmbedFrameNumbersClick}
                      onEmbedFilePathClick={this.onEmbedFilePathClick}
                      onOpenFileExplorerAfterSavingClick={this.onOpenFileExplorerAfterSavingClick}
                      onThumbnailScaleClick={this.onThumbnailScaleClick}
                      onMoviePrintWidthClick={this.onMoviePrintWidthClick}
                      onShotDetectionMethodClick={this.onShotDetectionMethodClick}
                      onMoviePrintBackgroundColorClick={this.onMoviePrintBackgroundColorClick}
                      scaleValueObject={scaleValueObject}
                      runSceneDetection={this.runSceneDetection}
                      fileScanRunning={this.state.fileScanRunning}
                      showChart={this.state.showChart}
                      onToggleDetectionChart={this.onToggleDetectionChart}
                      recaptureAllFrames={this.recaptureAllFrames}
                      isGridView={isGridView}
                    />
                  </div>
                  <div
                    className={`${styles.ItemVideoPlayer} ${
                      visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''
                    }`}
                    style={{
                      top: `${MENU_HEADER_HEIGHT + settings.defaultBorderMargin}px`,
                      transform:
                        visibilitySettings.defaultView === VIEW.PLAYERVIEW
                          ? `translate(0px, 0px)`
                          : `translate(0, ${(scaleValueObject.videoPlayerHeight +
                              settings.defaultVideoPlayerControllerHeight) *
                              -1}px)`,
                      overflow: visibilitySettings.defaultView === VIEW.PLAYERVIEW ? 'visible' : 'hidden',
                    }}
                  >
                    {file && (
                      <VideoPlayer
                        ref={this.videoPlayer}
                        file={file}
                        currentSheetId={settings.currentSheetId}
                        defaultSheetView={defaultSheetView}
                        sheetType={sheetType}
                        keyObject={this.state.keyObject}
                        containerWidth={this.state.containerWidth}
                        scaleValueObject={scaleValueObject}
                        aspectRatioInv={scaleValueObject.aspectRatioInv}
                        height={scaleValueObject.videoPlayerHeight}
                        width={scaleValueObject.videoPlayerWidth}
                        objectUrlObjects={filteredObjectUrlObjects}
                        controllerHeight={settings.defaultVideoPlayerControllerHeight}
                        arrayOfCuts={this.props.arrayOfCuts}
                        allScenes={allScenes}
                        scenes={scenes}
                        thumbs={allThumbs}
                        selectedThumb={
                          this.state.selectedThumbsArray.length !== 0 ? this.state.selectedThumbsArray[0] : undefined
                        }
                        jumpToFrameNumber={this.state.jumpToFrameNumber}
                        setOrToggleDefaultSheetView={this.setOrToggleDefaultSheetView}
                        onThumbDoubleClick={this.onViewToggle}
                        onChangeThumb={this.onChangeThumb}
                        onAddThumb={this.onAddThumb}
                        onSelectThumbMethod={this.onSelectThumbMethod}
                        onCutSceneClick={this.onCutSceneClick}
                        onMergeSceneClick={this.onMergeSceneClick}
                        opencvVideo={this.state.opencvVideo}
                        frameSize={settings.defaultCachedFramesSize}
                      />
                    )}
                  </div>
                  <div
                    ref={r => {
                      this.divOfSortedVisibleThumbGridRef = r;
                    }}
                    className={`${styles.ItemMain} ${visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''} ${
                      visibilitySettings.showSettings ? styles.ItemMainRightAnim : ''
                    } ${visibilitySettings.showSettings ? styles.ItemMainEdit : ''} ${
                      visibilitySettings.defaultView === VIEW.PLAYERVIEW ? styles.ItemMainTopAnim : ''
                    }`}
                    style={{
                      width:
                        // use window width if any of these are true
                        defaultSheetView === SHEET_VIEW.TIMELINEVIEW ||
                        // sheetView === SHEET_VIEW.TIMELINEVIEW ||
                        (visibilitySettings.defaultView !== VIEW.PLAYERVIEW &&
                          visibilitySettings.defaultSheetFit !== SHEET_FIT.HEIGHT &&
                          !this.state.zoom) ||
                        scaleValueObject.newMoviePrintWidth < this.state.containerWidth // if smaller, width has to be undefined otherwise the center align does not work
                          ? undefined
                          : scaleValueObject.newMoviePrintWidth,
                      marginTop:
                        visibilitySettings.defaultView !== VIEW.PLAYERVIEW
                          ? undefined
                          : `${scaleValueObject.videoPlayerHeight + settings.defaultBorderMargin * 2}px`,
                      minHeight:
                        visibilitySettings.defaultView !== VIEW.PLAYERVIEW
                          ? `calc(100vh - ${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px)`
                          : undefined,
                      // backgroundImage: `url(${paperBorderPortrait})`,
                      backgroundImage:
                        (visibilitySettings.showSettings && settings.defaultShowPaperPreview) ||
                        (file && visibilitySettings.defaultView !== VIEW.PLAYERVIEW && settings.defaultShowPaperPreview)
                          ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${
                              settings.defaultPaperAspectRatioInv < scaleValueObject.moviePrintAspectRatioInv
                                ? scaleValueObject.newMoviePrintHeight / settings.defaultPaperAspectRatioInv
                                : scaleValueObject.newMoviePrintWidth
                            }' height='${
                              settings.defaultPaperAspectRatioInv < scaleValueObject.moviePrintAspectRatioInv
                                ? scaleValueObject.newMoviePrintHeight
                                : scaleValueObject.newMoviePrintWidth * settings.defaultPaperAspectRatioInv
                            }' style='background-color: rgba(245,245,245,${
                              visibilitySettings.showSettings ? 1 : 0.02
                            });'></svg>")`
                          : undefined,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `calc(50% - ${DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN / 2}px) 50%`,
                    }}
                  >
                    {file || visibilitySettings.showSettings || this.state.loadingFirstFile ? (
                      <>
                        <Conditional
                          // when in playerview use defaultSheetview which is used as cut and change modes, else use sheetView from sheet
                          if={
                            visibilitySettings.defaultView === VIEW.PLAYERVIEW
                              ? defaultSheetView !== SHEET_VIEW.TIMELINEVIEW
                              : sheetView !== SHEET_VIEW.TIMELINEVIEW
                          }
                        >
                          <SortedVisibleThumbGrid
                            emptyColorsArray={this.state.emptyColorsArray}
                            sheetView={sheetView}
                            sheetType={sheetType}
                            sheetName={sheetName}
                            view={visibilitySettings.defaultView}
                            currentSheetId={settings.currentSheetId}
                            settings={settings}
                            sheetsByFileId={sheetsByFileId}
                            file={file}
                            inputRef={r => {
                              this.sortedVisibleThumbGridRef = r;
                            }}
                            keyObject={this.state.keyObject}
                            onAddThumbClick={this.onAddThumbClick}
                            onJumpToCutThumbClick={this.onJumpToCutThumbClick}
                            onScrubClick={this.onScrubClick}
                            onExpandClick={this.onExpandClick}
                            onThumbDoubleClick={this.onViewToggle}
                            scaleValueObject={scaleValueObject}
                            moviePrintWidth={scaleValueObject.newMoviePrintWidth}
                            selectedThumbsArray={this.state.selectedThumbsArray}
                            onSelectThumbMethod={this.onSelectThumbMethod}
                            defaultOutputPath={settings.defaultOutputPath}
                            defaultOutputPathFromMovie={settings.defaultOutputPathFromMovie}
                            defaultShowDetailsInHeader={settings.defaultShowDetailsInHeader}
                            defaultShowHeader={settings.defaultShowHeader}
                            defaultShowImages={settings.defaultShowImages}
                            defaultShowPathInHeader={settings.defaultShowPathInHeader}
                            defaultShowTimelineInHeader={settings.defaultShowTimelineInHeader}
                            defaultThumbInfo={settings.defaultThumbInfo}
                            defaultThumbInfoRatio={settings.defaultThumbInfoRatio}
                            showMovielist={visibilitySettings.showMovielist}
                            showSettings={visibilitySettings.showSettings}
                            thumbCount={this.state.thumbCountTemp}
                            objectUrlObjects={filteredObjectUrlObjects}
                            thumbs={this.props.thumbs}
                            isViewForPrinting={false}
                            frameSize={settings.defaultCachedFramesSize}
                            isGridView={isGridView}
                          />
                        </Conditional>
                        <Conditional
                          // when in playerview use defaultSheetview which is used as cut and change modes, else use sheetView from sheet
                          if={
                            visibilitySettings.defaultView === VIEW.PLAYERVIEW
                              ? defaultSheetView === SHEET_VIEW.TIMELINEVIEW
                              : sheetView === SHEET_VIEW.TIMELINEVIEW
                          }
                        >
                          <SortedVisibleSceneGrid
                            sheetView={sheetView}
                            sheetType={sheetType}
                            view={visibilitySettings.defaultView}
                            file={file}
                            sheetsByFileId={sheetsByFileId}
                            currentSheetId={settings.currentSheetId}
                            frameCount={file ? file.frameCount : undefined}
                            inputRef={r => {
                              this.sortedVisibleThumbGridRef = r;
                            }}
                            keyObject={this.state.keyObject}
                            selectedThumbsArray={this.state.selectedThumbsArray}
                            onSelectThumbMethod={this.onSelectThumbMethod}
                            onDeselectThumbMethod={this.onDeselectThumbMethod}
                            onThumbDoubleClick={this.onViewToggle}
                            onJumpToCutSceneClick={this.onJumpToCutSceneClick}
                            onExpandClick={this.onExpandClick}
                            moviePrintWidth={scaleValueObject.newMoviePrintTimelineWidth}
                            moviePrintRowHeight={scaleValueObject.newTimelineRowHeight}
                            scaleValueObject={scaleValueObject}
                            scenes={visibilitySettings.defaultView === VIEW.PLAYERVIEW ? allScenes : scenes}
                            settings={settings}
                            showMovielist={visibilitySettings.showMovielist}
                            showSettings={visibilitySettings.showSettings}
                            objectUrlObjects={filteredObjectUrlObjects}
                            thumbs={this.props.allThumbs}
                            currentSheetId={settings.currentSheetId}
                          />
                        </Conditional>
                        {false && (
                          <div
                            style={{
                              // background: 'green',
                              pointerEvents: 'none',
                              border: '5px solid green',
                              width: scaleValueObject.newMoviePrintTimelineWidth,
                              height: scaleValueObject.newMoviePrintTimelineHeight,
                              position: 'absolute',
                              left: visibilitySettings.showSettings ? '' : '50%',
                              top: '50%',
                              marginLeft: visibilitySettings.showSettings
                                ? ''
                                : scaleValueObject.newMoviePrintTimelineWidth / -2,
                              marginTop: scaleValueObject.newMoviePrintTimelineHeight / -2,
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div className={styles.ItemMainStartupContainer}>
                        <img
                          data-tid="startupImg"
                          src={startupImg}
                          style={{
                            width: `calc(100vw - ${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px)`,
                            height: `calc(100vh - ${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px)`,
                            maxWidth: 1000,
                            maxHeight: 500,
                            margin: 'auto',
                          }}
                          alt=""
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Modal
                  open={this.state.showFeedbackForm}
                  onClose={() => this.setState({ intendToCloseFeedbackForm: true })}
                  closeIcon
                  // closeOnEscape={false}
                  // closeOnRootNodeClick={false}
                  // basic
                  // size='fullscreen'
                  // style={{
                  //   marginTop: 0,
                  //   height: '80vh',
                  // }}
                  className={styles.feedbackFormModal}
                  onMount={() => {
                    setTimeout(() => {
                      this.webviewRef.current.addEventListener('ipc-message', event => {
                        // log.debug(event);
                        log.debug(event.channel);
                        if (event.channel === 'wpcf7mailsent') {
                          const rememberEmail =
                            event.args[0].findIndex(argument => argument.name === 'checkbox-remember-email[]') >= 0;
                          if (rememberEmail) {
                            const emailAddressFromForm = event.args[0].find(argument => argument.name === 'your-email')
                              .value;
                            dispatch(setEmailAddress(emailAddressFromForm));
                          }
                          this.onCloseFeedbackForm();
                        }
                      });
                      // stop showing loader when done loading
                      this.webviewRef.current.addEventListener('did-stop-loading', () => {
                        this.setState({
                          feedbackFormIsLoading: false,
                        });
                      });
                    }, 300); // wait a tiny bit until webview is mounted
                  }}
                >
                  <Modal.Content
                    // scrolling
                    style={
                      {
                        // overflow: 'auto',
                        // height: '80vh',
                      }
                    }
                  >
                    {feedbackFormIsLoading && (
                      <Dimmer active inverted>
                        <Loader inverted>Loading</Loader>
                      </Dimmer>
                    )}
                    <webview
                      autosize="true"
                      // nodeintegration='true'
                      // disablewebsecurity='true'
                      className={styles.feedbackFormWebView}
                      preload="./webViewPreload.js"
                      ref={this.webviewRef}
                      src={`${URL_FEEDBACK_FORM}?app-version=${
                        process.platform
                      }-${os.release()}-${app.getName()}-${app.getVersion()}&your-email=${settings.emailAddress}`}
                    />
                    <Modal
                      open={this.state.intendToCloseFeedbackForm}
                      basic
                      size="mini"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        margin: 'auto !important',
                      }}
                    >
                      <Modal.Content>
                        <p>Close the feedback form?</p>
                      </Modal.Content>
                      <Modal.Actions>
                        <Button
                          basic
                          color="red"
                          inverted
                          onClick={() => this.setState({ intendToCloseFeedbackForm: false })}
                        >
                          <Icon name="remove" /> Cancel
                        </Button>
                        <Button
                          color="green"
                          inverted
                          onClick={() => this.setState({ showFeedbackForm: false, intendToCloseFeedbackForm: false })}
                        >
                          <Icon name="checkmark" /> Close
                        </Button>
                      </Modal.Actions>
                    </Modal>
                  </Modal.Content>
                </Modal>
                <Footer
                  visibilitySettings={visibilitySettings}
                  file={file}
                  onSaveMoviePrint={this.onSaveMoviePrint}
                  onSaveAllMoviePrints={this.onSaveAllMoviePrints}
                  onOpenFileExplorer={this.onOpenFileExplorer}
                  savingMoviePrint={this.state.savingMoviePrint}
                  savingAllMoviePrints={this.state.savingAllMoviePrints}
                  sheetView={sheetView}
                  defaultView={visibilitySettings.defaultView}
                />
              </div>
              {this.state.showScrubWindow && (
                <Scrub
                  opencvVideoCanvasRef={this.opencvVideoCanvasRef}
                  file={file}
                  settings={settings}
                  sheetType={sheetType}
                  objectUrlObjects={filteredObjectUrlObjects}
                  keyObject={this.state.keyObject}
                  scrubWindowTriggerTime={this.state.scrubWindowTriggerTime}
                  scrubThumb={this.state.scrubThumb}
                  scrubThumbLeft={this.state.scrubThumbLeft}
                  scrubThumbRight={this.state.scrubThumbRight}
                  scaleValueObject={scaleValueObject}
                  containerWidth={this.state.containerWidth}
                  containerHeight={this.state.containerHeight}
                  onScrubWindowMouseOver={this.onScrubWindowMouseOver}
                  onScrubWindowClick={this.onScrubWindowClick}
                />
              )}
              {this.state.showChart && (
                <div
                  className={styles.chart}
                  style={{
                    height: `${chartHeight}px`,
                  }}
                >
                  <Line
                    data={this.state.chartData}
                    // width={scaleValueObject.newMoviePrintWidth}
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
                        },
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
              )}
              <div
                onKeyDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
                onMouseOver={e => e.stopPropagation()}
              >
                <Modal
                  open={this.state.showTransformModal}
                  onClose={() => this.setState({ showTransformModal: false })}
                  size="small"
                  closeIcon
                >
                  <Modal.Header>Set transform</Modal.Header>
                  <Modal.Content image>
                    <Modal.Description>
                      <Form onSubmit={this.onChangeTransform}>
                        <Form.Group>
                          <Header as="h3">Cropping in pixel</Header>
                          <Form.Input
                            name="cropTop"
                            label="From top"
                            placeholder="top"
                            type="number"
                            min="0"
                            width={3}
                            defaultValue={this.state.transformObject.cropTop}
                          />
                          <Form.Input
                            name="cropBottom"
                            label="From bottom"
                            placeholder="bottom"
                            type="number"
                            min="0"
                            width={3}
                            defaultValue={this.state.transformObject.cropBottom}
                          />
                          <Form.Input
                            name="cropLeft"
                            label="From left"
                            placeholder="left"
                            type="number"
                            min="0"
                            width={3}
                            defaultValue={this.state.transformObject.cropLeft}
                          />
                          <Form.Input
                            name="cropRight"
                            label="From right"
                            placeholder="right"
                            type="number"
                            min="0"
                            width={3}
                            defaultValue={this.state.transformObject.cropRight}
                          />
                        </Form.Group>
                        <Form.Button content="Update cropping" />
                      </Form>
                    </Modal.Description>
                  </Modal.Content>
                </Modal>
                <Modal
                  open={this.state.showSaveThumbModal}
                  onClose={() => this.setState({ showSaveThumbModal: false })}
                  size="small"
                  closeIcon
                >
                  <Modal.Header>Save thumb</Modal.Header>
                  <Modal.Content image>
                    <Modal.Description>
                      <Form onSubmit={this.onChangeTransform}>
                        <Form.Group>
                          <Header as="h3">Cropping in pixel</Header>
                          <Form.Input
                            name="cropTop"
                            label="From top"
                            placeholder="top"
                            type="number"
                            min="0"
                            width={3}
                            defaultValue={this.state.transformObject.cropTop}
                          />
                        </Form.Group>
                        <Form.Button content="Update cropping" />
                      </Form>
                    </Modal.Description>
                  </Modal.Content>
                </Modal>
              </div>
              <Modal
                open={this.state.savingAllMoviePrints}
                basic
                size="tiny"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  margin: 'auto !important',
                }}
              >
                <Container textAlign="center">
                  <Header as="h2" inverted>
                    {`Saving ${this.state.sheetsToPrint.filter(item => item.status === 'done').length + 1} of ${
                      this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length
                    } MoviePrints`}
                  </Header>
                  {!fileToPrint && <Loader active size="mini" inline />}
                  {fileToPrint || ' '}
                  <Progress
                    percent={
                      ((this.state.sheetsToPrint.filter(item => item.status === 'done').length + 1.0) /
                        this.state.sheetsToPrint.filter(item => item.status !== 'undefined').length) *
                      100
                    }
                    size="tiny"
                    indicating
                    inverted
                  />
                  <Divider hidden />
                  <Button color="red" onClick={() => this.setState({ savingAllMoviePrints: false })}>
                    <Icon name="remove" /> Cancel
                  </Button>
                </Container>
              </Modal>
              <ToastContainer
                transition={Zoom}
                draggable={false}
                hideProgressBar
                progressClassName={stylesPop.toastProgress}
              />
              {dropzoneActive && (
                <div
                  className={`${styles.dropzoneshow} ${isDragAccept ? styles.dropzoneshowAccept : ''} ${
                    isDragReject ? styles.dropzoneshowReject : ''
                  }`}
                >
                  <div className={styles.dropzoneshowContent}>
                    {`${
                      isDragAccept
                        ? this.state.keyObject.altKey
                          ? 'CLEAR LIST AND ADD MOVIES'
                          : 'ADD MOVIES TO LIST'
                        : ''
                    } ${isDragReject ? 'NOT ALLOWED' : ''}`}
                    <div className={styles.dropZoneSubline}>
                      {`${
                        isDragAccept
                          ? this.state.keyObject.altKey
                            ? ''
                            : 'PRESS ALT TO CLEAR LIST AND ADD MOVIES'
                          : ''
                      }`}
                    </div>
                  </div>
                </div>
              )}
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
  const sheetsArray =
    sheetsByFileId[currentFileId] === undefined ? [] : Object.getOwnPropertyNames(sheetsByFileId[currentFileId]);
  const allThumbs =
    sheetsByFileId[currentFileId] === undefined || sheetsByFileId[currentFileId][settings.currentSheetId] === undefined
      ? undefined
      : sheetsByFileId[currentFileId][settings.currentSheetId].thumbsArray;
  const allScenes =
    sheetsByFileId[currentFileId] === undefined || sheetsByFileId[currentFileId][settings.currentSheetId] === undefined
      ? undefined
      : sheetsByFileId[currentFileId][settings.currentSheetId].sceneArray;
  const arrayOfCuts = allScenes === undefined ? [] : allScenes.map(scene => scene.start);
  return {
    sheetsArray,
    sheetsByFileId,
    thumbs: getVisibleThumbs(allThumbs, visibilitySettings.visibilityFilter),
    allThumbs,
    currentFileId,
    currentSheetId,
    files,
    file: files.find(file => file.id === currentFileId),
    allScenes,
    scenes: getVisibleThumbs(allScenes, visibilitySettings.visibilityFilter),
    arrayOfCuts,
    settings,
    visibilitySettings,
    defaultThumbCount: settings.defaultThumbCount,
    defaultColumnCount: settings.defaultColumnCount,
  };
};

App.contextTypes = {
  store: PropTypes.object,
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
  dispatch: PropTypes.func.isRequired,
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
  allScenes: PropTypes.array,
  scenes: PropTypes.array,
  visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(App);
