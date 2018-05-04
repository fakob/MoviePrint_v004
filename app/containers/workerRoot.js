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
    ipcRenderer.on('action-save-MoviePrint', (event, data) => {
      this.setState({
        savingMoviePrint: true,
        data
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.savingMoviePrint && this.state.savingMoviePrint) {
      setTimeout(
        () => saveMoviePrint(this.state.data.elementId, this.state.data.exportPath, this.state.data.file, this.state.data.scale, this.state.data.outputFormat, this.state.data.overwrite, this.state.data.saveIndividualThumbs, this.state.data.thumbs)
        , 5000
      );
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
    return (
      <Provider store={this.props.store}>
        <div
          ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
          className={`${styles.ItemMain}`}
          style={{
            width: `${this.props.scaleValueObject.newMoviePrintWidth}px`
          }}
        >
          {this.state.savingMoviePrint &&
            <SortedVisibleThumbGrid
              inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
              showSettings={false}

              selectedThumbId={undefined}

              colorArray={this.props.colorArray}
              thumbCount={this.props.thumbCount}

              showMoviePrintView
              scaleValueObject={this.props.scaleValueObject}
              keyObject={{}}
            />
          }
        </div>
      </Provider>
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
    currentFileId: tempCurrentFileId,
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files
      .find((file) => file.id === tempCurrentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings,
    thumbCount: getColumnCount(
      state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
      state.undoGroup.present.settings
    ),
    // columnCount: getThumbsCount(
    //   state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
    //   this.props.thumbsByFileId,
    //   state.undoGroup.present.settings,
    //   state.visibilitySettings.visibilityFilter
    // ),
    thumbsByFileId: state.undoGroup.present.thumbsByFileId,
    colorArray: getMoviePrintColor(state.undoGroup.present.settings.defaultThumbCountMax),
    scaleValueObject: getScaleValueObject(
      state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
      state.undoGroup.present.settings,
      state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).columnCount, state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).thumbCount,
      1360, 800, // values not needed for saveMoviePrint
      state.visibilitySettings.showMoviePrintView,
      1,
      true
    )
  };
};

export default connect(mapStateToProps)(WorkerRoot);
