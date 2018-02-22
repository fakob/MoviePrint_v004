import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import keydown from 'react-keydown';
// import domtoimage from 'dom-to-image';
import { Sidebar, Sticky, Menu, Icon } from 'semantic-ui-react';
import Modal from 'react-modal';
import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import VideoPlayer from '../components/VideoPlayer';
import { saveMoviePrint } from '../utils/utils';
import Footer from './Footer';
import Header from './Header';
import styles from './App.css';

import { setNewMovieList, toggleLeftSidebar, toggleRightSidebar,
  showRightSidebar, hideRightSidebar, zoomIn, zoomOut,
  addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount,
  setVisibilityFilter, startIsManipulating, stopIsManipulating,
  setCurrentFileId, changeThumb } from '../actions';

let thumbnailWidthPlusMargin;

class App extends Component {
  constructor() {
    super();
    this.state = {
      className: `${styles.dropzonehide}`,
      isManipulatingSliderInHeader: false,
      showPlaceholder: true,
      modalIsOpen: false,
      editGrid: true,
      contentHeight: 0,
      contentWidth: 0,
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

    this.editGrid = this.editGrid.bind(this);
    this.hideEditGrid = this.hideEditGrid.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);

    this.updateContentWidthAndHeight = this.updateContentWidthAndHeight.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onReCaptureClick = this.onReCaptureClick.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;

    this.setState({
      columnCountTemp: store.getState().undoGroup.present.settings.defaultColumnCount,
      thumbCountTemp: store.getState().undoGroup.present.settings.defaultThumbCount,
      columnCount: store.getState().undoGroup.present.settings.defaultColumnCount,
      thumbCount: store.getState().undoGroup.present.settings.defaultThumbCount,
    });
  }

  componentDidMount() {
    const { store } = this.context;
    thumbnailWidthPlusMargin = store.getState().undoGroup.present.settings.defaultThumbnailWidth +
      store.getState().undoGroup.present.settings.defaultMargin;

    window.addEventListener('mouseup', this.onDragLeave);
    window.addEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').addEventListener('dragleave', this.onDragLeave);
    window.addEventListener('drop', this.onDrop);
    document.addEventListener('keydown', this.handleKeyPress);

    this.updateContentWidthAndHeight();
    window.addEventListener('resize', this.updateContentWidthAndHeight);
  }

  componentWillReceiveProps(nextProps) {

    if (!(this.props.files.findIndex((file) =>
        file.id === this.props.currentFileId) >= 0 &&
      this.props.thumbsByFileId[this.props.currentFileId] !== undefined &&
      Object.keys(this.props.files).length !== 0)) {
      // console.log('showPlaceholder: true');
      // this.setState({ showPlaceholder: true });
    } else {
      console.log('showPlaceholder: false');
      this.setState({ showPlaceholder: false });
    }
  }

  componentDidUpdate() {
    this.updateContentWidthAndHeight();
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onDragLeave);
    window.removeEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').removeEventListener('dragleave', this.onDragLeave);
    window.removeEventListener('drop', this.onDrop);
    document.removeEventListener('keydown', this.handleKeyPress);

    window.removeEventListener('resize', this.updateContentWidthAndHeight);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    const { store } = this.context;

    if (event) {
      switch (event.which) {
        case 49: // press 1
          store.dispatch(toggleLeftSidebar());
          break;
        case 51: // press 3
          if (store.getState().visibilitySettings.showRightSidebar) {
            this.onCancelClick();
          } else {
            this.editGrid();
          }
          break;
        case 80: // press 'p'
          saveMoviePrint(this.props.file);
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
      this.setState({ showPlaceholder: true });
      store.dispatch(setNewMovieList(files, settings));
    }
    return false;
  }

  updateContentWidthAndHeight() {
    if (this.state.contentHeight !== this.siteContent.clientHeight) {
      this.setState({ contentHeight: this.siteContent.clientHeight });
    }
    if (this.state.contentWidth !== this.siteContent.clientWidth) {
      this.setState({ contentWidth: this.siteContent.clientWidth });
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

  editGrid() {
    const { store } = this.context;
    this.setState({ editGrid: true });
    store.dispatch(showRightSidebar());
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
    saveMoviePrint(this.props.file);
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
    console.log(`${this.state.columnCount} : ${this.state.columnCountTemp} || ${this.state.thumbCount} : ${this.state.thumbCountTemp}`);
    this.setState({ columnCount: this.state.columnCountTemp });
    if (this.state.reCapture) {
      this.setState({ thumbCount: this.state.thumbCountTemp });
      this.onThumbCountChange(this.state.columnCountTemp, this.state.thumbCountTemp);
    }
    this.hideEditGrid();
  };

  onCancelClick = () => {
    this.setState({ thumbCountTemp: this.state.thumbCount });
    this.setState({ columnCountTemp: this.state.columnCount });
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
          <div className={`${styles.SiteHeader}`}>

          </div>
          <div
            className={`${styles.SiteContent}`}
            ref={(el) => { this.siteContent = el; }}
          >
            <Sidebar.Pushable
              // as={Segment}
              className={`${styles.SidebarPushable}`}
            >
              <Sidebar
                className={`${styles.ItemLeftSideBar}`}
                // as={Menu}
                animation="scale down"
                width="wide"
                visible={state.visibilitySettings.showLeftSidebar}
                icon="labeled"
                // vertical
              >
                <FileList />
              </Sidebar>
              <Sidebar
                // as={Menu}
                direction="right"
                animation="scale down"
                width="wide"
                visible={state.visibilitySettings.showRightSidebar}
                icon="labeled"
                // vertical
              >
                <SettingsList
                  columnCountTemp={this.state.columnCountTemp}
                  thumbCountTemp={this.state.thumbCountTemp}
                  rowCountTemp={Math.ceil(this.state.thumbCountTemp / this.state.columnCountTemp)}
                  columnCount={this.state.columnCount}
                  rowCount={Math.ceil(this.state.thumbCount / this.state.columnCount)}
                  reCapture={this.state.reCapture}
                  onChangeColumn={this.onChangeColumn}
                  onChangeRow={this.onChangeRow}
                  onReCaptureClick={this.onReCaptureClick}
                  onApplyClick={this.onApplyClick}
                  onCancelClick={this.onCancelClick}
                />
              </Sidebar>
              <Sidebar.Pusher>
                <div className={`${styles.ItemMain}`}>
                  <SortedVisibleThumbGrid
                    editGrid={this.state.editGrid}
                    showPlaceholder={this.state.showPlaceholder}

                    columnWidth={this.props.defaultColumnCount
                      * thumbnailWidthPlusMargin}
                    contentHeight={this.state.contentHeight}
                    contentWidth={this.state.contentWidth}
                    parentMethod={this.openModal}

                    columnCount={this.state.columnCountTemp}
                    thumbCount={this.state.thumbCountTemp}
                    reCapture={this.state.reCapture}
                  />
                </div>
              </Sidebar.Pusher>
            </Sidebar.Pushable>
          </div>
          <div className={`${styles.SiteFooter}`}>
            <Footer />
          </div>
        </div>
        <Sticky
          className={`${styles.FixedActionMenu}`}
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
        <div id="dragbox" className={this.state.className}>
          Drop movie files
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  let tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
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

const mapDispatchToProps = dispatch => {
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
export default connect(mapStateToProps)(App);
