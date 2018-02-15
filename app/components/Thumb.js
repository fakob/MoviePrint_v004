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
  onToggle, onInPoint, onOutPoint, onBack, onForward,
  onOver, onOut, onScrub, hidden, frameNumber, thumbImageObjectUrl, width, height,
  controlersAreVisible, thumbWidth
}) => {
  function over(event) {
    event.target.style.opacity = 1;
  }

  function out(event) {
    event.target.style.opacity = 0.5;
  }

  function pad(num, size) {
    let s = num.toString();
    while (s.length < size) s = `0${s}`;
    return s;
  }

  return (
    <div
      onMouseOver={onOver}
      onMouseLeave={onOut}
      onFocus={onOver}
      onBlur={onOut}
      className={styles.gridItem}
      style={{
        opacity: hidden ? '0.2' : '1',
        width: thumbWidth,
      }}
    >
      <img
        src={thumbImageObjectUrl}
        // src={thumbImageObjectUrl || empty}
        className={styles.image}
        alt=""
        width={`${thumbWidth}px`}
        height={`${(thumbWidth * (height / width))}px`}
      />
      {frameNumber !== undefined &&
        <div
          className={styles.frameNumber}
        >
          {pad(frameNumber, 4)}
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
  thumbImageObjectUrl: empty,
};

Thumb.propTypes = {
  // id: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onToggle: PropTypes.func.isRequired,
  thumbWidth: PropTypes.number.isRequired,
  hidden: PropTypes.bool.isRequired,
  controlersAreVisible: PropTypes.bool.isRequired,
  frameNumber: PropTypes.number.isRequired,
  thumbImageObjectUrl: PropTypes.string,
  onInPoint: PropTypes.func.isRequired,
  onOutPoint: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
  onScrub: PropTypes.func.isRequired,
  onOver: PropTypes.func.isRequired,
  onOut: PropTypes.func.isRequired,
};

export default Thumb;
