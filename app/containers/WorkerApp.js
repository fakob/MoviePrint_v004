// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import imageDB from './../utils/db';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import getScaleValueObject from '../utils/getScaleValueObject';
import { getMoviePrintColor, getColumnCount } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';

const { ipcRenderer } = require('electron');

class WorkerApp extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      data: {},
      thumbObjectUrls: {}
    };
  }

  componentDidMount() {
    log.debug('I am the worker window - responsible for saving a MoviePrint');
    ipcRenderer.on('action-saved-MoviePrint-done', (event) => {
      this.setState({
        data: {},
        thumbObjectUrls: {},
        savingMoviePrint: false,
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, data) => {
      log.debug('workerWindow | action-save-MoviePrint');
      // log.debug(data);
      const arrayOfFrameIds = data.thumbs.map(thumb => thumb.frameId);
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
          data,
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
        this.state.data.elementId,
        this.state.data.settings.defaultOutputPath,
        this.state.data.file,
        1, // scale
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
                getColumnCount(this.state.data.file, this.state.data.settings), this.state.data.file.thumbCount,
                this.state.data.moviePrintWidth, undefined,
                this.state.data.visibilitySettings.showMoviePrintView,
                1
              ).newMoviePrintWidthForPrinting}px`
            }}
          >
            <SortedVisibleThumbGrid
              viewForPrinting
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
                getColumnCount(this.state.data.file, this.state.data.settings), this.state.data.file.thumbCount,
                this.state.data.moviePrintWidth, undefined,
                this.state.data.visibilitySettings.showMoviePrintView,
                1
              )}
              keyObject={{}}
            />
          </div>
        }
      </div>
    );
  }
}

export default WorkerApp;
