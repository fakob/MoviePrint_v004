// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import styles from './Scrub.css';
import stylesPop from './Popup.css';
import { getObjectProperty, getScrubFrameNumber, mapRange, getThumbInfoValue } from '../utils/utils';
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
  }

  componentWillMount() {
    const timeLineCutIn = mapRange(
      this.props.scrubThumbLeft.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth,
    );
    const timeLineScrubThumb = mapRange(
      this.props.scrubThumb.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth,
    );
    const timeLineCutOut = mapRange(
      this.props.scrubThumbRight.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth,
    );
    const leftOfScrubMovie =
      (this.props.scaleValueObject.scrubInnerContainerWidth - this.props.scaleValueObject.scrubMovieWidth) / 2;
    const rightOfScrubMovie = leftOfScrubMovie + this.props.scaleValueObject.scrubMovieWidth;
    const scrubThumbLineValue = mapRange(
      this.props.scrubThumb.frameNumber,
      this.props.scrubThumbLeft.frameNumber,
      this.props.scrubThumbRight.frameNumber,
      leftOfScrubMovie,
      rightOfScrubMovie,
    );

    // show timecode if hideInfo
    const scrubInfo =
      this.props.settings.defaultThumbInfo === 'hideInfo' ? 'timecode' : this.props.settings.defaultThumbInfo;

    this.setState({
      scrubFrameNumber: this.props.scrubThumb.frameNumber,
      timeLineCutIn,
      timeLineScrubThumb,
      timeLineCutOut,
      scrubThumbLineValue,
      leftOfScrubMovie,
      rightOfScrubMovie,
      scrubInfo,
    });
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {}

  componentDidUpdate(prevProps) {}

  onScrubMouseMoveWithStop(e) {
    const scrubFrameNumber = getScrubFrameNumber(
      e.clientX,
      this.props.keyObject,
      this.props.scaleValueObject,
      this.props.file.frameCount,
      this.props.scrubThumb,
      this.props.scrubThumbLeft,
      this.props.scrubThumbRight,
    );
    const scrubLineOnTimelineValue = mapRange(
      scrubFrameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth,
    );
    this.setState({
      scrubLineValue: e.clientX,
      scrubFrameNumber,
      scrubLineOnTimelineValue,
    });
    e.stopPropagation();
    this.props.onScrubWindowMouseOver(e, this.props.sheetType);
  }

  onScrubClickWithStop(e) {
    e.stopPropagation();
    // for the scrub window the user has to click and drag while keeping the mouse pressed
    // use triggerTime to keep scrub window open if users just click and release the mouse within 1000ms
    const timeSinceClick = Date.now() - this.props.scrubWindowTriggerTime;
    if (timeSinceClick > 1000) {
      this.props.onScrubWindowClick(e, this.props.sheetType);
    }
  }

  render() {
    const {
      containerHeight,
      containerWidth,
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
              <canvas ref={this.props.opencvVideoCanvasRef} />
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
              left: `${this.state.scrubLineValue}px`,
            }}
          >
            {getThumbInfoValue(this.state.scrubInfo, this.state.scrubFrameNumber, file.fps)}
          </span>
          <div
            className={styles.scrubLine}
            style={{
              left: `${this.state.scrubLineValue}px`,
            }}
          />
          <span
            className={styles.scrubThumbframeNumberOrTimeCode}
            style={{
              left: `${this.state.leftOfScrubMovie}px`,
            }}
          >
            {getThumbInfoValue(
              this.state.scrubInfo,
              addAfter ? scrubThumb.frameNumber : scrubThumbLeft.frameNumber,
              file.fps,
            )}
          </span>
          {!addBefore && !addAfter && (
            <span
              className={styles.scrubThumbframeNumberOrTimeCode}
              style={{
                left: `${this.state.scrubThumbLineValue}px`,
              }}
            >
              {getThumbInfoValue(this.state.scrubInfo, scrubThumb.frameNumber, file.fps)}
            </span>
          )}
          <span
            className={styles.scrubThumbframeNumberOrTimeCode}
            style={{
              left: `${this.state.rightOfScrubMovie}px`,
            }}
          >
            {getThumbInfoValue(
              this.state.scrubInfo,
              addBefore ? scrubThumb.frameNumber : scrubThumbRight.frameNumber,
              file.fps,
            )}
          </span>
          <div
            className={styles.scrubThumbLine}
            style={{
              left: `${this.state.scrubThumbLineValue}px`,
            }}
          />
          <div id="timeLine" className={`${styles.timelineWrapper}`}>
            <div
              className={`${styles.timelinePlayhead}`}
              style={{
                left: `${this.state.scrubLineOnTimelineValue}px`,
              }}
            />
            <div
              className={`${styles.timelineScrubThumb}`}
              style={{
                left: `${this.state.timeLineScrubThumb}px`,
              }}
            />
            <div
              className={`${styles.timelineCut}`}
              style={{
                left: this.state.timeLineCutIn,
                width: this.state.timeLineCutOut - this.state.timeLineCutIn,
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
