// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scrub.css';
import {
  renderImage,
  setPosition,
  getScrubFrameNumber,
  mapRange,
  getThumbInfoValue,
} from '../utils/utils';
import transparent from '../img/Thumb_TRANSPARENT.png';
import {
  MENU_FOOTER_HEIGHT,
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
    this.updateOpencvVideoCanvas(scrubFrameNumber);
  }

  onScrubClickWithStop(e) {
    e.stopPropagation();
    this.props.onScrubWindowClick(e);
  }

  updateOpencvVideoCanvas(currentFrame) {
    setPosition(this.props.opencvVideo, currentFrame, this.props.file.useRatio);
    this.opencvScrubCutCanvasRef.height = this.props.containerHeight;
    this.opencvScrubCutCanvasRef.width = this.props.containerWidth;
    const ctx = this.opencvScrubCutCanvasRef.getContext('2d');
    for (let i = 0; i < 20; i += 1) {
      const frame = this.props.opencvVideo.read();
      if (!frame.empty) {
        const matCropped = frame.getRegion(new opencv.Rect(860, 0, 200, 1080));
        const matResized = matCropped.rescale(0.4);

        const matRGBA = matResized.channels === 1 ? matResized.cvtColor(opencv.COLOR_GRAY2RGBA) : matResized.cvtColor(opencv.COLOR_BGR2RGBA);

        const imgData = new ImageData(
          new Uint8ClampedArray(matRGBA.getData()),
          matResized.cols,
          matResized.rows
        );
        ctx.putImageData(imgData, i * 100, 0);
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
                // height: '1080px',
                // width: '1920px',
              }}
            >
              <canvas ref={(el) => { this.opencvScrubCutCanvasRef = el; }} />
            </span>
          </div>
        </div>
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
  opencvVideoCanvasRef: PropTypes.object.isRequired,
};

export default ScrubCut;
