// @flow
import React, { Component } from 'react';
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
import { getMoviePrintColor, getVisibleThumbs } from '../utils/utils';
import saveMoviePrint from '../utils/saveMoviePrint';
import { DEFAULT_THUMB_COUNT_MAX, MOVIEPRINT_WIDTH_HEIGHT_SIZE_LIMIT, SHEET_VIEW, VIEW } from '../utils/constants';
import { getBase64Object } from '../utils/utilsForOpencv';

const { ipcRenderer } = require('electron');

// const moviePrintDB = new Database('./db/moviePrint.db', { verbose: console.log });

class WorkerApp extends Component {
  constructor() {
    super();
    this.state = {
      savingMoviePrint: false,
      sentData: {},
      thumbObjectBase64s: {},
      debugKeepView: false,
    };
  }

  componentDidMount() {
    log.debug('I am the worker window - responsible for saving a MoviePrint');
    ipcRenderer.on('action-saved-MoviePrint-done', event => {
      const debugKeepView = false; // set to tru to keep view for debugging
      this.setState({
        debugKeepView,
        savingMoviePrint: false,
        ...(!debugKeepView && { sentData: {} }),
        ...(!debugKeepView && { visibleThumbs: [] }),
        ...(!debugKeepView && { thumbObjectBase64s: {} }),
      });
    });

    ipcRenderer.on('action-save-MoviePrint', (event, sentData) => {
      log.debug('workerWindow | action-save-MoviePrint');
      log.debug(sentData);

      if (sentData.moviePrintWidth > MOVIEPRINT_WIDTH_HEIGHT_SIZE_LIMIT) {
        ipcRenderer.send(
          'message-from-workerWindow-to-mainWindow',
          'received-saved-file-error',
          `MoviePrint could not be saved due to sizelimit (width > ${MOVIEPRINT_WIDTH_HEIGHT_SIZE_LIMIT})`,
        );
      } else {
        const visibleThumbs = getVisibleThumbs(sentData.sheet.thumbsArray, sentData.visibilityFilter);

        // calculate which frameSize is needed to be captured
        // aspectRatioInv
        // need to check portrait thumbs as resizeToMax is used which is not width specific
        const { newThumbWidth, aspectRatioInv } = sentData.scaleValueObject;
        const { file } = sentData;
        const newThumbHeight = newThumbWidth * aspectRatioInv;

        // get twice the needed resolution for better antialiasing, but
        // prevent upsizing of image of more than the original size
        const frameSize = Math.floor(
          Math.max(Math.min(newThumbHeight * 2, file.originalHeight), Math.min(newThumbWidth * 2, file.originalWidth)),
        );
        console.log(aspectRatioInv);
        console.log(newThumbWidth);
        console.log(newThumbHeight);
        console.log(frameSize);

        const base64Object = getBase64Object(
          sentData.file.path,
          sentData.file.useRatio,
          visibleThumbs,
          frameSize,
          file.transformObject,
        );

        // console.log(base64Object);

        this.setState({
          savingMoviePrint: true,
          sentData,
          visibleThumbs,
          thumbObjectBase64s: base64Object,
        });
      }
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
      const outputPath = sentData.settings.defaultOutputPathFromMovie ? filePath : sentData.settings.defaultOutputPath;

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
        sentData.dataToEmbed,
        sentData.settings.defaultMoviePrintBackgroundColor,
        sentData.settings.defaultMoviePrintName,
        sentData.settings.defaultAllThumbsName,
        sentData.settings.defaultOutputJpgQuality,
        sentData.settings.defaultThumbFormat,
        sentData.settings.defaultThumbJpgQuality,
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
    const { debugKeepView, sentData, savingMoviePrint, thumbObjectBase64s, visibleThumbs } = this.state;

    let sheetView;
    if (savingMoviePrint || debugKeepView) {
      sheetView = sentData.sheet.sheetView;
      console.log(sheetView);
    }

    return (
      <ErrorBoundary>
        <div>
          {(savingMoviePrint || debugKeepView) && (
            <div
              ref={r => {
                this.divOfSortedVisibleThumbGridRef = r;
              }}
              className={`${styles.ItemMain}`}
              style={{
                width: `${
                  sheetView !== SHEET_VIEW.TIMELINEVIEW
                    ? sentData.moviePrintWidth
                    : Math.ceil(sentData.scaleValueObject.newMoviePrintTimelineWidth) +
                      Math.ceil(sentData.scaleValueObject.thumbMarginTimeline) * 2
                }px`,
              }}
            >
              <>
                <Conditional if={sheetView === SHEET_VIEW.GRIDVIEW}>
                  <SortedVisibleThumbGrid
                    isViewForPrinting
                    inputRef={r => {
                      this.sortedVisibleThumbGridRef = r;
                    }}
                    showSettings={false}
                    settings={sentData.settings}
                    file={sentData.file}
                    thumbs={visibleThumbs}
                    objectUrlObjects={thumbObjectBase64s}
                    defaultOutputPath={sentData.settings.defaultOutputPath}
                    defaultOutputPathFromMovie={sentData.settings.defaultOutputPathFromMovie}
                    defaultShowDetailsInHeader={sentData.settings.defaultShowDetailsInHeader}
                    defaultShowHeader={sentData.settings.defaultShowHeader}
                    defaultShowImages={sentData.settings.defaultShowImages}
                    defaultShowPathInHeader={sentData.settings.defaultShowPathInHeader}
                    defaultShowTimelineInHeader={sentData.settings.defaultShowTimelineInHeader}
                    defaultThumbInfo={sentData.settings.defaultThumbInfo}
                    defaultThumbInfoRatio={sentData.settings.defaultThumbInfoRatio}
                    selectedThumbId={undefined}
                    colorArray={getMoviePrintColor(DEFAULT_THUMB_COUNT_MAX)}
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
                    inputRef={r => {
                      this.sortedVisibleThumbGridRef = r;
                    }}
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
              </>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }
}

export default WorkerApp;
