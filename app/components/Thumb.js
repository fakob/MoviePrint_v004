/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import styles from './ThumbGrid.css';
import { Popup } from 'semantic-ui-react'

import inPoint from './../img/Thumb_IN.png';
import outPoint from './../img/Thumb_OUT.png';
import handleWide from './../img/Thumb_HANDLE_wide.png';
import hide from './../img/Thumb_HIDE.png';
import show from './../img/Thumb_SHOW.png';
import transparent from './../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height }) => {
  function over(event) {
    event.target.style.opacity = 1;
  }
  function out(event) {
    event.target.style.opacity = 0.3;
  }
  return (
    <button
      className={`${styles.dragHandleButton}`}
      onMouseOver={over}
      onMouseLeave={out}
      onFocus={over}
      onBlur={out}
      style={{
        width,
        height,
      }}
    >
      <img
        src={transparent}
        style={{
          width,
          // height: height * 0.8,
          height,
        }}
        alt=""
      />
      <img
        src={handleWide}
        className={styles.dragHandleIcon}
        alt=""
      />
    </button>
  );
});

const Thumb = ({
  onSelect, onToggle, onInPoint, onOutPoint, tempId, color,
  onOver, onOut, hidden, thumbImageObjectUrl, aspectRatioInv, thumbInfoRatio,
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
  const verticalOffsetOfInOutPointPopup = 40; // heightOfInOutPointButtons

  return (
    <div
      ref={inputRefThumb}
      onMouseOver={onOver}
      onMouseLeave={onOut}
      onFocus={onOver}
      onBlur={onOut}
      onClick={onSelect}
      onKeyPress={onSelect}
      onDoubleClick={onThumbDoubleClick}
      id={`thumb${tempId}`}
      className={`${styles.gridItem} ${(selected && !zoomOut) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        opacity: hidden ? '0.2' : '1',
        width: thumbWidth,
        margin: `${margin}px`,
        outlineWidth: `${(selected && !zoomOut) ? margin : 0}px`,
        borderRadius: `${(selected && !zoomOut) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: thumbImageObjectUrl !== undefined ? undefined : color,
      }}
    >
      <img
        src={thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent}
        id={`thumbImage${tempId}`}
        className={styles.image}
        alt=""
        width={`${thumbWidth}px`}
        height={`${(thumbWidth * aspectRatioInv)}px`}
        style={{
          filter: `${controlersAreVisible ? 'brightness(80%)' : ''}`,
          borderRadius: `${(selected && !zoomOut) ? 0 : borderRadius}px`,
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
          width={thumbWidth}
          height={thumbWidth * aspectRatioInv}
        />
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
        <Popup
          trigger={
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
          }
          content="Use this frame as In-point"
          hoverable
          basic
          inverted
          mouseEnterDelay={1000}
          className={styles.popupThumb}
          verticalOffset={(thumbWidth > minimumWidthToShrinkHover) ?
            verticalOffsetOfInOutPointPopup : verticalOffsetOfInOutPointPopup / 2}
          style={{
            transformOrigin: 'left bottom',
            transform: `scale(${(thumbWidth > minimumWidthToShrinkHover) ? 1 : 0.7})`,
          }}
        />
        <Popup
          trigger={
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
          }
          content="Use this frame as Out-point"
          hoverable
          basic
          inverted
          mouseEnterDelay={1000}
          position="top right"
          className={styles.popupThumb}
          verticalOffset={(thumbWidth > minimumWidthToShrinkHover) ?
            verticalOffsetOfInOutPointPopup : verticalOffsetOfInOutPointPopup / 2}
          style={{
            transformOrigin: 'right bottom',
            transform: `scale(${(thumbWidth > minimumWidthToShrinkHover) ? 1 : 0.7})`,
          }}
        />
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
};

Thumb.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  controlersAreVisible: PropTypes.bool,
  hidden: PropTypes.bool,
  inputRefThumb: PropTypes.object,
  margin: PropTypes.number.isRequired,
  onInPoint: PropTypes.func,
  onOut: PropTypes.func,
  onOutPoint: PropTypes.func,
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
  zoomOut: PropTypes.bool.isRequired,
};

export default Thumb;
