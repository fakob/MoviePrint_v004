/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'semantic-ui-react';
import {
  MINIMUM_WIDTH_TO_SHRINK_HOVER, MINIMUM_WIDTH_TO_SHOW_HOVER,
  VERTICAL_OFFSET_OF_INOUTPOINT_POPUP
} from '../utils/constants';
import styles from './ThumbGrid.css';

import inPoint from './../img/Thumb_IN.png';
import outPoint from './../img/Thumb_OUT.png';
// import handleWide from './../img/Thumb_HANDLE_wide.png';
import save from './../img/Thumb_SAVE.png';
import hide from './../img/Thumb_HIDE.png';
import show from './../img/Thumb_SHOW.png';
import transparent from './../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height }) => {
  // function over(event) {
  //   event.target.style.opacity = 1;
  // }
  // function out(event) {
  //   event.target.style.opacity = 0.3;
  // }
  return (
    <button
      className={`${styles.dragHandleButton}`}
      // onMouseOver={over}
      // onMouseLeave={out}
      // onFocus={over}
      // onBlur={out}
      style={{
        width,
        height: Math.floor(height),
      }}
    >
      <img
        src={transparent}
        style={{
          width,
          height: Math.floor(height),
        }}
        alt=""
      />
      {/* <img
        src={handleWide}
        className={styles.dragHandleIcon}
        alt=""
      /> */}
    </button>
  );
});

