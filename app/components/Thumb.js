// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import styles from './ThumbGrid.css';
import { getMoviePrintColor } from '../utils/utils';

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

const DragHandle = SortableHandle(() => {
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
  onToggle, onInPoint, onOutPoint, onBack, onForward, tempId,
  onOver, onOut, onScrub, hidden, thumbImageObjectUrl, aspectRatioInv,
  controlersAreVisible, thumbWidth, margin, zoomOut, borderRadius, thumbInfoValue
}) => {
  function over(event) {
    event.target.style.opacity = 1;
  }

  function out(event) {
    event.target.style.opacity = 0.5;
  }

  return (
    <div
      onMouseOver={onOver}
      onMouseLeave={onOut}
      onFocus={onOver}
      onBlur={onOut}
      id={`thumb${tempId}`}
      className={styles.gridItem}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        opacity: hidden ? '0.2' : '1',
        width: thumbWidth,
        margin: `${margin}px`,
        borderRadius: `${borderRadius}px`,
        backgroundColor: getMoviePrintColor(tempId),
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
          borderRadius: `${borderRadius}px`,
        }}
      />
      {thumbInfoValue !== undefined &&
        <div
          className={styles.frameNumber}
        >
          {thumbInfoValue}
        </div>
      }
      <div
        style={{
          display: controlersAreVisible ? 'block' : 'none'
        }}
      >
        <DragHandle />
        <button
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
            display: !zoomOut ? 'block' : 'none',
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
        <button
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
        </button>
        <button
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
        </button>
        <button
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
        </button>
        <button
          style={{
            display: !zoomOut ? 'block' : 'none'
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
