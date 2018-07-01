import React from 'react';
import styles from './Scrub.css';
import {
  getObjectProperty,
} from '../utils/utils';
import transparent from '../img/Thumb_TRANSPARENT.png';
import {
  MENU_FOOTER_HEIGHT,
} from '../utils/constants';

const Scrub = ({
  keyObject,
  scaleValueObject,
  onScrubWindowMouseOver,
  onScrubWindowStop,
  settings,
  thumbImages,
  containerHeight,
  containerWidth,
  scrubThumb,
  scrubThumbLeft,
  scrubThumbRight,
  opencvVideoCanvasRef,
}) => {

  function onScrubMouseMoveWithStop(e) {
    e.stopPropagation();
    onScrubWindowMouseOver(e);
  }

  function onScrubMouseUpWithStop(e) {
    e.stopPropagation();
    onScrubWindowStop(e);
  }

  return (
    <div
      className={styles.scrubContainerBackground}
      onMouseMove={onScrubMouseMoveWithStop}
      onMouseUp={onScrubMouseUpWithStop}
    >
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
              backgroundImage: `url(${keyObject.altKey ?
                getObjectProperty(() => thumbImages[scrubThumb.frameId].objectUrl) :
                getObjectProperty(() => thumbImages[scrubThumbLeft.frameId].objectUrl) || transparent})`,
              height: scaleValueObject.scrubInOutMovieHeight,
              width: scaleValueObject.scrubInOutMovieWidth,
              margin: settings.defaultScrubWindowMargin,
            }}
          />
          {keyObject.ctrlKey &&
            <div
              style={{
                content: '',
                backgroundImage: `url(${getObjectProperty(() => thumbImages[scrubThumb.frameId].objectUrl)})`,
                backgroundSize: 'cover',
                opacity: '0.4',
                position: 'absolute',
                width: (containerHeight * settings.defaultScrubWindowHeightRatio) / scaleValueObject.aspectRatioInv,
                height: containerHeight * settings.defaultScrubWindowHeightRatio,
                top: 0,
                left: keyObject.altKey ? (containerWidth -
                  ((containerHeight * settings.defaultScrubWindowHeightRatio) / scaleValueObject.aspectRatioInv)) / 2 -
                  settings.defaultScrubWindowMargin + (containerHeight * settings.defaultScrubWindowHeightRatio) / scaleValueObject.aspectRatioInv :
                  (containerWidth -
                    ((containerHeight * settings.defaultScrubWindowHeightRatio) / scaleValueObject.aspectRatioInv)) / 2 -
                    settings.defaultScrubWindowMargin,
              }}
            />
          }
          <span
            style={{
              height: scaleValueObject.scrubMovieHeight,
              width: scaleValueObject.scrubMovieWidth,
            }}
          >
            <canvas
              ref={opencvVideoCanvasRef}
            />
          </span>
          <span
            className={styles.scrubThumbRight}
            style={{
              backgroundImage: `url(${keyObject.shiftKey ?
                getObjectProperty(() => thumbImages[scrubThumb.frameId].objectUrl) :
                getObjectProperty(() => thumbImages[scrubThumbRight.frameId].objectUrl) || transparent})`,
              height: scaleValueObject.scrubInOutMovieHeight,
              width: scaleValueObject.scrubInOutMovieWidth,
              margin: settings.defaultScrubWindowMargin,
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
        {keyObject.altKey ? 'Add after' : (keyObject.shiftKey ? 'Add before' : 'Change')}
      </div> */}
      <div
        className={`${styles.scrubCancelBar}`}
        style={{
          height: `${MENU_FOOTER_HEIGHT}px`,
        }}
      >
        Cancel
      </div>
    </div>
  );
};

Scrub.defaultProps = {
  // thumbImageObjectUrl: empty,
};

Scrub.propTypes = {
  // showMoviePrintView: PropTypes.bool,
  // aspectRatioInv: PropTypes.number,
  // thumbWidth: PropTypes.number,
  // margin: PropTypes.number,
  // borderRadius: PropTypes.number,
  // hidden: PropTypes.bool,
  // controlersAreVisible: PropTypes.bool,
  // frameNumber: PropTypes.number,
  // thumbImageObjectUrl: PropTypes.string,
  // onToggle: PropTypes.func,
  // onInPoint: PropTypes.func,
  // onOutPoint: PropTypes.func,
  // onBack: PropTypes.func,
  // onForward: PropTypes.func,
  // onScrub: PropTypes.func,
  // onOver: PropTypes.func,
  // onOut: PropTypes.func,
};

export default Scrub;
