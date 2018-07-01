import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scrub.css';
import {
  getObjectProperty,
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
    };

    this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    this.onScrubMouseUpWithStop = this.onScrubMouseUpWithStop.bind(this);
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
    this.setState({
      scrubLineValue: e.clientX
    })
    e.stopPropagation();
    this.props.onScrubWindowMouseOver(e);
  }

  onScrubMouseUpWithStop(e) {
    e.stopPropagation();
    this.props.onScrubWindowStop(e);
  }

  render() {


    return (
      <div
        className={styles.scrubContainerBackground}
        onMouseMove={this.onScrubMouseMoveWithStop}
        onMouseUp={this.onScrubMouseUpWithStop}
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
              style={{
                height: this.props.scaleValueObject.scrubMovieHeight,
                width: this.props.scaleValueObject.scrubMovieWidth,
              }}
            >
              <canvas
                ref={this.props.opencvVideoCanvasRef}
              />
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
          className={`${styles.scrubCancelBar}`}
          style={{
            height: `${MENU_FOOTER_HEIGHT}px`,
          }}
        >
          Cancel
        </div>
        <div
          className={`${styles.scrubLine}`}
          style={{
            left: `${this.state.scrubLineValue}px`,
          }}
        >
          {this.state.scrubLineValue}
        </div>
      </div>
    );
  }
}

Scrub.defaultProps = {
  // thumbImageObjectUrl: empty,
};

Scrub.propTypes = {
  keyObject: PropTypes.object.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  onScrubWindowMouseOver: PropTypes.func.isRequired,
  onScrubWindowStop: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  thumbImages: PropTypes.array,
  containerHeight: PropTypes.number.isRequired,
  containerWidth: PropTypes.number.isRequired,
  scrubThumb: PropTypes.object.isRequired,
  scrubThumbLeft: PropTypes.object.isRequired,
  scrubThumbRight: PropTypes.object.isRequired,
  opencvVideoCanvasRef: PropTypes.object.isRequired,
};

export default Scrub;
