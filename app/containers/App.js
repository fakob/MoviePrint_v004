import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import { TransitionablePortal, Segment } from 'semantic-ui-react';

import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import ThumbEmpty from '../components/ThumbEmpty';
import { getLowestFrame, getHighestFrame, getVisibleThumbs, getColumnCount, getThumbsCount, getMoviePrintColor, getScaleValueObject } from '../utils/utils';
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
  setDefaultPaperAspectRatioInv, updateInOutPoint
} from '../actions';
import { MENU_HEADER_HEIGHT, MENU_FOOTER_HEIGHT, ZOOM_SCALE, SHOW_PAPER_ADJUSTMENT_SCALE } from '../utils/constants';

import steps from '../img/MoviePrint-steps.svg';

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

const setColumnAndThumbCount = (that, columnCount, thumbCount) => {
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
      zoom: false
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
    this.switchToPrintView = this.switchToPrintView.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);

    this.updatecontainerWidthAndHeight = this.updatecontainerWidthAndHeight.bind(this);
    this.updateScaleValue = this.updateScaleValue.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onChangeColumnAndApply = this.onChangeColumnAndApply.bind(this);
    this.onShowPaperPreviewClick = this.onShowPaperPreviewClick.bind(this);
    this.onPaperAspectRatioClick = this.onPaperAspectRatioClick.bind(this);
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
  }

  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('receive-get-file-details', (event, fileId, filePath, posterFrameId, lastItem, frameCount, width, height, fps, fourCC) => {
      store.dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
      ipcRenderer.send('send-get-poster-frame', fileId, filePath, posterFrameId, lastItem);
    });

    // poster frames don't have thumbId
    ipcRenderer.on('receive-get-poster-frame', (event, fileId, filePath, posterFrameId, base64, frameNumber, useRatio, lastItem) => {
      store.dispatch(updateFileDetailUseRatio(fileId, useRatio));
      store.dispatch(updateThumbImage(fileId, '', posterFrameId, base64, frameNumber, 1));
      ipcRenderer.send('send-get-in-and-outpoint', fileId, filePath, useRatio, lastItem);
    });

    ipcRenderer.on('receive-get-in-and-outpoint', (event, fileId, fadeInPoint, fadeOutPoint, lastItem) => {
      store.dispatch(updateInOutPoint(fileId, fadeInPoint, fadeOutPoint));
      if (lastItem) {
        console.log('I am the lastItem');
        store.dispatch(setCurrentFileId(store.getState().undoGroup.present.files[0].id));
        this.updateScaleValue(); // so the aspect ratio of the thumbs are correct after drag
        store.dispatch(clearThumbs());
        store.dispatch(addDefaultThumbs(
          store.getState().undoGroup.present.files[0],
          store.getState().undoGroup.present.settings.defaultThumbCount
        ));
      }
    });

    ipcRenderer.on('receive-get-thumbs', (event, fileId, thumbId, frameId, base64, frameNumber) => {
      store.dispatch(updateThumbImage(fileId, thumbId, frameId, base64, frameNumber));
    });

    ipcRenderer.on('received-saved-file', (event, path) => {
      setTimeout(
        this.setState({ savingMoviePrint: false }),
        1000
      ); // adding timeout to prevent clicking multiple times
      console.log(`Saved file: ${path}`);
    });

    ipcRenderer.on('received-saved-file-error', (event, message) => {
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
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('keyup', this.handleKeyUp);

    window.removeEventListener('resize', this.updatecontainerWidthAndHeight);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

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
      store.dispatch(setNewMovieList(files, settings));
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

  render() {
    const { accept, dropzoneActive } = this.state;

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
                    onToggleShowHiddenThumbsClick={this.onToggleShowHiddenThumbsClick}
                    onThumbInfoClick={this.onThumbInfoClick}
                    openDialog={() => this.dropzoneRef.open()}
                    zoom={this.state.zoom}
                  />
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
                    // onClose={this.handleClose}
                    open={this.state.savingMoviePrint}
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
                    <Segment
                      className={stylesPop.toast}
                    >
                      Saving MoviePrint
                    </Segment>
                  </TransitionablePortal>
                  <Footer
                    visibilitySettings={this.props.visibilitySettings}
                    file={this.props.file}
                    onSaveMoviePrint={this.onSaveMoviePrint}
                    savingMoviePrint={this.state.savingMoviePrint}
                    showMoviePrintView={this.props.visibilitySettings.showMoviePrintView}
                  />
                </div>
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
  }),
  settings: PropTypes.object.isRequired,
  thumbs: PropTypes.array,
  thumbsByFileId: PropTypes.object,
  visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(App);
