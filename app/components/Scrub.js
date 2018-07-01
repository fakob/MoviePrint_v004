// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scrub.css';
import {
  getObjectProperty,
  getScrubFrameNumber,
  mapRange,
} from '../utils/utils';
import transparent from '../img/Thumb_TRANSPARENT.png';
import {
  MENU_FOOTER_HEIGHT,
} from '../utils/constants';

class Scrub extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scrubLineValue: undefined,
      scrubFrameNumber: undefined,
      scrubLineOnTimelineValue: undefined,
      timeLineCutIn: undefined,
      timeLineCutOut: undefined,
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
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    const timeLineCutOut = mapRange(
      this.props.scrubThumbRight.frameNumber,
      0,
      this.props.file.frameCount,
      0,
      this.props.scaleValueObject.scrubInnerContainerWidth
    );
    this.setState({
      scrubFrameNumber: this.props.scrubThumb.frameNumber,
      timeLineCutIn,
      timeLineCutOut,
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
    this.props.onScrubWindowMouseOver(e);
  }

  onScrubClickWithStop(e) {
    e.stopPropagation();
    this.props.onScrubWindowClick(e);
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
              className={styles.scrubThumbLeft}
              style={{
                backgroundImage: `url(${this.props.keyObject.altKey ?
                  getObjectProperty(() => this.props.thumbImages[this.props.scrubThumb.frameId].objectUrl) :
                  getObjectProperty(() => this.props.thumbImages[this.props.scrubThumbLeft.frameId].objectUrl) || transparent})`,
                height: this.props.scaleValueObject.scrubInOutMovieHeight,
                width: this.props.scaleValueObject.scrubInOutMovieWidth,
                margin: this.props.settings.defaultScrubWindowMargin,
              }}
            />
            {this.props.keyObject.ctrlKey &&
              <div
                style={{
                  content: '',
                  backgroundImage: `url(${getObjectProperty(() => this.props.thumbImages[this.props.scrubThumb.frameId].objectUrl)})`,
                  backgroundSize: 'cover',
                  opacity: '0.4',
                  position: 'absolute',
                  width: (this.props.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.props.scaleValueObject.aspectRatioInv,
                  height: this.props.containerHeight * this.props.settings.defaultScrubWindowHeightRatio,
                  top: 0,
                  left: this.props.keyObject.altKey ? (this.props.containerWidth -
                    ((this.props.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.props.scaleValueObject.aspectRatioInv)) / 2 -
                    this.props.settings.defaultScrubWindowMargin + (this.props.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.props.scaleValueObject.aspectRatioInv :
                    (this.props.containerWidth -
                      ((this.props.containerHeight * this.props.settings.defaultScrubWindowHeightRatio) / this.props.scaleValueObject.aspectRatioInv)) / 2 -
                      this.props.settings.defaultScrubWindowMargin,
                }}
              />
            }
            <span
              className={styles.scrubThumb}
              style={{
                height: this.props.scaleValueObject.scrubMovieHeight,
                width: this.props.scaleValueObject.scrubMovieWidth,
              }}
            >
              <canvas
                ref={this.props.opencvVideoCanvasRef}
              />
              <span
                id="currentTimeDisplay"
                className={styles.frameNumberOrTimeCode}
              >
                {this.state.scrubFrameNumber}
              </span>
            </span>
            <span
              className={styles.scrubThumbRight}
              style={{
                backgroundImage: `url(${this.props.keyObject.shiftKey ?
                  getObjectProperty(() => this.props.thumbImages[this.props.scrubThumb.frameId].objectUrl) :
                  getObjectProperty(() => this.props.thumbImages[this.props.scrubThumbRight.frameId].objectUrl) || transparent})`,
                height: this.props.scaleValueObject.scrubInOutMovieHeight,
                width: this.props.scaleValueObject.scrubInOutMovieWidth,
                margin: this.props.settings.defaultScrubWindowMargin,
              }}
            />
          </div>
          <div
            className={styles.scrubLine}
            style={{
              left: `${this.state.scrubLineValue}px`,
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
  thumbImages: PropTypes.object.isRequired,
  containerHeight: PropTypes.number.isRequired,
  containerWidth: PropTypes.number.isRequired,
  scrubThumb: PropTypes.object.isRequired,
  scrubThumbLeft: PropTypes.object.isRequired,
  scrubThumbRight: PropTypes.object.isRequired,
  opencvVideoCanvasRef: PropTypes.object.isRequired,
};

export default Scrub;
