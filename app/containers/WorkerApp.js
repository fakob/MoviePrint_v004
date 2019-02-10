// @flow
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import path from 'path';
// import imageDB from './../utils/db';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import SortedVisibleSceneGrid from '../containers/VisibleSceneGrid';
import Conditional from '../components/Conditional';
import ErrorBoundary from '../components/ErrorBoundary';
import getScaleValueObject from '../utils/getScaleValueObject';
import {
  getMoviePrintColor,
 } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';
import {
  VIEW,
} from '../utils/constants';
import {
  getBase64Object,
} from '../utils/utilsForOpencv';
import {
  getFramesByFrameIdArray,
} from '../utils/utilsForSqlite';

const { ipcRenderer } = require('electron');
const opencv = require('opencv4nodejs');

// const moviePrintDB = new Database('./db/moviePrint.db', { verbose: console.log });

class WorkerApp extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      sentData: {},
      thumbObjectBase64s: {}
    };
  }

  componentDidMount() {
    log.debug('I am the worker window - responsible for saving a MoviePrint');
    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        savingMoviePrint: false,
        sentData: {},
        thumbObjectBase64s: {},
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, sentData) => {
      log.debug('workerWindow | action-save-MoviePrint');
      log.debug(sentData);

      const base64Object = getBase64Object(sentData.file.path, sentData.file.useRatio, sentData.thumbs);

      this.setState({
        savingMoviePrint: true,
        sentData,
        thumbObjectBase64s: base64Object,
      });
    });
  }

  componentDidUpdate() {
    if (this.state.savingMoviePrint) {
      log.debug('workerWindow | componentDidUpdate and savingMoviePrint true');
      const { sentData } = this.state;
      const { file } = sentData;
      // save to filePath when defaultOutputPathFromMovie checked
      const filePath = path.dirname(file.path);
      console.log(filePath);
      // const filePath = file.path.substring(0, file.path.lastIndexOf("/"));
      const outputPath = sentData.settings.defaultOutputPathFromMovie ? filePath : sentData.settings.defaultOutputPath
      log.debug(`outputPath: ${filePath}`);
      saveMoviePrint(
        sentData.elementId,
        outputPath,
        sentData.file,
        1, // scale
        sentData.settings.defaultOutputFormat,
        sentData.settings.defaultSaveOptionOverwrite,
        sentData.settings.defaultSaveOptionIncludeIndividual,
        sentData.thumbs
      );
    }
  }

  // componentWillUnmount() {
  //   // close the database connection
  //   moviePrintDB.close((err) => {
  //     if (err) {
  //       return console.error(err.message);
  //     }
  //     console.log('Close the database connection.');
  //   });
  // }

  render() {
    return (
      <ErrorBoundary>
        <div>
          {this.state.savingMoviePrint &&
            <div
              ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
              className={`${styles.ItemMain}`}
              style={{
                width: `${this.state.sentData.visibilitySettings.defaultView !== VIEW.TIMELINEVIEW ?
                  this.state.sentData.moviePrintWidth :
                  (Math.ceil(this.state.sentData.scaleValueObject.newMoviePrintTimelineWidth) + Math.ceil(this.state.sentData.scaleValueObject.thumbMarginTimeline) * 2)
                }px`
              }}
            >
              <Fragment>
                <Conditional if={this.state.sentData.visibilitySettings.defaultView !== VIEW.TIMELINEVIEW}>
                  <SortedVisibleThumbGrid
                    viewForPrinting
                    inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                    showSettings={false}
                    file={this.state.sentData.file}
                    thumbs={this.state.sentData.thumbs}
                    objectUrlObjects={this.state.thumbObjectBase64s}
                    settings={this.state.sentData.settings}
                    visibilitySettings={this.state.sentData.visibilitySettings}

                    selectedThumbId={undefined}

                    colorArray={getMoviePrintColor(this.state.sentData.settings.defaultThumbCountMax)}
                    thumbCount={this.state.sentData.file.thumbCount}

                    defaultView={VIEW.GRIDVIEW}
                    defaultSheet={this.state.sentData.defaultSheet || this.state.sentData.visibilitySettings.defaultSheet}
                    scaleValueObject={this.state.sentData.scaleValueObject}
                    moviePrintWidth={this.state.sentData.moviePrintWidth}
                    keyObject={{}}
                  />
                </Conditional>
                <Conditional if={this.state.sentData.visibilitySettings.defaultView === VIEW.TIMELINEVIEW}>
                  <SortedVisibleSceneGrid
                    defaultView={this.state.sentData.visibilitySettings.defaultView}
                    file={this.state.sentData.file}
                    frameCount={this.state.sentData.file ? this.state.sentData.file.frameCount : undefined}
                    inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                    keyObject={{}}
                    secondsPerRow={this.state.sentData.settings.defaultTimelineViewSecondsPerRow}
                    selectedSceneId={undefined}
                    scaleValueObject={this.state.sentData.scaleValueObject}
                    scenes={this.state.sentData.scenes}
                    settings={this.state.sentData.settings}
                    showSettings={false}
                    objectUrlObjects={this.state.thumbObjectBase64s}
                    thumbs={this.state.sentData.thumbs}
                    visibilitySettings={this.state.sentData.visibilitySettings}
                  />
                </Conditional>
              </Fragment>
            </div>
          }
        </div>
      </ErrorBoundary>
    );
  }
}

export default WorkerApp;
