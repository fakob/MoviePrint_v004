// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import styles from './Scrub.css';
import stylesPop from './Popup.css';
import { getScrubFrameNumber, mapRange, getThumbInfoValue } from '../utils/utils';
import transparent from '../img/Thumb_TRANSPARENT.png';
import { MENU_FOOTER_HEIGHT, SHEET_TYPE } from '../utils/constants';

class Scrub extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scrubLineValue: undefined,
      scrubFrameNumber: undefined,
      scrubLineOnTimelineValue: undefined,
      timeLineCutIn: undefined,
      timeLineScrubThumb: undefined,
      timeLineCutOut: undefined,
      scrubThumbLineValue: undefined,
      leftOfScrubMovie: undefined,
      rightOfScrubMovie: undefined,
      scrubInfo: undefined,
    };

    this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    this.onScrubClickWithStop = this.onScrubClickWithStop.bind(this);
    this.getInitialStateObject = this.getInitialStateObject.bind(this);
  }

  componentDidMount() {
    const myInitialState = this.getInitialStateObject();
    this.setState(myInitialState);
  }

  getInitialStateObject() {
    const { file, scaleValueObject, scrubThumb, scrubThumbLeft, scrubThumbRight, settings } = this.props;

    const timeLineCutIn = mapRange(
      scrubThumbLeft.frameNumber,
      0,
      file.frameCount,
      0,
      scaleValueObject.scrubInnerContainerWidth,
    );
    const timeLineScrubThumb = mapRange(
      scrubThumb.frameNumber,
      0,
      file.frameCount,
      0,
      scaleValueObject.scrubInnerContainerWidth,
    );
    const timeLineCutOut = mapRange(
      scrubThumbRight.frameNumber,
      0,
      file.frameCount,
      0,
      scaleValueObject.scrubInnerContainerWidth,
    );
    const leftOfScrubMovie = (scaleValueObject.scrubInnerContainerWidth - scaleValueObject.scrubMovieWidth) / 2;
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

    return {
      // scrubFrameNumber: scrubThumb.frameNumber,
      timeLineCutIn,
      timeLineScrubThumb,
      timeLineCutOut,
      scrubThumbLineValue,
      leftOfScrubMovie,
      rightOfScrubMovie,
      scrubInfo,
    };
  }

  onScrubMouseMoveWithStop(e) {
    const {
      file,
      keyObject,
      onScrubWindowMouseOver,
      scaleValueObject,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
      sheetType,
    } = this.props;

    const scrubLineValue = e.clientX;

    const scrubFrameNumber = getScrubFrameNumber(
      scrubLineValue,
      keyObject,
      scaleValueObject,
      file.frameCount,
      scrubThumb,
      scrubThumbLeft,
      scrubThumbRight,
    );

    const scrubLineOnTimelineValue = mapRange(
      scrubFrameNumber,
      0,
      file.frameCount,
      0,
      scaleValueObject.scrubInnerContainerWidth,
    );

    // console.log(scrubThumb)
    // console.log(scrubThumbLeft)
    // console.log(scrubThumbRight)
    console.log(scrubLineValue)
    console.log(scrubLineOnTimelineValue)
    console.log(scrubFrameNumber)

    this.setState({
      scrubLineValue,
      scrubFrameNumber,
      scrubLineOnTimelineValue,
    });
    e.stopPropagation();
    onScrubWindowMouseOver(e, sheetType);
  }

  onScrubClickWithStop(e) {
    const { onScrubWindowClick, scrubWindowTriggerTime, sheetType } = this.props;
    e.stopPropagation();
    // for the scrub window the user has to click and drag while keeping the mouse pressed
    // use triggerTime to keep scrub window open if users just click and release the mouse within 1000ms
    const timeSinceClick = Date.now() - scrubWindowTriggerTime;
    if (timeSinceClick > 1000) {
      onScrubWindowClick(e, sheetType);
    }
  }

  render() {
    const {
      file,
      keyObject,
      objectUrlObjects,
      opencvVideoCanvasRef,
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
              <canvas ref={opencvVideoCanvasRef} />
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
              onMouseOver={this.onScrubClickWithStop}
              // onClick={this.onScrubClickWithStop}
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
  onScrubWindowMouseOver: PropTypes.func.isRequired,
  onScrubWindowClick: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  objectUrlObjects: PropTypes.object.isRequired,
  containerHeight: PropTypes.number.isRequired,
  containerWidth: PropTypes.number.isRequired,
  scrubThumb: PropTypes.object.isRequired,
  scrubThumbLeft: PropTypes.object.isRequired,
  scrubThumbRight: PropTypes.object.isRequired,
  opencvVideoCanvasRef: PropTypes.object.isRequired,
};

export default Scrub;
