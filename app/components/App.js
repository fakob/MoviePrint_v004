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
  addDefaultThumbs, setDefaultRowCount, setDefaultColumnCount,
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
      showEditGrid: true,
      contentHeight: 0,
      contentWidth: 0,
      columnCountTemp: undefined,
      rowCountTemp: undefined,
      columnCount: undefined,
      rowCount: undefined,
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

    this.showEditGrid = this.showEditGrid.bind(this);
    this.hideEditGrid = this.hideEditGrid.bind(this);
    this.onShowThumbs = this.onShowThumbs.bind(this);
    this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);

    this.updateContentWidthAndHeight = this.updateContentWidthAndHeight.bind(this);

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;

    this.setState({
      columnCountTemp: store.getState().undoGroup.present.settings.defaultColumnCount,
      rowCountTemp: store.getState().undoGroup.present.settings.defaultRowCount,
      columnCount: store.getState().undoGroup.present.settings.defaultColumnCount,
      rowCount: store.getState().undoGroup.present.settings.defaultRowCount,
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

  // componentDidMount() {
  //   console.log(this.props);
  //   const { store } = this.context;
  //   this.unsubscribe = store.subscribe(() => this.forceUpdate());
  //   store.getState().undoGroup.present.files.map((singleFile) => {
  //     if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined) {
  //       store.dispatch(updateObjectUrlsFromThumbList(
  //         singleFile.id,
  //         Object.values(store.getState().undoGroup.present
  //           .thumbsByFileId[singleFile.id]
  //           .thumbs).map((a) => a.id)
  //       ));
  //     }
  //   });
  // }

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
          store.dispatch(toggleRightSidebar());
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
    console.log('Files dropped: ', files);
    this.setState({ className: `${styles.dropzonehide}` });
    if (Array.from(files).some(file => file.type.match('video.*'))) {
      this.setState({ showPlaceholder: true });
      store.dispatch(setNewMovieList(files));
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

  showEditGrid() {
    this.setState({ showEditGrid: true });
  }

  hideEditGrid() {
    this.setState({ showEditGrid: false });
  }

  onShowThumbs() {
    const { store } = this.context;
    if (this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
      store.dispatch(setVisibilityFilter('SHOW_ALL'));
    } else {
      store.dispatch(setVisibilityFilter('SHOW_VISIBLE'));
    }
  }

  onSaveMoviePrint() {
    saveMoviePrint(this.props.file);
  }


  onChangeRow = (value) => {
    this.setState({ rowCountTemp: value });
  };

  onChangeColumn = (value) => {
    this.setState({ columnCountTemp: value });
  };

  onApplyClick = () => {
    this.setState({ rowCount: this.state.rowCountTemp });
    this.setState({ columnCount: this.state.columnCountTemp });
    this.props.onThumbCountChange(this.state.columnCountTemp, this.state.rowCountTemp);
    this.props.hideEditGrid();
  };

  onCancelClick = () => {
    this.setState({ rowCountTemp: this.state.rowCount });
    this.setState({ columnCountTemp: this.state.columnCount });
    this.props.hideEditGrid();
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
              <Sidebar.Pusher>
                <div className={`${styles.ItemMain}`}>
                  <SortedVisibleThumbGrid
                    showEditGrid={this.state.showEditGrid}
                    showPlaceholder={this.state.showPlaceholder}

                    columnWidth={this.props.defaultColumnCount
                      * thumbnailWidthPlusMargin}
                    contentHeight={this.state.contentHeight}
                    contentWidth={this.state.contentWidth}
                    parentMethod={this.openModal}

                    columnCount={this.state.columnCountTemp}
                    rowCount={this.state.rowCountTemp}

                    hideEditGrid={this.hideEditGrid}
                    onThumbCountChange={(columnCount, rowCount) => {
                      store.dispatch(setDefaultColumnCount(columnCount));
                      store.dispatch(setDefaultRowCount(rowCount));
                      if (this.props.currentFileId !== undefined) {
                        store.dispatch(addDefaultThumbs(
                          this.props.file,
                          columnCount * rowCount
                        ));
                      }
                    }}
                  />
                </div>
              </Sidebar.Pusher>
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
                  rowCountTemp={this.state.rowCountTemp}
                  columnCount={this.state.columnCount}
                  rowCount={this.state.rowCount}
                  onChangeColumn={this.onChangeColumn}
                  onChangeRow={this.onChangeRow}
                  onApplyClick={this.onApplyClick}
                  onCancelClick={this.onCancelClick}
                />
              </Sidebar>
            </Sidebar.Pushable>
          </div>
          <div className={`${styles.SiteFooter}`}>
            <Footer />
          </div>
        </div>
        <Sticky
          className={`${styles.FixedActionMenu}`}
        >
          <Menu compact icon="labeled" vertical size="mini">

            {this.state.showEditGrid === false &&
              <Menu.Item name="hide" onClick={this.onShowThumbs}>
                <Icon
                  name={(this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') ? 'unhide' : 'hide'}
                />
                {(this.props.visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') ? 'Show' : 'Hide'}
              </Menu.Item>
            }

            {this.state.showEditGrid === false &&
              <Menu.Item name="save" onClick={this.onSaveMoviePrint}>
                <Icon
                  name="save"
                />
                Save
              </Menu.Item>
            }

            <Menu.Item name="edit" onClick={(this.state.showEditGrid === false) ? this.showEditGrid : this.hideEditGrid}>
              <Icon
                name={(this.state.showEditGrid === false) ? 'edit' : 'cancel'}
              />
              {(this.state.showEditGrid === false) ? 'Edit' : 'Cancel'}
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
    defaultRowCount: state.undoGroup.present.settings.defaultRowCount,
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
    //   dispatch(setDefaultRowCount(value));
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
    //       this.props.defaultRowCount *
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
