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
  getFramenumbers,
 } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';
import {
  SHEET_VIEW,
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

      // calculate which frameSize is needed to be captured
      // moviePrintAspectRatioInv
      // need to check portrait thumbs as resizeToMax is used which is not width specific
      const { newThumbWidth, moviePrintAspectRatioInv } = sentData.scaleValueObject;
      const { file } = sentData;
      const newThumbHeight = newThumbWidth * moviePrintAspectRatioInv;
      const frameSize = Math.floor(Math.max(newThumbHeight, newThumbWidth) * 2) // get twice the needed resolution for better antialiasing
      console.log(newThumbWidth);
      console.log(newThumbHeight);
      console.log(frameSize);

      const base64Object = getBase64Object(sentData.file.path, sentData.file.useRatio, visibleThumbs, frameSize, file.transformObject);

      // console.log(base64Object);

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

      const movieFilePath = sentData.settings.defaultEmbedFilePath ? sentData.file.path : undefined;
      const transformObject = sentData.settings.defaultEmbedFrameNumbers ? sentData.file.transformObject : undefined;
      const columnCount = sentData.settings.defaultEmbedFrameNumbers ? (sentData.sheet.columnCount || sentData.settings.defaultColumnCount) : undefined;
      const frameNumberArray = sentData.settings.defaultEmbedFrameNumbers ? getFramenumbers(sentData.sheet, sentData.visibilityFilter) : undefined;

      const dataToEmbed = {
        filePath: movieFilePath,
        transformObject,
        columnCount,
        frameNumberArray,
      };

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
        visibleThumbs,
        dataToEmbed,
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

    let sheetView;
    if (savingMoviePrint) {
      sheetView = sentData.sheet.sheetView;
      console.log(sheetView);
    }


    return (
      <ErrorBoundary>
        <div>
          {savingMoviePrint &&
            <div
              ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
              className={`${styles.ItemMain}`}
              style={{
                width: `${sheetView !== SHEET_VIEW.TIMELINEVIEW ?
                  sentData.moviePrintWidth :
                  (Math.ceil(sentData.scaleValueObject.newMoviePrintTimelineWidth) + Math.ceil(sentData.scaleValueObject.thumbMarginTimeline) * 2)
                }px`
              }}
            >
              <Fragment>
                <Conditional if={sheetView === SHEET_VIEW.GRIDVIEW}>
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

                    sheetView={sheetView}
                    view={VIEW.STANDARDVIEW}
                    currentSheetId={sentData.currentSheetId || sentData.settings.currentSheetId}
                    scaleValueObject={sentData.scaleValueObject}
                    moviePrintWidth={sentData.moviePrintWidth}
                    keyObject={{}}
                    useBase64
                  />
                </Conditional>
                <Conditional if={sheetView === SHEET_VIEW.TIMELINEVIEW}>
                  <SortedVisibleSceneGrid
                    view={VIEW.STANDARDVIEW}
                    sheetView={sheetView}
                    file={sentData.file}
                    frameCount={sentData.file ? sentData.file.frameCount : undefined}
                    inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
                    keyObject={{}}
                    selectedSceneId={undefined}
                    selectedSceneIdArray={undefined}
                    scaleValueObject={sentData.scaleValueObject}
                    scenes={sentData.scenes}
                    settings={sentData.settings}
                    showSettings={false}
                    objectUrlObjects={thumbObjectBase64s}
                    thumbs={visibleThumbs}
                    useBase64
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
