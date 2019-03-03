// @flow
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import path from 'path';
// import imageDB from './../utils/db';
import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from './VisibleThumbGrid';
import SortedVisibleSceneGrid from './VisibleSceneGrid';
import Conditional from '../components/Conditional';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  getMoviePrintColor,
  getVisibleThumbs,
 } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';
import {
  SHEET_TYPE,
  VIEW,
} from '../utils/constants';
import {
  getBase64Object,
} from '../utils/utilsForOpencv';

const { ipcRenderer } = require('electron');

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
        visibleThumbs: [],
        thumbObjectBase64s: {},
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, sentData) => {
      log.debug('workerWindow | action-save-MoviePrint');
      log.debug(sentData);

      const visibleThumbs = getVisibleThumbs(
        sentData.sheet.thumbsArray,
        sentData.visibilityFilter
      );

      const base64Object = getBase64Object(sentData.file.path, sentData.file.useRatio, visibleThumbs);

      this.setState({
        savingMoviePrint: true,
        sentData,
        visibleThumbs,
        thumbObjectBase64s: base64Object,
      });
    });
  }

  componentDidUpdate() {
    const { sentData, savingMoviePrint, visibleThumbs } = this.state;

    if (savingMoviePrint) {
      log.debug('workerWindow | componentDidUpdate and savingMoviePrint true');
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
        sentData.sheetId,
        sentData.sheet.name,
        1, // scale
        sentData.settings.defaultOutputFormat,
        sentData.settings.defaultSaveOptionOverwrite,
        sentData.settings.defaultSaveOptionIncludeIndividual,
        visibleThumbs
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
    const { sentData, savingMoviePrint, thumbObjectBase64s, visibleThumbs } = this.state;

    let view = VIEW.GRIDVIEW;
    if (savingMoviePrint) {
      const sheetType = sentData.sheet.type;
      if (sheetType === SHEET_TYPE.SCENES) {
        view = VIEW.TIMELINEVIEW;
      } else {
        view = VIEW.GRIDVIEW;
      }
      console.log(view);
      console.log(sheetType);
    }


    return (
      <ErrorBoundary>
        <div>
          {savingMoviePrint &&
            <div
              ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
              className={`${styles.ItemMain}`}
              style={{
                width: `${view !== VIEW.TIMELINEVIEW ?
                  sentData.moviePrintWidth :
                  (Math.ceil(sentData.scaleValueObject.newMoviePrintTimelineWidth) + Math.ceil(sentData.scaleValueObject.thumbMarginTimeline) * 2)
                }px`
              }}
            >
              <Fragment>
                <Conditional if={view === VIEW.GRIDVIEW}>
                  <SortedVisibleThumbGrid
                    viewForPrinting
                    inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                    showSettings={false}
                    file={sentData.file}
                    thumbs={visibleThumbs}
                    objectUrlObjects={thumbObjectBase64s}
                    settings={sentData.settings}

                    selectedThumbId={undefined}

                    colorArray={getMoviePrintColor(sentData.settings.defaultThumbCountMax)}
                    thumbCount={sentData.file.thumbCount}

                    view={view}
                    currentSheetId={sentData.currentSheetId || sentData.settings.currentSheetId}
                    scaleValueObject={sentData.scaleValueObject}
                    moviePrintWidth={sentData.moviePrintWidth}
                    keyObject={{}}
                  />
                </Conditional>
                <Conditional if={view === VIEW.TIMELINEVIEW}>
                  <SortedVisibleSceneGrid
                    view={view}
                    file={sentData.file}
                    frameCount={sentData.file ? sentData.file.frameCount : undefined}
                    inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                    keyObject={{}}
                    selectedSceneId={undefined}
                    scaleValueObject={sentData.scaleValueObject}
                    scenes={sentData.scenes}
                    settings={sentData.settings}
                    showSettings={false}
                    objectUrlObjects={thumbObjectBase64s}
                    thumbs={visibleThumbs}
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
