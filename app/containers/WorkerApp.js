// @flow
import React, { Component } from 'react';
import { Provider, connect } from 'react-redux';
import PropTypes from 'prop-types';
import imageDB from './../utils/db';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import { getVisibleThumbs, getScaleValueObject, getMoviePrintColor, getColumnCount } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';

const { ipcRenderer } = require('electron');

// export default function WorkerApp({ store }: RootType) {
class WorkerApp extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      data: {},
      thumbObjectUrls: []
    };

    // this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);
  }

  // componentDidMount() {
  //   const self = this;
  //   console.log(this.props);
  //   const { store } = this.context;
  //   store.getState().undoGroup.present.files.map((singleFile) => {
  //     console.log(singleFile);
  //     if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined) {
  //       Object.values(store.getState().undoGroup.present
  //         .thumbsByFileId[singleFile.id]
  //         .thumbs).map((a) => {
  //         console.log(a.id);
  //         return imageDB.thumbList.where('id').equals(a.id).toArray().then((thumb) => {
  //           console.log(thumb[0].fileId);
  //           const tempObjectURL = window.URL.createObjectURL(thumb[0].data);
  //           let mapping = {id: a.id, objectUrl: tempObjectURL};
  //           let newUrls = self.state.thumbObjectUrls.slice();
  //           newUrls.push(mapping);
  //           console.log(mapping);
  //
  //           self.setState({
  //             thumbObjectUrls: newUrls
  //           });
  //         });
  //       });
  //     }
  //   });


  componentDidMount() {
    const { store } = this.context;

    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        data: {},
        thumbObjectUrls: [],
        savingMoviePrint: false,
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, data) => {
      console.log(data.file);
      console.log(store.getState().undoGroup.present
        .thumbsByFileId[data.file.id]
        .thumbs);
      const arrayOfFrameIds = store.getState().undoGroup.present.thumbsByFileId[data.file.id]
        .thumbs.map(thumb => thumb.frameId);
      console.log(arrayOfFrameIds);
      // const arrayOfFrameNumbersFromDB = imageDB.thumbList.where('id').equals(arrayOfFrameIds)
      imageDB.frameList.where('frameId').anyOf(arrayOfFrameIds).toArray().then((thumbs) => {
        console.log(thumbs);
        const objectUrlsArray = thumbs.map(thumb => {
          const objectUrl = window.URL.createObjectURL(thumb.data);
          return objectUrl;
        });
        console.log(objectUrlsArray);
        return objectUrlsArray;
      }).then((objectUrlsArray) => {
        this.setState({
          thumbObjectUrls: objectUrlsArray,
          savingMoviePrint: true
        });
      }
      );
      // this.setState({
      //   savingMoviePrint: true,
      //   data
      // });
    });
  }

  componentDidUpdate() {
    if (this.state.savingMoviePrint) {
      console.log('componentDidUpdate and savingMoviePrint true');
      saveMoviePrint(
        this.state.data.elementId,
        this.state.data.exportPath,
        this.state.data.file,
        this.state.data.scale,
        this.state.data.outputFormat,
        this.state.data.overwrite,
        this.state.data.saveIndividualThumbs,
        this.state.data.thumbs
      );
    }
  }

  render() {
    const { store } = this.context;
    const state = store.getState();
    return (
      <div>
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
              thumbs={this.state.data.thumbs}
              thumbImages={this.state.thumbObjectUrls}
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
      </div>
    );
  }
}

const mapStateToProps = state => {
  const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  // const tempThumbs = (state.undoGroup.present
  //   .thumbsByFileId[tempCurrentFileId] === undefined)
  //   ? undefined : state.undoGroup.present
  //     .thumbsByFileId[tempCurrentFileId].thumbs;
  return {
    thumbImages: (state.thumbsObjUrls[tempCurrentFileId] === undefined)
      ? undefined : state.thumbsObjUrls[tempCurrentFileId],
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

WorkerApp.contextTypes = {
  store: PropTypes.object,
};

export default connect(mapStateToProps)(WorkerApp);
