// @flow
import React, { Component } from 'react';
import { Provider, connect } from 'react-redux';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import { getVisibleThumbs, getScaleValueObject, getMoviePrintColor, getColumnCount } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';

const { ipcRenderer } = require('electron');

// export default function WorkerRoot({ store }: RootType) {
class WorkerRoot extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      data: {}
    };

    // this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);
  }


  componentDidMount() {
    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        savingMoviePrint: false
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, data) => {
      console.log(data.file);
      this.setState({
        savingMoviePrint: true,
        data
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.savingMoviePrint && this.state.savingMoviePrint) {
      console.log(this.state.data.file);
      saveMoviePrint(this.state.data.elementId, this.state.data.exportPath, this.state.data.file, this.state.data.scale, this.state.data.outputFormat, this.state.data.overwrite, this.state.data.saveIndividualThumbs, this.state.data.thumbs);
    }
  }

  // onSaveMoviePrint() {
  //   this.setState(
  //     { savingMoviePrint: true },
  //     ipcRenderer.send('send-get-poster-frame', fileId, filePath, posterFrameId, lastItem)
  //     saveMoviePrint(
  //       'ThumbGrid',
  //       this.props.settings.defaultOutputPath,
  //       this.props.file,
  //       this.props.settings.defaultThumbnailScale / this.state.outputScaleCompensator,
  //       this.props.settings.defaultOutputFormat,
  //       this.props.settings.defaultSaveOptionOverwrite,
  //       this.props.settings.defaultSaveOptionIncludeIndividual,
  //       this.props.thumbs
  //     )
  //   );
  // }

  render() {
    const { store } = this.context;
    const state = store.getState();
    return (
      <Provider store={this.props.store}>
        {this.state.savingMoviePrint &&
          <div
            ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
            className={`${styles.ItemMain}`}
            style={{
              width: `${getScaleValueObject(
                this.state.data.file,
                state.undoGroup.present.settings,
                this.state.data.file.columnCount, this.state.data.file.thumbCount,
                1360, 800, // values not needed for saveMoviePrint
                state.visibilitySettings.showMoviePrintView,
                1,
                true
              ).newMoviePrintWidth}px`
            }}
          >
            <SortedVisibleThumbGrid
              inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
              showSettings={false}
              file={this.state.data.file}
              selectedThumbId={undefined}

              colorArray={getMoviePrintColor(state.undoGroup.present.settings.defaultThumbCountMax)}
              thumbCount={this.state.data.file.thumbCount}

              showMoviePrintView
              scaleValueObject={getScaleValueObject(
                this.state.data.file,
                state.undoGroup.present.settings,
                this.state.data.file.columnCount, this.state.data.file.thumbCount,
                1360, 800, // values not needed for saveMoviePrint
                state.visibilitySettings.showMoviePrintView,
                1,
                true
              )}
              keyObject={{}}
            />
          </div>
        }
      </Provider>
    );
  }
}

const mapStateToProps = state => {
  // const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  // const tempThumbs = (state.undoGroup.present
  //   .thumbsByFileId[tempCurrentFileId] === undefined)
  //   ? undefined : state.undoGroup.present
  //     .thumbsByFileId[tempCurrentFileId].thumbs;
  return {
    // thumbs: getVisibleThumbs(
    //   tempThumbs,
    //   state.visibilitySettings.visibilityFilter
    // ),
    // currentFileId: tempCurrentFileId,
    // files: state.undoGroup.present.files,
    // file: state.undoGroup.present.files
    //   .find((file) => file.id === tempCurrentFileId),
    // settings: state.undoGroup.present.settings,
    // visibilitySettings: state.visibilitySettings,
    // thumbCount: getColumnCount(
    //   state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
    //   state.undoGroup.present.settings
    // ),
    // columnCount: getThumbsCount(
    //   state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
    //   this.props.thumbsByFileId,
    //   state.undoGroup.present.settings,
    //   state.visibilitySettings.visibilityFilter
    // ),
    // thumbsByFileId: state.undoGroup.present.thumbsByFileId,
    // colorArray: getMoviePrintColor(state.undoGroup.present.settings.defaultThumbCountMax),
    // scaleValueObject: getScaleValueObject(
    //   state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
    //   state.undoGroup.present.settings,
    //   state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).columnCount, state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).thumbCount,
    //   1360, 800, // values not needed for saveMoviePrint
    //   state.visibilitySettings.showMoviePrintView,
    //   1,
    //   true
    // )
  };
};

export default connect(mapStateToProps)(WorkerRoot);
