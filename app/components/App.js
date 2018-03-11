import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import keydown from 'react-keydown';
import { Sticky, Menu, Icon } from 'semantic-ui-react';
import Modal from 'react-modal';
import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import VideoPlayer from '../components/VideoPlayer';
import { saveMoviePrint, getColumnCount, getVisibleThumbsCount } from '../utils/utils';
import styles from './App.css';
import {
  setNewMovieList, toggleLeftSidebar, showRightSidebar, hideRightSidebar,
  zoomIn, zoomOut, addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount,
  setVisibilityFilter, setCurrentFileId, changeThumb, updateFileColumnCount,
  updateFileDetails, clearThumbs, updateThumbImage, setDefaultMargin, setDefaultShowHeader,
  setDefaultRoundedCorners, setDefaultThumbInfo, setDefaultOutputPath
} from '../actions';

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
      className: `${styles.dropzonehide}`,
      modalIsOpen: false,
      editGrid: false,
      containerHeight: 0,
      containerWidth: 0,
      columnCountTemp: undefined,
      thumbCountTemp: undefined,
      columnCount: undefined,
      thumbCount: undefined,
      reCapture: false,
    };

    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.setNewFrame = this.setNewFrame.bind(this);

    this.toggleLeftSidebar = this.toggleLeftSidebar.bind(this);
    this.editGrid = this.editGrid.bind(this);
    this.hideEditGrid = this.hideEditGrid.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);

    this.updatecontainerWidthAndHeight = this.updatecontainerWidthAndHeight.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onChangeColumnAndApply = this.onChangeColumnAndApply.bind(this);
    this.onReCaptureClick = this.onReCaptureClick.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);

    this.onChangeMargin = this.onChangeMargin.bind(this);
    this.onShowHeaderClick = this.onShowHeaderClick.bind(this);
    this.onRoundedCornersClick = this.onRoundedCornersClick.bind(this);
    this.onThumbInfoClick = this.onThumbInfoClick.bind(this);
    this.onChangeOutputPathClick = this.onChangeOutputPathClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;
    setColumnAndThumbCount(
      this,
      getColumnCount(
        this.props.file,
        store.getState().undoGroup.present.settings
      ),
      getVisibleThumbsCount(
        this.props.file,
        this.props.thumbsByFileId, store.getState().undoGroup.present.settings
      ),
    );
  }

  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('receive-get-file-details', (event, fileId, filePath, posterFrameId, lastItem, frameCount, width, height, fps, fourCC) => {
      store.dispatch(updateFileDetails(fileId, frameCount, width, height, fps, fourCC));
      ipcRenderer.send('send-get-poster-frame', fileId, filePath, posterFrameId);
      if (lastItem) {
        console.log('I am the lastItem');
        store.dispatch(setCurrentFileId(store.getState().undoGroup.present.files[0].id));
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

    // poster frames don't have thumbId
    ipcRenderer.on('receive-get-poster-frame', (event, fileId, posterFrameId, base64, frameNumber) => {
      store.dispatch(updateThumbImage(fileId, '', posterFrameId, base64, frameNumber, 1));
    });

    ipcRenderer.on('received-saved-file', (event, path) => {
      console.log(`Saved file: ${path}`);
    });

    ipcRenderer.on('received-saved-file-error', (event, message) => {
      console.log(`Saved file error: ${message}`);
    });

    window.addEventListener('mouseup', this.onDragLeave);
    window.addEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').addEventListener('dragleave', this.onDragLeave);
    window.addEventListener('drop', this.onDrop);
    document.addEventListener('keydown', this.handleKeyPress);

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
        // const newThumbCount = nextProps.thumbsByFileId[nextProps.file.id].thumbs
        //   .filter(thumb => thumb.hidden === false).length;
        const newThumbCount = getVisibleThumbsCount(
          nextProps.file,
          nextProps.thumbsByFileId, state.undoGroup.present.settings
        );
        setColumnAndThumbCount(
          this,
          nextProps.file.columnCount,
          newThumbCount
        );
        console.log('currentFileId changed');
        console.log(nextProps.file.columnCount);
        console.log(newThumbCount);
      // } else if (this.props.thumbsByFileId[this.props.file.id] !== undefined &&
      //   this.props.thumbsByFileId[this.props.file.id].thumbs
      //     .filter(thumb => thumb.hidden === false).length !==
      //     nextProps.thumbsByFileId[nextProps.file.id].thumbs
      //       .filter(thumb => thumb.hidden === false).length) {
      }
      const oldThumbCount = getVisibleThumbsCount(
        this.props.file,
        this.props.thumbsByFileId, state.undoGroup.present.settings
      );
      const newThumbCount = getVisibleThumbsCount(
        nextProps.file,
        nextProps.thumbsByFileId, state.undoGroup.present.settings
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

  componentDidUpdate() {
    this.updatecontainerWidthAndHeight();
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onDragLeave);
    window.removeEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').removeEventListener('dragleave', this.onDragLeave);
    window.removeEventListener('drop', this.onDrop);
    document.removeEventListener('keydown', this.handleKeyPress);

    window.removeEventListener('resize', this.updatecontainerWidthAndHeight);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    const { store } = this.context;

    if (event) {
      switch (event.which) {
        case 49: // press 1
          this.toggleLeftSidebar();
          break;
        case 51: // press 3
          if (store.getState().visibilitySettings.showRightSidebar) {
            this.onCancelClick();
          } else {
            this.editGrid();
          }
          break;
        case 80: // press 'p'
          this.onSaveMoviePrint();
          break;
        default:
      }
      console.log(`ctrl:${event.ctrlKey}, shift:${event.shiftKey}, meta:${event.metaKey}, keynum:${event.which}`);
    }
  }

  onDragEnter(e) {
    this.setState({ className: `${styles.dropzoneshow}` });
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  onDragLeave(e) {
    this.setState({ className: `${styles.dropzonehide}` });
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  onDrop(e) {
    e.preventDefault();
    const { store } = this.context;
    const files = e.dataTransfer.files;
    const settings = store.getState().undoGroup.present.settings;
    console.log('Files dropped: ', files);
    this.setState({ className: `${styles.dropzonehide}` });
    if (Array.from(files).some(file => file.type.match('video.*'))) {
      store.dispatch(setNewMovieList(files, settings));
    }
    return false;
  }

  updatecontainerWidthAndHeight() {
    const { store } = this.context;
    const state = store.getState();
    if (this.state.containerHeight !== this.siteContent.clientHeight) {
      this.setState({ containerHeight: this.siteContent.clientHeight });
    }
    const containerWidthMinusSidebar =
      this.siteContent.clientWidth -
      (state.visibilitySettings.showLeftSidebar ? 350 : 0) -
      (state.visibilitySettings.showRightSidebar ? 350 : 0);
    if (this.state.containerWidth !== containerWidthMinusSidebar) {
      this.setState({ containerWidth: containerWidthMinusSidebar });
    }
  }

  openModal(file, thumbId, frameNumber) {
    this.setState({ thumbId });
    this.setState({ frameNumber });
    this.setState({ modalIsOpen: true });
    // const positionRatio = (this.state.frameNumber * 1.0) / this.props.file.frameCount;
    // this.videoPlayer.onPositionRatioUpdate(positionRatio);
  }

  afterOpenModal() {
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  setNewFrame(thumbId, newPositionRatio) {
    const { store } = this.context;
    const newFrameNumber = newPositionRatio * this.props.file.frameCount;
    store.dispatch(changeThumb(this.props.file, thumbId, newFrameNumber));
    this.closeModal();
  }

  toggleLeftSidebar() {
    const { store } = this.context;
    store.dispatch(toggleLeftSidebar());
  }

  editGrid() {
    const { store } = this.context;
    this.setState({ editGrid: true });
    store.dispatch(showRightSidebar());
    console.log(this.state.columnCount);
    console.log(this.state.thumbCount);
    setColumnAndThumbCount(
      this,
      getColumnCount(
        this.props.file,
        store.getState().undoGroup.present.settings
      ),
      getVisibleThumbsCount(
        this.props.file,
        this.props.thumbsByFileId, store.getState().undoGroup.present.settings
      ),
    );
  }

  hideEditGrid() {
    const { store } = this.context;
    this.setState({ editGrid: false });
    store.dispatch(hideRightSidebar());
  }

  onShowThumbs() {
    const { store } = this.context;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
      store.dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      store.dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  }

  onZoomOut() {
    const { store } = this.context;
    if (this.props.visibilitySettings.zoomOut) {
      store.dispatch(zoomIn());
    } else {
      store.dispatch(zoomOut());
    }
  }

  onSaveMoviePrint() {
    saveMoviePrint('ThumbGrid', this.props.settings.defaultOutputPath, this.props.file);
  }

  onChangeRow = (value) => {
    this.setState({ thumbCountTemp: this.state.columnCountTemp * value });
  };

  onChangeColumn = (value) => {
    const tempRowCount = Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp);
    this.setState({ columnCountTemp: value });
    if (this.state.reCapture) {
      this.setState({ thumbCountTemp: tempRowCount * value });
    }
  };

  onChangeColumnAndApply = (value) => {
    const { store } = this.context;
    this.setState({
      columnCountTemp: value,
      columnCount: value
    });
    if (typeof this.props.file !== 'undefined') {
      store.dispatch(updateFileColumnCount(
        this.props.file.id,
        value
      ));
    }
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
    if (typeof this.props.file !== 'undefined') {
      store.dispatch(updateFileColumnCount(
        this.props.file.id,
        this.state.columnCountTemp
      ));
    }
    this.hideEditGrid();
  };

  onCancelClick = () => {
    console.log(this.state.columnCount);
    console.log(this.state.thumbCount);
    this.setState({ columnCountTemp: this.state.columnCount });
    this.setState({ thumbCountTemp: this.state.thumbCount });
    this.hideEditGrid();
  };

  onThumbCountChange = (columnCount, thumbCount) => {
    const { store } = this.context;
    store.dispatch(setDefaultColumnCount(columnCount));
    store.dispatch(setDefaultThumbCount(thumbCount));
    if (this.props.currentFileId !== undefined) {
      store.dispatch(addDefaultThumbs(
        this.props.file,
        thumbCount
      ));
    }
  };

  onChangeMargin = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultMargin(value));
  };

  onShowHeaderClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultShowHeader(value));
  };

  onRoundedCornersClick = (value) => {
    const { store } = this.context;
    store.dispatch(setDefaultRoundedCorners(value));
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
      store.dispatch(setDefaultOutputPath(newPath));
    }
  };

  render() {
    const { store } = this.context;
    const state = store.getState();

    return (
      <div>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          appElement={this.siteContent}
          className={`${styles.ReactModalContent}`}
          overlayClassName={`${styles.ReactModalOverlay}`}
        >
          <div>
            { this.props.file ?
              <VideoPlayer
                ref={(el) => { this.videoPlayer = el; }}
                path={this.props.file ? (this.props.file.path || '') : ''}
                thumbId={this.state.thumbId}
                positionRatio={(this.state.frameNumber * 1.0) / (this.props.file.frameCount || 1)}
                setNewFrame={this.setNewFrame}
                closeModal={this.closeModal}
              /> : ''
            }
          </div>
        </Modal>
        <div className={`${styles.Site}`}>
          {/* <div className={`${styles.SiteHeader}`}>

          </div> */}
          <div
            className={`${styles.SiteContent}`}
            ref={(el) => { this.siteContent = el; }}
          >
            <div
              className={`${styles.ItemSideBar} ${styles.ItemLeftSideBar} ${state.visibilitySettings.showLeftSidebar ? styles.ItemLeftSideBarAnim : ''}`}
              // visible={state.visibilitySettings.showLeftSidebar}
              // vertical
            >
              <FileList />
            </div>
            <div
              className={`${styles.ItemSideBar} ${styles.ItemRightSideBar} ${state.visibilitySettings.showRightSidebar ? styles.ItemRightSideBarAnim : ''}`}
            >
              <SettingsList
                settings={this.props.settings}
                columnCountTemp={this.state.columnCountTemp}
                thumbCountTemp={this.state.thumbCountTemp}
                rowCountTemp={Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp)}
                columnCount={this.state.columnCount}
                rowCount={Math.ceil(this.state.thumbCount / this.state.columnCount)}
                reCapture={this.state.reCapture}
                onChangeColumn={this.onChangeColumn}
                onChangeColumnAndApply={this.onChangeColumnAndApply}
                onChangeRow={this.onChangeRow}
                onReCaptureClick={this.onReCaptureClick}
                onApplyClick={this.onApplyClick}
                onCancelClick={this.onCancelClick}
                onChangeMargin={this.onChangeMargin}
                onShowHeaderClick={this.onShowHeaderClick}
                onRoundedCornersClick={this.onRoundedCornersClick}
                onThumbInfoClick={this.onThumbInfoClick}
                onChangeOutputPathClick={this.onChangeOutputPathClick}
              />
            </div>
            <div
              ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
              className={`${styles.ItemMain} ${state.visibilitySettings.showLeftSidebar ? styles.ItemMainLeftAnim : ''} ${state.visibilitySettings.showRightSidebar ? styles.ItemMainRightAnim : ''}`}
            >
              <SortedVisibleThumbGrid
                inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                editGrid={this.state.editGrid}

                containerHeight={this.state.containerHeight}
                containerWidth={this.state.containerWidth}
                parentMethod={this.openModal}

                columnCount={this.state.editGrid ?
                  this.state.columnCountTemp :
                  (this.props.file ? this.props.file.columnCount || this.state.columnCountTemp :
                    this.state.columnCountTemp)}
                thumbCount={this.state.thumbCountTemp}
                reCapture={this.state.reCapture}

                zoomOut={this.props.visibilitySettings.zoomOut}
              />
            </div>
          </div>
        </div>
        <Sticky
          className={`${styles.FixedActionMenuRight}`}
        >
          <Menu compact icon="labeled" size="mini">

            {this.state.editGrid === false &&
              <Menu.Item name="zoom" onClick={this.onZoomOut}>
                <Icon
                  name={(this.props.visibilitySettings.zoomOut) ? 'zoom in' : 'zoom out'}
                />
                {(this.props.visibilitySettings.zoomOut) ? 'Zoom in' : 'Zoom out'}
              </Menu.Item>
            }

            {this.state.editGrid === false &&
              <Menu.Item name="hide" onClick={this.onShowThumbs}>
                <Icon
                  name={(this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') ? 'unhide' : 'hide'}
                />
                {(this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') ? 'Show' : 'Hide'}
              </Menu.Item>
            }

            {this.state.editGrid === false &&
              <Menu.Item name="save" onClick={this.onSaveMoviePrint}>
                <Icon
                  name="save"
                />
                Save
              </Menu.Item>
            }

            <Menu.Item name="edit" onClick={(this.state.editGrid === false) ? this.editGrid : this.hideEditGrid}>
              <Icon
                name={(this.state.editGrid === false) ? 'edit' : 'cancel'}
              />
              {(this.state.editGrid === false) ? 'Edit' : 'Cancel'}
            </Menu.Item>

          </Menu>
        </Sticky>
        <Sticky
          className={`${styles.FixedActionMenuLeft}`}
        >
          <Menu compact icon="labeled" size="mini">

            {true &&
              <Menu.Item name="list" onClick={this.toggleLeftSidebar}>
                <Icon
                  name="list"
                />
                {(this.props.visibilitySettings.showLeftSidebar === false) ? 'Show' : 'Hide'}
              </Menu.Item>
            }

          </Menu>
        </Sticky>
        <div id="dragbox" className={this.state.className}>
          Drop movie files
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  return {
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

const mapDispatchToProps = (dispatch) => {
  return {
    // onShowThumbsClick: () => {
    //   if (this.props.visibilityFilter === 'SHOW_VISIBLE') {
    //     dispatch(setVisibilityFilter('SHOW_ALL'));
    //   } else {
    //     dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    //   }
    // },
    // onRowChange: (value) => {
    //   dispatch(setDefaultThumbCount(value));
    //   if (this.props.currentFileId !== undefined) {
    //     dispatch(addDefaultThumbs(
    //       this.props.file,
    //       value *
    //       this.props.defaultColumnCount
    //     ));
    //   }
    // },
    // onColumnChange: (value) => {
    //   dispatch(setDefaultColumnCount(value));
    //   if (this.props.currentFileId !== undefined) {
    //     dispatch(addDefaultThumbs(
    //       this.props.file,
    //       this.props.defaultThumbCount *
    //       value
    //     ));
    //   }
    // },
  };
};

App.contextTypes = {
  store: PropTypes.object
};

// export default App;
export default connect(mapStateToProps, mapDispatchToProps)(App);
