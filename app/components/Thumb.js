// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import styles from './ThumbGrid.css';

import inPoint from './../img/Thumb_IN.png';
import outPoint from './../img/Thumb_OUT.png';
import back from './../img/Thumb_BACK.png';
import forward from './../img/Thumb_FORWARD.png';
import scrub from './../img/Thumb_SCRUB.png';
import handleWide from './../img/Thumb_HANDLE_wide.png';
import hide from './../img/Thumb_HIDE.png';
import show from './../img/Thumb_SHOW.png';
import empty from './../img/Thumb_EMPTY.png';
import transparent from './../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ scaleValue }) => {
  function over(event) {
    event.target.style.opacity = 1;
  }
  function out(event) {
    event.target.style.opacity = 0.3;
  }
  return (
    <button
      className={styles.hoverButton}
      onMouseOver={over}
      onMouseLeave={out}
      onFocus={over}
      onBlur={out}
      style={{
        // transformOrigin: 'center center',
        // transform: `scale(${scaleValue})`,
      }}
    >
      <img
        src={handleWide}
        className={styles.dragHandle}
        alt=""
      />
    </button>
  );
});

const Thumb = ({
  onSelect, onToggle, onInPoint, onOutPoint, onBack, onForward, tempId, color, scaleValue,
  onOver, onOut, onScrub, hidden, thumbImageObjectUrl, aspectRatioInv, thumbInfoRatio,
  controlersAreVisible, thumbWidth, margin, zoomOut, borderRadius, thumbInfoValue, selected,
  inputRefThumb, onThumbDoubleClick
}) => {
  function over(event) {
    event.target.style.opacity = 1;
  }

  function out(event) {
    event.target.style.opacity = 0.5;
  }

  const minimumWidthToShowHover = 100;
  const minimumWidthToShrinkHover = 160;
  const handleWideWidth = 144;

  return (
    <div
      ref={inputRefThumb}
      onMouseOver={onOver}
      onMouseLeave={onOut}
      onFocus={onOver}
      onBlur={onOut}
      onClick={onSelect}
      onDoubleClick={onThumbDoubleClick}
      id={`thumb${tempId}`}
      className={`${styles.gridItem} ${(selected && !zoomOut) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        opacity: hidden ? '0.2' : '1',
        width: thumbWidth,
        margin: `${margin}px`,
        outlineWidth: `${selected ? margin : 0}px`,
        borderRadius: `${selected ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: thumbImageObjectUrl !== undefined ? undefined : color,
      }}
    >
      <img
        src={thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent}
        // src={thumbImageObjectUrl}
        // onError={`this.src=${empty}`}
        id={`thumbImage${tempId}`}
        className={styles.image}
        alt=""
        width={`${thumbWidth}px`}
        height={`${(thumbWidth * aspectRatioInv)}px`}
        style={{
          filter: `${controlersAreVisible ? 'brightness(80%)' : ''}`,
          borderRadius: `${selected ? 0 : borderRadius}px`,
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
        <button
          className={styles.hoverButton}
          // onMouseOver={over}
          // onMouseLeave={out}
          // onFocus={over}
          // onBlur={out}
          style={{
            // transformOrigin: 'center center',
            // transform: `scale(${scaleValue})`,
            // opacity: 1
          }}
        >
          <img
            src={handleWide}
            className={styles.dragHandle}
            style={{
              width: `${Math.min(handleWideWidth, thumbWidth)}px`
            }}
            alt=""
          />
        </button>
        {/* <DragHandle
          scaleValue={scaleValue}
        /> */}
        <button
          style={{
            display: (thumbWidth > minimumWidthToShowHover) ? 'block' : 'none',
            transformOrigin: 'top right',
            transform: `scale(${(thumbWidth > minimumWidthToShrinkHover) ? 1 : 0.7})`,
            position: 'absolute',
            top: 0,
            right: 0,
          }}
          className={styles.hoverButton}
          onClick={onToggle}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={hidden ? show : hide}
            className={styles.hide}
            alt=""
          />
        </button>
        <button
          style={{
            display: (thumbWidth > minimumWidthToShowHover) ? 'block' : 'none',
            transformOrigin: 'left bottom',
            transform: `scale(${(thumbWidth > minimumWidthToShrinkHover) ? 1 : 0.7})`,
            position: 'absolute',
            bottom: 0,
            left: 0,
          }}
          className={styles.hoverButton}
          onClick={onInPoint}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={inPoint}
            className={styles.inPoint}
            alt=""
          />
        </button>
        {/* <button
          style={{
            display: !zoomOut ? 'block' : 'none'
          }}
          className={styles.hoverButton}
          onClick={onBack}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={back}
            className={styles.back}
            alt=""
          />
        </button> */}
        {/* <button
          style={{
            display: !zoomOut ? 'block' : 'none',
          }}
          className={styles.hoverButton}
          onClick={onScrub}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={scrub}
            className={styles.scrub}
            alt=""
          />
        </button> */}
        {/* <button
          style={{
            display: !zoomOut ? 'block' : 'none'
          }}
          className={styles.hoverButton}
          onClick={onForward}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={forward}
            className={styles.forward}
            alt=""
          />
        </button> */}
        <button
          style={{
            display: (thumbWidth > minimumWidthToShowHover) ? 'block' : 'none',
            transformOrigin: 'right bottom',
            transform: `scale(${(thumbWidth > minimumWidthToShrinkHover) ? 1 : 0.7})`,
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}
          className={styles.hoverButton}
          onClick={onOutPoint}
          onMouseOver={over}
          onMouseLeave={out}
          onFocus={over}
          onBlur={out}
        >
          <img
            src={outPoint}
            className={styles.outPoint}
            alt=""
          />
        </button>
      </div>
    </div>
  );
};

Thumb.defaultProps = {
  // thumbImageObjectUrl: empty,
};

Thumb.propTypes = {
  zoomOut: PropTypes.bool,
  aspectRatioInv: PropTypes.number,
  thumbWidth: PropTypes.number,
  margin: PropTypes.number,
  borderRadius: PropTypes.number,
  hidden: PropTypes.bool,
  controlersAreVisible: PropTypes.bool,
  frameNumber: PropTypes.number,
  thumbImageObjectUrl: PropTypes.string,
  onToggle: PropTypes.func,
  onInPoint: PropTypes.func,
  onOutPoint: PropTypes.func,
  onBack: PropTypes.func,
  onForward: PropTypes.func,
  onScrub: PropTypes.func,
  onOver: PropTypes.func,
  onOut: PropTypes.func,
};

export default Thumb;
