// @flow
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import imageDB from './../utils/db';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import SortedVisibleSceneGrid from '../containers/VisibleSceneGrid';
import Conditional from '../components/Conditional';
import ErrorBoundary from '../components/ErrorBoundary';
import getScaleValueObject from '../utils/getScaleValueObject';
import { getMoviePrintColor, getColumnCount } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';
import {
  VIEW,
} from '../utils/constants';

const { ipcRenderer } = require('electron');

class WorkerApp extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      sentData: {},
      thumbObjectUrls: {}
    };
  }

  componentDidMount() {
    log.debug('I am the worker window - responsible for saving a MoviePrint');
    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        sentData: {},
        thumbObjectUrls: {},
        savingMoviePrint: false,
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, sentData) => {
      log.debug('workerWindow | action-save-MoviePrint');
      log.debug(sentData);
      const arrayOfFrameIds = sentData.thumbs.map(thumb => thumb.frameId);
      // log.debug(arrayOfFrameIds);
      // const arrayOfFrameNumbersFromDB = imageDB.thumbList.where('id').equals(arrayOfFrameIds)
      imageDB.frameList.where('frameId').anyOf(arrayOfFrameIds).toArray().then((thumbs) => {
        log.debug(thumbs);
        const objectUrlsObject = thumbs.reduce((previous, current) => {
          // log.debug(previous);
          // log.debug(current.frameId);
          const tempObject = Object.assign({}, previous,
            { [current.frameId]: { objectUrl: window.URL.createObjectURL(current.data) } }
          );
          return tempObject;
        }, {});
        // log.debug(objectUrlsObject);
        return objectUrlsObject;
      }).then((objectUrlsObject) => {
        this.setState({
          sentData,
          thumbObjectUrls: objectUrlsObject,
          savingMoviePrint: true
        });
        return objectUrlsObject;
      })
      .catch(error => {
        log.error(`workerWindow | There has been a problem with the action-save-MoviePrint operation: ${error.message}`);
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'progressMessage',
          '',
          '',
          'There was an error while saving the MoviePrint. Please try again!',
          20000,
        );
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'error-savingMoviePrint',
        );
      });
    });
  }

  componentDidUpdate() {
    if (this.state.savingMoviePrint) {
      log.debug('workerWindow | componentDidUpdate and savingMoviePrint true');
      saveMoviePrint(
        this.state.sentData.elementId,
        this.state.sentData.settings.defaultOutputPath,
        this.state.sentData.file,
        1, // scale
        this.state.sentData.settings.defaultOutputFormat,
        this.state.sentData.settings.defaultSaveOptionOverwrite,
        this.state.sentData.settings.defaultSaveOptionIncludeIndividual,
        this.state.sentData.thumbs
      );
    }
  }

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
                  (this.state.sentData.scaleValueObject.originalTimelineMoviePrintWidth + this.state.sentData.scaleValueObject.thumbMarginTimeline * 2)
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
                    thumbImages={this.state.thumbObjectUrls}
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
                    minutesPerRow={this.state.sentData.settings.defaultTimelineViewMinutesPerRow}
                    selectedSceneId={undefined}
                    scaleValueObject={this.state.sentData.scaleValueObject}
                    moviePrintWidth={this.state.sentData.originalTimelineMoviePrintWidth}
                    moviePrintRowHeight={this.state.sentData.scaleValueObject.originalTimelineRowHeight}
                    scenes={this.state.sentData.scenes}
                    settings={this.state.sentData.settings}
                    showSettings={false}
                    thumbImages={this.state.thumbObjectUrls}
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
