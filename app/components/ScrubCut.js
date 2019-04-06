// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scrub.css';
import VideoCaptureProperties from '../utils/videoCaptureProperties';
import {
  limitRange,
  setPosition,
  getScrubFrameNumber,
  mapRange,
  getSliceWidthArrayForScrub,
  getThumbInfoValue,
} from '../utils/utils';
import transparent from '../img/Thumb_TRANSPARENT.png';
import {
  MENU_FOOTER_HEIGHT,
  SCRUBCUT_SLICE_ARRAY_SIZE,
} from '../utils/constants';

const opencv = require('opencv4nodejs');

class ScrubCut extends Component {
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
      videoHeight: 360,
      videoWidth: 640,
    };

    const frameBufferArray = [];

    this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    this.onScrubClickWithStop = this.onScrubClickWithStop.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);

  }

  componentWillMount() {
    const timeLineCutIn = mapRange(
      this.props.scrubThumbLeft.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    const timeLineScrubThumb = mapRange(
      this.props.scrubThumb.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    const timeLineCutOut = mapRange(
      this.props.scrubThumbRight.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    const leftOfScrubMovie = (this.props.scaleValueObject.scrubInnerContainerWidth - this.props.scaleValueObject.scrubMovieWidth) / 2;
    const rightOfScrubMovie = leftOfScrubMovie + this.props.scaleValueObject.scrubMovieWidth;
    const scrubThumbLineValue = mapRange(
      this.props.scrubThumb.frameNumber,
      this.props.scrubThumbLeft.frameNumber,
      this.props.scrubThumbRight.frameNumber,
      leftOfScrubMovie,
      rightOfScrubMovie
    );

    // show timecode if hideInfo
    const scrubInfo = this.props.settings.defaultThumbInfo === 'hideInfo' ?
      'timecode' : this.props.settings.defaultThumbInfo;

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

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidUpdate(prevProps) {
  }

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
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    this.setState({
      scrubLineValue: e.clientX,
      scrubFrameNumber,
      scrubLineOnTimelineValue,
    })
    e.stopPropagation();

    // offset scrubFrameNumber due to main frame is in middle of sliceArraySize
    const halfArraySize = Math.floor(SCRUBCUT_SLICE_ARRAY_SIZE / 2);
    const offsetScrubFrameNumber = limitRange(
      scrubFrameNumber - parseInt(halfArraySize, 10),
      0,
      this.props.file.frameCount - 1
    );
    this.updateOpencvVideoCanvas(offsetScrubFrameNumber);
  }

  onScrubClickWithStop(e) {
    e.stopPropagation();
    this.props.onScrubWindowClick(e);
  }

  updateOpencvVideoCanvas(currentFrame) {
    const vid = this.props.opencvVideo;
    setPosition(vid, currentFrame, this.props.file.useRatio);
    const scrubMovieWidth = this.props.scaleValueObject.scrubMovieWidth;
    const scrubMovieHeight = this.props.scaleValueObject.scrubMovieHeight;
    this.opencvScrubCutCanvasRef.height = scrubMovieHeight;
    this.opencvScrubCutCanvasRef.width = this.props.containerWidth;
    const ctx = this.opencvScrubCutCanvasRef.getContext('2d');
    const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
    const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
    const sliceWidthArray = getSliceWidthArrayForScrub(vid, SCRUBCUT_SLICE_ARRAY_SIZE);
    const sliceGap = 2;
    const widthSum = sliceWidthArray.reduce((a, b) => a + b, 0);
    const rescaleFactorMain = scrubMovieWidth / width;
      // this.props.scaleValueObject.aspectRatioInv < 1 ?
      // scrubMovieWidth / width :
      // scrubMovieHeight / height;
    const rescaleFactor = (this.props.containerWidth - scrubMovieWidth - sliceGap * (SCRUBCUT_SLICE_ARRAY_SIZE - 1)) / (widthSum - width);
    let canvasXPos = 0;
    const canvasYPosMain = 0;
    const canvasYPos = (scrubMovieHeight - height * rescaleFactor) / 2;

    const halfArraySize = Math.floor(SCRUBCUT_SLICE_ARRAY_SIZE / 2);

    for (let i = 0; i < SCRUBCUT_SLICE_ARRAY_SIZE; i += 1) {
      const frame = vid.read();
      if (!frame.empty) {
        const sliceWidth = sliceWidthArray[i];
        const sliceXPos = Math.max(Math.floor(width / 2) - Math.floor(sliceWidth / 2), 0);

        const matCropped = frame.getRegion(new opencv.Rect(sliceXPos, 0, sliceWidth, height));
        const matResized = (i === halfArraySize) ?
          matCropped.rescale(rescaleFactorMain) :
          matCropped.rescale(rescaleFactor);

        const matRGBA = matResized.channels === 1 ?
          matResized.cvtColor(opencv.COLOR_GRAY2RGBA) :
          matResized.cvtColor(opencv.COLOR_BGR2RGBA);

        const imgData = new ImageData(
          new Uint8ClampedArray(matRGBA.getData()),
          matResized.cols,
          matResized.rows
        );
        ctx.putImageData(imgData, canvasXPos, (i === halfArraySize) ?
          canvasYPosMain :
          canvasYPos
        );
        canvasXPos += (i === halfArraySize) ?
          (sliceWidthArray[i] * rescaleFactorMain) + sliceGap :
          (sliceWidthArray[i] * rescaleFactor) + sliceGap;
      }
    }
  }

  render() {

    return (
      <div
        className={styles.scrubContainerBackground}
        onMouseMove={this.onScrubMouseMoveWithStop}
        onMouseUp={this.onScrubClickWithStop}
        // onClick={this.onScrubClickWithStop}
      >
        <div
          className={styles.scrubInfo}
        >
          {this.props.keyObject.shiftKey && 'ADD BEFORE'}
          {this.props.keyObject.altKey && 'ADD AFTER'}
          {!this.props.keyObject.shiftKey && !this.props.keyObject.altKey && 'CHANGE TO'}
        </div>
        <div
          className={styles.scrubContainer}
          style={{
            height: this.props.scaleValueObject.scrubContainerHeight,
            width: this.props.scaleValueObject.scrubContainerWidth,
          }}
        >
          <div
            className={styles.scrubInnerContainer}
            style={{
              width: this.props.scaleValueObject.scrubInnerContainerWidth,
            }}
          >
            <span
              className={styles.scrubThumb}
              style={{
                height: this.props.scaleValueObject.scrubMovieHeight,
                width: this.props.scaleValueObject.scrubMovieWidth,
              }}
            >
              <canvas ref={(el) => { this.opencvScrubCutCanvasRef = el; }} />
            </span>
          </div>
          <span
            id="currentTimeDisplay"
            className={styles.frameNumberOrTimeCode}
            style={{
              left: `${this.state.scrubLineValue}px`,
            }}
          >
            {getThumbInfoValue(
              this.state.scrubInfo,
              this.state.scrubFrameNumber,
              this.props.file.fps
            )}
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
              this.props.keyObject.altKey ? this.props.scrubThumb.frameNumber : this.props.scrubThumbLeft.frameNumber,
              this.props.file.fps
            )}
          </span>
          {!this.props.keyObject.shiftKey && !this.props.keyObject.altKey &&
            <span
              className={styles.scrubThumbframeNumberOrTimeCode}
              style={{
                left: `${this.state.scrubThumbLineValue}px`,
              }}
            >
              {getThumbInfoValue(
                this.state.scrubInfo,
                this.props.scrubThumb.frameNumber,
                this.props.file.fps
              )}
            </span>
          }
          <span
            className={styles.scrubThumbframeNumberOrTimeCode}
            style={{
              left: `${this.state.rightOfScrubMovie}px`,
            }}
          >
            {getThumbInfoValue(
              this.state.scrubInfo,
              this.props.keyObject.shiftKey ? this.props.scrubThumb.frameNumber : this.props.scrubThumbRight.frameNumber,
              this.props.file.fps
            )}
          </span>
          <div
            className={styles.scrubThumbLine}
            style={{
              left: `${this.state.scrubThumbLineValue}px`,
            }}
          />
          <div
            id="timeLine"
            className={`${styles.timelineWrapper}`}
          >
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
          {this.props.keyObject.altKey ? 'Add after' : (this.props.keyObject.shiftKey ? 'Add before' : 'Change')}
        </div> */}
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
      </div>
    );
  }
}

ScrubCut.defaultProps = {
  // thumbImageObjectUrl: empty,
};

ScrubCut.propTypes = {
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
};

export default ScrubCut;
