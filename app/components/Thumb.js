/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import { MINIMUM_WIDTH_TO_SHRINK_HOVER, MINIMUM_WIDTH_TO_SHOW_HOVER } from '../utils/constants';
import styles from './ThumbGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height }) =>
  (
    <button
      className={`${styles.dragHandleButton}`}
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
    </button>
  ));

const Thumb = ({
  aspectRatioInv,
  borderRadius,
  color,
  controlersAreVisible,
  dim,
  hidden,
  index,
  inputRefThumb,
  keyObject,
  margin,
  onBack,
  onForward,
  onHoverInPoint,
  onHoverOutPoint,
  onInPoint,
  onLeaveInOut,
  onOut,
  onOutPoint,
  onOver,
  onSaveThumb,
  onSelect,
  onThumbDoubleClick,
  onToggle,
  selected,
  showMoviePrintView,
  thumbImageObjectUrl,
  thumbInfoRatio,
  thumbInfoValue,
  thumbWidth,
}) => {
  function over(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
  }

  function out(e) {
    e.stopPropagation();
    e.target.style.opacity = 0.2;
  }

  function onToggleWithStop(e) {
    e.stopPropagation();
    onToggle();
  }

  function onSaveThumbWithStop(e) {
    e.stopPropagation();
    onSaveThumb();
  }

  function onHoverInPointWithStop(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
    onHoverInPoint();
  }

  function onHoverOutPointWithStop(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
    onHoverOutPoint();
  }

  function onLeaveInOutWithStop(e) {
    e.stopPropagation();
    e.target.style.opacity = 0.2;
    onLeaveInOut();
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

  function onSelectWithStop(e) {
    e.stopPropagation();
    onSelect();
  }

  function onOverWithStop(e) {
    e.stopPropagation();
    onOver();
  }

  function onOutWithStop(e) {
    e.stopPropagation();
    onOut();
  }

  return (
    <div
      ref={inputRefThumb}
      role="button"
      tabIndex={index}
      onMouseOver={onOverWithStop}
      onMouseLeave={onOutWithStop}
      onFocus={onOverWithStop}
      onBlur={onOutWithStop}
      onClick={onSelectWithStop}
      onKeyPress={onSelectWithStop}
      onDoubleClick={onThumbDoubleClickWithStop}
      id={`thumb${index}`}
      className={`${styles.gridItem} ${(!showMoviePrintView && selected && !(keyObject.altKey || keyObject.shiftKey)) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
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
          id={`thumbImage${index}`}
          className={`${styles.image} ${dim ? styles.dim : ''}`}
          alt=""
          width={`${thumbWidth}px`}
          height={`${(thumbWidth * aspectRatioInv)}px`}
          style={{
            filter: `${controlersAreVisible ? 'brightness(80%)' : ''}`,
            opacity: hidden ? '0.2' : '1',
            borderRadius: `${(selected && !showMoviePrintView) ? 0 : borderRadius}px`,
          }}
        />
        {thumbInfoValue !== undefined &&
          <div
            className={styles.frameNumber}
            style={{
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
          {showMoviePrintView &&
            <DragHandle
              width={thumbWidth - 1} // shrink it to prevent rounding issues
              height={(thumbWidth * aspectRatioInv) - 1}
            />
          }
          <Popup
            trigger={
              <button
                style={{
                  display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                  transformOrigin: 'center top',
                  transform: `translate(-50%, 10%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                }}
                className={`${styles.hoverButton} ${styles.textButton}`}
                onClick={onToggleWithStop}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                {hidden ? 'SHOW' : 'HIDE'}
              </button>
            }
            className={stylesPop.popup}
            content="Hide thumb"
          />
          <Popup
            trigger={
              <button
                style={{
                  display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                  transformOrigin: 'top right',
                  transform: `translateY(10%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  marginRight: '8px',
                }}
                className={`${styles.hoverButton} ${styles.textButton}`}
                onClick={onSaveThumbWithStop}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                SAVE
              </button>
            }
            className={stylesPop.popup}
            content="Save thumb"
          />
          {!hidden &&
            <div>
              <Popup
                trigger={
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
                    onMouseOver={onHoverInPointWithStop}
                    onMouseLeave={onLeaveInOutWithStop}
                    onFocus={over}
                    onBlur={out}
                  >
                    IN
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Set this thumb as new <mark>IN-point</mark></span>}
              />
              <Popup
                trigger={
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
                    {keyObject.altKey ? '<<<' : (keyObject.shiftKey ? '<' : '<<')}
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Move 10 frames back | with <mark>SHIFT</mark> move 1 frame | with <mark>ALT</mark> move 100 frames</span>}
              />
              <Popup
                trigger={
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
                }
                className={stylesPop.popup}
                content={showMoviePrintView ? 'Edit thumb' : 'Back to MoviePrint view'}
              />
              <Popup
                trigger={
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
                    {keyObject.altKey ? '>>>' : (keyObject.shiftKey ? '>' : '>>')}
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Move 10 frames forward | with <mark>SHIFT</mark> move 1 frame | with <mark>ALT</mark> move 100 frames</span>}
              />
              <Popup
                trigger={
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
                    onMouseOver={onHoverOutPointWithStop}
                    onMouseLeave={onLeaveInOutWithStop}
                    onFocus={over}
                    onBlur={out}
                  >
                    OUT
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Set this thumb as new <mark>OUT-point</mark></span>}
              />
            </div>
        }
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
  controlersAreVisible: false,
  dim: undefined,
  hidden: false,
  index: undefined,
  keyObject: {},
  onBack: null,
  onForward: null,
  onHoverInPoint: null,
  onHoverOutPoint: null,
  onInPoint: null,
  onLeaveInOut: null,
  onOut: null,
  onOutPoint: null,
  onOver: null,
  onSaveThumb: null,
  onSelect: null,
  onToggle: null,
  selected: false,
  thumbImageObjectUrl: undefined,
  thumbInfoValue: undefined,
};

Thumb.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  controlersAreVisible: PropTypes.bool,
  dim: PropTypes.object,
  hidden: PropTypes.bool,
  inputRefThumb: PropTypes.object,
  keyObject: PropTypes.object,
  margin: PropTypes.number.isRequired,
  onBack: PropTypes.func,
  onForward: PropTypes.func,
  onHoverInPoint: PropTypes.func,
  onHoverOutPoint: PropTypes.func,
  onInPoint: PropTypes.func,
  onLeaveInOut: PropTypes.func,
  onOut: PropTypes.func,
  onOutPoint: PropTypes.func,
  onOver: PropTypes.func,
  onSaveThumb: PropTypes.func,
  onSelect: PropTypes.func,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onToggle: PropTypes.func,
  selected: PropTypes.bool,
  showMoviePrintView: PropTypes.bool.isRequired,
  index: PropTypes.number,
  thumbImageObjectUrl: PropTypes.string,
  thumbInfoRatio: PropTypes.number.isRequired,
  thumbInfoValue: PropTypes.string,
  thumbWidth: PropTypes.number.isRequired,
};

export default Thumb;
