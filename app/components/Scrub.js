// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import log from 'electron-log';
import styles from './Scrub.css';
import stylesPop from './Popup.css';
import {
  getScrubFrameNumber,
  getSceneScrubFrameNumber,
  mapRange,
  getThumbInfoValue,
  setPosition,
} from '../utils/utils';
import { getCropRect, transformMat } from '../utils/utilsForOpencv';
import transparent from '../img/Thumb_TRANSPARENT.png';
import { RotateFlags } from '../utils/openCVProperties';
import { MENU_FOOTER_HEIGHT, MENU_HEADER_HEIGHT, SHEET_TYPE, TRANSFORMOBJECT_INIT } from '../utils/constants';

const opencv = require('opencv4nodejs');

class Scrub extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cropRect: undefined,
      leftOfScrubMovie: undefined,
      rightOfScrubMovie: undefined,
      scrubFrameNumber: undefined,
      scrubInfo: undefined,
      scrubLineOnTimelineValue: undefined,
      scrubLineValue: undefined,
      scrubThumbLineValue: undefined,
      timeLineCutIn: undefined,
      timeLineCutOut: undefined,
      timeLineScrubThumb: undefined,
    };

    this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    this.onScrubCancel = this.onScrubCancel.bind(this);
    this.onScrubClickWithStop = this.onScrubClickWithStop.bind(this);
    this.getInitialStateObject = this.getInitialStateObject.bind(this);
  }

  componentDidMount() {
    const myInitialState = this.getInitialStateObject();
    this.updateOpencvVideoCanvas(0);
    this.setState(myInitialState);
    console.log('Scrub.js - componentDidMount');
  }

  getInitialStateObject() {
    const { file, opencvVideo, scaleValueObject, scrubThumb, scrubThumbLeft, scrubThumbRight, settings } = this.props;
    const { transformObject = TRANSFORMOBJECT_INIT } = file;

    const timeLineCutIn = mapRange(scrubThumbLeft.frameNumber, 0, file.frameCount, 0, scaleValueObject.containerWidth);
    const timeLineScrubThumb = mapRange(scrubThumb.frameNumber, 0, file.frameCount, 0, scaleValueObject.containerWidth);
    const timeLineCutOut = mapRange(
      scrubThumbRight.frameNumber,
      0,
      file.frameCount,
      0,
      scaleValueObject.containerWidth,
    );
    const leftOfScrubMovie = scaleValueObject.containerWidth / 2 - scaleValueObject.scrubMovieWidth / 2;
    const rightOfScrubMovie = leftOfScrubMovie + scaleValueObject.scrubMovieWidth;
    const scrubThumbLineValue = mapRange(
      scrubThumb.frameNumber,
      scrubThumbLeft.frameNumber,
      scrubThumbRight.frameNumber,
      leftOfScrubMovie,
      rightOfScrubMovie,
    );

    // show timecode if hideInfo
    const scrubInfo = settings.defaultThumbInfo === 'hideInfo' ? 'timecode' : settings.defaultThumbInfo;

    const cropRect = getCropRect(opencvVideo, transformObject);

    console.log(transformObject);

    return {
      cropRect,
      leftOfScrubMovie,
      rightOfScrubMovie,
      scrubInfo,
      scrubThumbLineValue,
      thisTransformObject: transformObject,
      timeLineCutIn,
      timeLineCutOut,
      timeLineScrubThumb,
    };
  }

  onScrubMouseMoveWithStop(e) {
    const {
      file,
      keyObject,
      containerHeight,
      scaleValueObject,
      scrubScene,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
      sheetType,
    } = this.props;
    const { leftOfScrubMovie, rightOfScrubMovie } = this.state;

    e.stopPropagation();

    if (e.clientY < MENU_HEADER_HEIGHT + containerHeight) {
      const scrubLineValue = e.clientX;
      let scrubFrameNumber;

      if (sheetType === SHEET_TYPE.INTERVAL) {
        scrubFrameNumber = getScrubFrameNumber(
          scrubLineValue,
          keyObject,
          scaleValueObject,
          file.frameCount,
          scrubThumb,
          scrubThumbLeft,
          scrubThumbRight,
          leftOfScrubMovie,
          rightOfScrubMovie,
        );
      } else {
        scrubFrameNumber = getSceneScrubFrameNumber(
          scrubLineValue,
          scaleValueObject,
          scrubThumb,
          scrubScene,
          leftOfScrubMovie,
          rightOfScrubMovie,
        );
      }
      const scrubLineOnTimelineValue = mapRange(
        scrubFrameNumber,
        0,
        file.frameCount,
        0,
        scaleValueObject.containerWidth,
      );

      this.setState({
        scrubLineValue,
        scrubFrameNumber,
        scrubLineOnTimelineValue,
      });
      this.updateOpencvVideoCanvas(scrubFrameNumber);
    } else {
      this.onScrubCancel();
    }
  }

  onScrubClickWithStop(e) {
    const { onScrubReturn, scrubWindowTriggerTime } = this.props;
    const { scrubFrameNumber } = this.state;
    e.stopPropagation();
    // for the scrub window the user has to click and drag while keeping the mouse pressed
    // use triggerTime to keep scrub window open if users just click and release the mouse within 1000ms
    const timeSinceClick = Date.now() - scrubWindowTriggerTime;
    if (timeSinceClick > 1000) {
      log.debug(`onScrubReturn, new frameNumber: ${scrubFrameNumber}`);
      onScrubReturn(scrubFrameNumber);
    }
  }

  onScrubCancel() {
    const { onScrubReturn } = this.props;
    log.debug('Cancel scrubbing');
    onScrubReturn();
  }

  updateOpencvVideoCanvas(currentFrame) {
    const { file, opencvVideo, scaleValueObject } = this.props;
    const { cropRect, thisTransformObject = TRANSFORMOBJECT_INIT } = this.state;

    setPosition(opencvVideo, currentFrame, file.useRatio);
    const mat = opencvVideo.read();

    if (!mat.empty) {
      // optional transformation
      const matTransformed = transformMat(mat, thisTransformObject, cropRect);

      const img = matTransformed.resizeToMax(
        scaleValueObject.aspectRatioInv < 1
          ? parseInt(scaleValueObject.scrubMovieWidth, 10)
          : parseInt(scaleValueObject.scrubMovieHeight, 10),
      );
      const matRGBA = img.channels === 1 ? img.cvtColor(opencv.COLOR_GRAY2RGBA) : img.cvtColor(opencv.COLOR_BGR2RGBA);

      this.opencvVideoCanvasRef.height = img.rows;
      this.opencvVideoCanvasRef.width = img.cols;
      const imgData = new ImageData(new Uint8ClampedArray(matRGBA.getData()), img.cols, img.rows);
      const ctx = this.opencvVideoCanvasRef.getContext('2d');
      ctx.putImageData(imgData, 0, 0);
    }
  }

  render() {
    const {
      file,
      keyObject,
      objectUrlObjects,
      scaleValueObject,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
      settings,
      sheetType,
    } = this.props;

    const {
      leftOfScrubMovie,
      rightOfScrubMovie,
      scrubFrameNumber,
      scrubInfo,
      scrubLineOnTimelineValue,
      scrubLineValue,
      scrubThumbLineValue,
      timeLineCutIn = 0,
      timeLineCutOut = 0,
      timeLineScrubThumb = 0,
    } = this.state;

    let addBefore = false;
    let addAfter = false;

    // only allow add before and add after when interval type
    if (sheetType === SHEET_TYPE.INTERVAL) {
      addBefore = keyObject.shiftKey;
      addAfter = keyObject.altKey;
    }

    return (
      <div
        className={styles.scrubContainerBackground}
        onMouseMove={this.onScrubMouseMoveWithStop}
        onMouseUp={this.onScrubClickWithStop}
        // onClick={this.onScrubClickWithStop}
      >
        <div className={styles.scrubInfo}>
          {addBefore && 'ADD BEFORE'}
          {addAfter && 'ADD AFTER'}
          {!addBefore && !addAfter && 'CHANGE TO'}
        </div>
        <div
          className={styles.scrubContainer}
          style={{
            height: scaleValueObject.scrubContainerHeight,
            width: scaleValueObject.scrubContainerWidth,
          }}
        >
          <div
            className={styles.scrubInnerContainer}
            style={{
              width: scaleValueObject.scrubInnerContainerWidth,
            }}
          >
            <span
              className={styles.scrubThumbLeft}
              style={{
                backgroundImage: `url(${
                  addAfter
                    ? objectUrlObjects[scrubThumb.frameId]
                    : objectUrlObjects[scrubThumbLeft.frameId] || transparent
                })`,
                height: scaleValueObject.scrubInOutMovieHeight,
                width: scaleValueObject.scrubInOutMovieWidth,
                margin: settings.defaultScrubWindowMargin,
              }}
            />
            {/* keyObject.ctrlKey &&
              <div
                style={{
                  content: '',
                  zIndex: 1,
                  backgroundImage: `url(${objectUrlObjects[scrubThumb.frameId]})`,
                  backgroundSize: 'cover',
                  opacity: '0.4',
                  position: 'absolute',
                  height: scaleValueObject.scrubMovieHeight,
                  width: scaleValueObject.scrubMovieWidth,
                  margin: settings.defaultScrubWindowMargin,
                  top: 0,
                  left: scaleValueObject.scrubInOutMovieWidth,
                }}
              />
            */}
            <span
              className={styles.scrubThumb}
              style={{
                height: scaleValueObject.scrubMovieHeight,
                width: scaleValueObject.scrubMovieWidth,
              }}
            >
              <canvas
                ref={el => {
                  this.opencvVideoCanvasRef = el;
                }}
              />
            </span>
            <span
              className={styles.scrubThumbRight}
              style={{
                backgroundImage: `url(${
                  addBefore
                    ? objectUrlObjects[scrubThumb.frameId]
                    : objectUrlObjects[scrubThumbRight.frameId] || transparent
                })`,
                height: scaleValueObject.scrubInOutMovieHeight,
                width: scaleValueObject.scrubInOutMovieWidth,
                margin: settings.defaultScrubWindowMargin,
              }}
            />
          </div>
          <span
            id="currentTimeDisplay"
            className={styles.frameNumberOrTimeCode}
            style={{
              left: `${scrubLineValue}px`,
            }}
          >
            {getThumbInfoValue(scrubInfo, scrubFrameNumber, file.fps)}
          </span>
          <div
            className={styles.scrubLine}
            style={{
              left: `${scrubLineValue}px`,
            }}
          />
          <span
            className={styles.scrubThumbframeNumberOrTimeCode}
            style={{
              left: `${leftOfScrubMovie}px`,
            }}
          >
            {getThumbInfoValue(scrubInfo, addAfter ? scrubThumb.frameNumber : scrubThumbLeft.frameNumber, file.fps)}
          </span>
          {!addBefore && !addAfter && (
            <span
              className={styles.scrubThumbframeNumberOrTimeCode}
              style={{
                left: `${scrubThumbLineValue}px`,
              }}
            >
              {getThumbInfoValue(scrubInfo, scrubThumb.frameNumber, file.fps)}
            </span>
          )}
          <span
            className={styles.scrubThumbframeNumberOrTimeCode}
            style={{
              left: `${rightOfScrubMovie}px`,
            }}
          >
            {getThumbInfoValue(scrubInfo, addBefore ? scrubThumb.frameNumber : scrubThumbRight.frameNumber, file.fps)}
          </span>
          <div
            className={styles.scrubThumbLine}
            style={{
              left: `${scrubThumbLineValue}px`,
            }}
          />
          <div id="timeLine" className={`${styles.timelineWrapper}`}>
            <div
              className={`${styles.timelinePlayhead}`}
              style={{
                left: `${scrubLineOnTimelineValue}px`,
              }}
            />
            <div
              className={`${styles.timelineScrubThumb}`}
              style={{
                left: `${timeLineScrubThumb}px`,
              }}
            />
            <div
              className={`${styles.timelineCut}`}
              style={{
                left: timeLineCutIn,
                width: timeLineCutOut - timeLineCutIn,
              }}
            />
          </div>
        </div>
        {/* <div
          className={`${styles.scrubDescription} ${styles.textButton}`}
          style={{
            height: `${MENU_HEADER_HEIGHT}px`,
          }}
        >
          {addAfter ? 'Add after' : (addBefore ? 'Add before' : 'Change')}
        </div> */}
        <Popup
          trigger={
            <div
              className={styles.scrubCancelBar}
              onMouseOver={this.onScrubCancel}
              style={{
                height: `${MENU_FOOTER_HEIGHT}px`,
              }}
            >
              Cancel
            </div>
          }
          open
          basic
          inverted
          wide
          position="top left"
          offset="-50%, 8px"
          className={stylesPop.popup}
          content={
            sheetType === SHEET_TYPE.INTERVAL ? (
              <span>
                Choose frame: drag left and right
                <br />
                Allow dragging over whole movie: <mark>CTRL</mark>
                <br />
                Add new thumb before: <mark>SHIFT</mark>
                <br />
                Add new thumb after: <mark>ALT</mark>
                <br />
                Confirm frame: click/release mouse
                <br />
                Cancel: Move mouse over cancel zone
              </span>
            ) : (
              <span>
                Choose frame: drag left and right
                <br />
                Confirm frame: click/release mouse
                <br />
                Cancel: Move mouse over cancel zone
              </span>
            )
          }
        />
      </div>
    );
  }
}

Scrub.defaultProps = {
  // thumbImageObjectUrl: empty,
};

Scrub.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string,
    frameCount: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    columnCount: PropTypes.number,
    path: PropTypes.string,
    useRatio: PropTypes.bool,
  }),
  keyObject: PropTypes.object.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  objectUrlObjects: PropTypes.object.isRequired,
  containerHeight: PropTypes.number.isRequired,
  containerWidth: PropTypes.number.isRequired,
  scrubThumb: PropTypes.object.isRequired,
  scrubThumbLeft: PropTypes.object.isRequired,
  scrubThumbRight: PropTypes.object.isRequired,
  opencvVideo: PropTypes.object.isRequired,
};

export default Scrub;