const Thumb = ({
  onSelect, onToggle, onInPoint, onOutPoint, onSaveThumb, tempId, color,
  onOver, onOut, hidden, thumbImageObjectUrl, aspectRatioInv, thumbInfoRatio,
  controlersAreVisible, thumbWidth, margin, showMoviePrintView, borderRadius, thumbInfoValue, selected,
  inputRefThumb, onThumbDoubleClick, onBack, onForward, keyObject
}) => {
  function over(event) {
    event.target.style.opacity = 1;
  }

  function out(event) {
    event.target.style.opacity = 0.5;
  }

  function onToggleWithStop(e) {
    e.stopPropagation();
    onToggle();
  }

  function onSaveThumbWithStop(e) {
    e.stopPropagation();
    onSaveThumb();
  }

  function onInPointWithStop(e) {
    e.stopPropagation();
    onInPoint();
  }

  function onOutPointWithStop(e) {
    e.stopPropagation();
    onOutPoint();
  }

  function onForwardWithStop(e) {
    e.stopPropagation();
    onForward();
  }

  function onBackWithStop(e) {
    e.stopPropagation();
    onBack();
  }

  function onThumbDoubleClickWithStop(e) {
    e.stopPropagation();
    if (showMoviePrintView) {
      onSelect();
    }
    onThumbDoubleClick();
  }

  return (
    <div
      ref={inputRefThumb}
      onMouseOver={onOver}
      onMouseLeave={onOut}
      onFocus={onOver}
      onBlur={onOut}
      onClick={onSelect}
      onKeyPress={onSelect}
      onDoubleClick={onThumbDoubleClickWithStop}
      id={`thumb${tempId}`}
      className={`${styles.gridItem} ${(!showMoviePrintView && selected && !(keyObject.altKey || keyObject.shiftKey)) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        opacity: hidden ? '0.5' : '1',
        width: thumbWidth,
        margin: `${margin}px`,
        outlineWidth: `${margin}px`,
        borderRadius: `${(selected && !showMoviePrintView) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: thumbImageObjectUrl !== undefined ? undefined : color,
      }}
      >
      <div>
        <img
          src={thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent}
          id={`thumbImage${tempId}`}
          className={styles.image}
          alt=""
          width={`${thumbWidth}px`}
          height={`${(thumbWidth * aspectRatioInv)}px`}
          style={{
            // filter: `${controlersAreVisible ? 'brightness(80%)' : ''}`,
            borderRadius: `${(selected && !showMoviePrintView) ? 0 : borderRadius}px`,
          }}
        />
        {thumbInfoValue !== undefined &&
          <div
            className={styles.frameNumber}
            style={{
              transformOrigin: 'left top',
              transform: `scale(${(thumbInfoRatio * thumbWidth * aspectRatioInv) / 10})`,
            }}
          >
            {thumbInfoValue}
          </div>
        }
        <div
          style={{
            display: controlersAreVisible ? 'block' : 'none'
          }}
        >
          <DragHandle
            width={thumbWidth - 1}
            height={(thumbWidth * aspectRatioInv) - 1}
          />
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'center top',
              transform: `translate(-50%, 10%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
            }}
            className={`${styles.hoverButton} ${styles.hide}`}
            onClick={onToggleWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            <Icon
              inverted
              name={hidden ? 'unhide' : 'hide'}
              className={styles.opaque}
            />
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'top right',
              transform: `translate(-50%, 10%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
            }}
            className={`${styles.hoverButton} ${styles.save}`}
            onClick={onSaveThumbWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            <Icon
              inverted
              name="download"
              className={styles.opaque}
            />
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'left bottom',
              transform: `scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
              position: 'absolute',
              bottom: 0,
              left: 0,
              marginLeft: '8px',
            }}
            className={`${styles.hoverButton} ${styles.textButton}`}
            onClick={onInPointWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            IN
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'center bottom',
              transform: `translateX(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
              position: 'absolute',
              bottom: 0,
              left: '30%',
            }}
            className={`${styles.hoverButton} ${styles.textButton}`}
            onClick={onBackWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            {/* {keyObject.altKey ? '-100' : (keyObject.shiftKey ? '-10' : '-1')} */}
            {keyObject.altKey ? '<<<' : (keyObject.shiftKey ? '<<' : '<')}
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'center bottom',
              transform: `translateX(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
              position: 'absolute',
              bottom: 0,
              left: '50%',
            }}
            className={`${styles.hoverButton} ${styles.textButton}`}
            onClick={onThumbDoubleClickWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            {showMoviePrintView ? 'EDIT' : 'BACK'}
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'center bottom',
              transform: `translateX(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
              position: 'absolute',
              bottom: 0,
              left: '70%',
            }}
            className={`${styles.hoverButton} ${styles.textButton}`}
            onClick={onForwardWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            {/* {keyObject.altKey ? '+100' : (keyObject.shiftKey ? '+10' : '+1')} */}
            {keyObject.altKey ? '>>>' : (keyObject.shiftKey ? '>>' : '>')}
          </button>
          <button
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              transformOrigin: 'right bottom',
              transform: `scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
              position: 'absolute',
              bottom: 0,
              right: 0,
              marginRight: '8px',
            }}
            className={`${styles.hoverButton} ${styles.textButton}`}
            onClick={onOutPointWithStop}
            onMouseOver={over}
            onMouseLeave={out}
            onFocus={over}
            onBlur={out}
          >
            OUT
          </button>
        </div>
        {!showMoviePrintView && selected && (keyObject.altKey || keyObject.shiftKey) &&
          <div
            style={{
              content: '',
              backgroundColor: '#FF5006',
              position: 'absolute',
              width: `${margin * 0.5}px`,
              height: `${(thumbWidth * aspectRatioInv) + (margin * 2)}px`,
              top: (margin * -1.0),
              left: `${(!keyObject.altKey && keyObject.shiftKey) ? 0 : undefined}`,
              right: `${keyObject.altKey ? 0 : undefined}`,
              display: 'block',
              transform: `translateX(${margin * (keyObject.altKey ? 1.25 : -1.25)}px)`,
            }}
          />
        }
      </div>
    </div>
  );
};

Thumb.defaultProps = {
  selected: false,
  controlersAreVisible: false,
  hidden: false,
  thumbImageObjectUrl: undefined,
  thumbInfoValue: undefined,
  onSelect: null,
  onOut: null,
  onOver: null,
  onToggle: null,
  onInPoint: null,
  onOutPoint: null,
  onSaveThumb: null,
  keyObject: {}
};

Thumb.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  controlersAreVisible: PropTypes.bool,
  hidden: PropTypes.bool,
  inputRefThumb: PropTypes.object,
  keyObject: PropTypes.object,
  margin: PropTypes.number.isRequired,
  onInPoint: PropTypes.func,
  onOut: PropTypes.func,
  onOutPoint: PropTypes.func,
  onSaveThumb: PropTypes.func,
  onOver: PropTypes.func,
  onSelect: PropTypes.func,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onToggle: PropTypes.func,
  selected: PropTypes.bool,
  tempId: PropTypes.number.isRequired,
  thumbImageObjectUrl: PropTypes.string,
  thumbInfoRatio: PropTypes.number.isRequired,
  thumbInfoValue: PropTypes.string,
  thumbWidth: PropTypes.number.isRequired,
  showMoviePrintView: PropTypes.bool.isRequired,
};

export default Thumb;
