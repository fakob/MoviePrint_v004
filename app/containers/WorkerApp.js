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
      thumbObjectUrls: {}
    };

    // this.onSaveMoviePrint = this.onSaveMoviePrint.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        data: {},
        thumbObjectUrls: {},
        savingMoviePrint: false,
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, data) => {
      console.log(data);
      const arrayOfFrameIds = data.thumbs.map(thumb => thumb.frameId);
      console.log(arrayOfFrameIds);
      // const arrayOfFrameNumbersFromDB = imageDB.thumbList.where('id').equals(arrayOfFrameIds)
      imageDB.frameList.where('frameId').anyOf(arrayOfFrameIds).toArray().then((thumbs) => {
        console.log(thumbs);
        const objectUrlsObject = thumbs.reduce((previous, current) => {
          // console.log(previous);
          // console.log(current.frameId);
          const tempObject = Object.assign({}, previous,
            { [current.frameId]: { objectUrl: window.URL.createObjectURL(current.data) } }
          );
          return tempObject;
        }, {});
        console.log(objectUrlsObject);
        return objectUrlsObject;
      }).then((objectUrlsObject) => {
        this.setState({
          data,
          thumbObjectUrls: objectUrlsObject,
          savingMoviePrint: true
        });
      });
    });
  }

  componentDidUpdate() {
    if (this.state.savingMoviePrint) {
      console.log('componentDidUpdate and savingMoviePrint true');
      saveMoviePrint(
        this.state.data.elementId,
        this.state.data.settings.defaultOutputPath,
        this.state.data.file,
        this.state.data.scale,
        this.state.data.settings.defaultOutputFormat,
        this.state.data.settings.defaultSaveOptionOverwrite,
        this.state.data.settings.defaultSaveOptionIncludeIndividual,
        this.state.data.thumbs
      );
    }
  }

  render() {
    return (
      <div>
        {this.state.savingMoviePrint &&
          <div
            ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
            className={`${styles.ItemMain}`}
            style={{
              width: `${getScaleValueObject(
                this.state.data.file,
                this.state.data.settings,
                this.state.data.file.columnCount, this.state.data.file.thumbCount,
                1360, 800, // values not needed for saveMoviePrint
                this.state.data.visibilitySettings.showMoviePrintView,
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
              settings={this.state.data.settings}
              visibilitySettings={this.state.data.visibilitySettings}

              selectedThumbId={undefined}

              colorArray={getMoviePrintColor(this.state.data.settings.defaultThumbCountMax)}
              thumbCount={this.state.data.file.thumbCount}

              showMoviePrintView
              scaleValueObject={getScaleValueObject(
                this.state.data.file,
                this.state.data.settings,
                this.state.data.file.columnCount, this.state.data.file.thumbCount,
                1360, 800, // values not needed for saveMoviePrint
                this.state.data.visibilitySettings.showMoviePrintView,
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
  // const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  return {
    // thumbImages: (state.thumbsObjUrls[tempCurrentFileId] === undefined)
    //   ? undefined : state.thumbsObjUrls[tempCurrentFileId],
  };
};

WorkerApp.contextTypes = {
  store: PropTypes.object,
};

export default connect(mapStateToProps)(WorkerApp);
