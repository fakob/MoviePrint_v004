import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import keydown from 'react-keydown';
// import domtoimage from 'dom-to-image';
import { Sidebar } from 'semantic-ui-react';
import '../app.global.css';
import FileList from '../containers/FileList';
import SettingsList from '../containers/SettingsList';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import ThumbGridPlaceholder from '../components/ThumbGridPlaceholder';
import { saveMoviePrint } from '../utils/utils';
import Footer from './Footer';
import Header from './Header';
import styles from './App.css';

// import { setMovieList } from '../actions';
import { setNewMovieList, toggleLeftSidebar, toggleRightSidebar,
  addDefaultThumbs, setDefaultRowCount, setDefaultColumnCount,
  setVisibilityFilter, startIsManipulating, stopIsManipulating,
  setCurrentFileId } from '../actions';

const thumbnailWidthPlusMargin = 278;

class App extends Component {
  constructor() {
    super();
    this.state = {
      className: `${styles.dropzonehide}`,
      isManipulatingSliderInHeader: false,
      showPlaceholder: true,
    };

    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentDidMount() {
    window.addEventListener('mouseup', this.onDragLeave);
    window.addEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').addEventListener('dragleave', this.onDragLeave);
    window.addEventListener('drop', this.onDrop);
    document.addEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    const { store } = this.context;

    if (event) {
      switch (event.which) {
        case 49: // press 1
          store.dispatch(
            toggleLeftSidebar()
          );
          break;
        case 51: // press 3
          store.dispatch(
            toggleRightSidebar()
          );
          break;
        case 80: // press 'p'
          saveMoviePrint(this.props.file);
          break;
        default:
      }
      console.log(`ctrl:${event.ctrlKey}, shift:${event.shiftKey}, meta:${event.metaKey}, keynum:${event.which}`);
    }
  }

  componentWillReceiveProps(nextProps) {
    console.log(`isManipulatingSliderInHeader: ${this.state.isManipulatingSliderInHeader}`);
    console.log(`currentFileId: ${this.props.files.findIndex((file) =>
        file.id === this.props.currentFileId) >= 0}`);
    console.log(`thumbs for this fileId exist: ${this.props.thumbsByFileId[this.props.currentFileId] !== undefined}`);
    console.log(this.props.thumbsByFileId[this.props.currentFileId]);
    console.log(`files exist: ${Object.keys(this.props.files).length !== 0}`);

    if (this.state.isManipulatingSliderInHeader ||
      !(this.props.files.findIndex((file) =>
        file.id === this.props.currentFileId) >= 0 &&
      this.props.thumbsByFileId[this.props.currentFileId] !== undefined &&
      Object.keys(this.props.files).length !== 0)) {
      console.log('showPlaceholder: true');
      this.setState({ showPlaceholder: true });
    } else {
      console.log('showPlaceholder: false');
      this.setState({ showPlaceholder: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onDragLeave);
    window.removeEventListener('dragenter', this.onDragEnter);
    window.addEventListener('dragover', this.onDragOver);
    document.getElementById('dragbox').removeEventListener('dragleave', this.onDragLeave);
    window.removeEventListener('drop', this.onDrop);
    document.removeEventListener('keydown', this.handleKeyPress);
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
      store.dispatch(setNewMovieList(files));
    }
    return false;
  }

  render() {
    const { store } = this.context;
    const state = store.getState();

    let visibleThumbGridComponent = null;

    if (this.state.showPlaceholder) {
      visibleThumbGridComponent = (
        <ThumbGridPlaceholder
          thumbsAmount={(this.state.thumbsAmount === undefined) ?
            this.props.defaultRowCount *
            this.props.defaultColumnCount :
            this.state.thumbsAmount}
          file={{
            path: '',
            name: 'placeholder name',
            width: 1920,
            height: 1080
          }}
          axis={'xy'}
          columnWidth={(this.state.tempColumnCount === undefined) ?
            this.props.defaultColumnCount * thumbnailWidthPlusMargin :
            this.state.tempColumnCount * thumbnailWidthPlusMargin}
        />
      );
    } else {
      visibleThumbGridComponent = (
        <SortedVisibleThumbGrid
          columnWidth={this.props.defaultColumnCount
            * thumbnailWidthPlusMargin}
        />
      );
    }

    return (
      <div>
        <div className={`${styles.Site}`}>
          <div className={`${styles.SiteHeader}`}>
            <Header
              currentFileId={this.props.currentFileId}
              file={this.props.file}
              settings={this.props.settings}
              visibilitySettings={this.props.visibilitySettings}
              onShowThumbsClick={this.props.onShowThumbsClick}
              onPrintClick={() => {
                saveMoviePrint(this.props.file);
              }}
              onStartSliding={() => {
                if (!this.state.isManipulatingSliderInHeader) {
                  console.log('started sliding');
                  this.setState({ isManipulatingSliderInHeader: true });
                }
              }}
              onRowSliding={(value) => {
                console.log(value);
                this.setState({ thumbsAmount:
                  (value * this.props.defaultColumnCount)
                });
              }}
              onColumnSliding={(value) => {
                console.log(value);
                this.setState({ thumbsAmount:
                  (this.props.defaultRowCount * value)
                });
                this.setState({ tempColumnCount: value });
              }}
              onRowChange={this.props.onRowChange}
              onColumnChange={this.props.onColumnChange}
            />
          </div>
          <div className={`${styles.SiteContent}`}>
            <Sidebar.Pushable
              // as={Segment}
              className={`${styles.SidebarPushable}`}
            >
              <Sidebar
                className={`${styles.ItemLeftSideBar}`}
                // as={Menu}
                animation="overlay"
                width="wide"
                visible={state.visibilitySettings.showLeftSidebar}
                icon="labeled"
                // vertical
              >
                <FileList />
              </Sidebar>
              <Sidebar.Pusher>
                <div className={`${styles.ItemMain}`}>
                  {visibleThumbGridComponent}
                </div>
              </Sidebar.Pusher>
              <Sidebar
                // as={Menu}
                direction="right"
                animation="push"
                width="wide"
                visible={state.visibilitySettings.showRightSidebar}
                icon="labeled"
                // vertical
              >
                <SettingsList />
              </Sidebar>
            </Sidebar.Pushable>
          </div>
          <div className={`${styles.SiteFooter}`}>
            <Footer />
          </div>
        </div>
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
    onShowThumbsClick: () => {
      if (this.props.visibilityFilter === 'SHOW_VISIBLE') {
        dispatch(setVisibilityFilter('SHOW_ALL'));
      } else {
        dispatch(setVisibilityFilter('SHOW_VISIBLE'));
      }
    },
    onRowChange: (value) => {
      this.setState({ isManipulatingSliderInHeader: false });
      dispatch(
        setDefaultRowCount(
          value
        )
      );
      if (this.props.currentFileId !== undefined) {
        dispatch(
          addDefaultThumbs(
            this.props.file,
            value *
            this.props.defaultColumnCount
          )
        );
      }
    },
    onColumnChange: (value) => {
      this.setState({ isManipulatingSliderInHeader: false });
      dispatch(
        setDefaultColumnCount(
          value
        )
      );
      if (this.props.currentFileId !== undefined) {
        dispatch(
          addDefaultThumbs(
            this.props.file,
            this.props.defaultRowCount *
            value
          )
        );
      }
    },
  };
};

App.contextTypes = {
  store: PropTypes.object
};

// export default App;
export default connect(mapStateToProps, mapDispatchToProps)(App);
