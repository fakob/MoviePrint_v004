/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import {
  MINIMUM_WIDTH_TO_SHRINK_HOVER,
  MINIMUM_WIDTH_TO_SHOW_HOVER,
  VIEW,
} from '../utils/constants';
import styles from './SceneGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height, sceneId }) =>
  (
    <Popup
      trigger={
        <button
          data-tid={`thumbDragHandleBtn_${sceneId}`}
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
      }
      className={stylesPop.popup}
      content="Drag thumb"
    />
  ));

const Scene = ({
  indexForId,
  key,
  sceneId,
  margin,
  thumbHeight,
  hexColor,
  thumbImageObjectUrl,
  aspectRatioInv,
  borderRadius,
  color,
  showAddThumbBeforeController,
  showAddThumbAfterController,
  controllersAreVisible,
  dim,
  hidden,
  thumbId,
  index,
  inputRefThumb,
  keyObject,
  onBack,
  onForward,
  onHoverAddThumbBefore,
  onHoverAddThumbAfter,
  onHoverInPoint,
  onHoverOutPoint,
  onScrub,
  onAddBefore,
  onAddAfter,
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
  defaultView,
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

  function onHoverAddThumbBeforeWithStop(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
    onHoverAddThumbBefore();
  }

  function onHoverAddThumbAfterWithStop(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
    onHoverAddThumbAfter();
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


  function onScrubWithStop(e) {
    e.stopPropagation();
    onScrub();
  }

  function onAddBeforeWithStop(e) {
    e.stopPropagation();
    onAddBefore();
  }

  function onAddAfterWithStop(e) {
    e.stopPropagation();
    onAddAfter();
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
    if (controllersAreVisible) {
      if (defaultView === VIEW.SCENEVIEW) {
        onSelect();
      }
      onThumbDoubleClick();
    }
  }

  function onSelectWithStop(e) {
    e.stopPropagation();
    if (controllersAreVisible) {
      onSelect();
    }
  }

  function onOverWithStop(e) {
    e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    if (onOver) {
      onOver();
    }
  }

  function onOutWithStop(e) {
    e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    if (onOut) {
      onOut();
    }
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
      id={`scene${indexForId}`}
      className={`${styles.gridItem}`}
      // width={`${thumbWidth}px`}
      // height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        filter: `${controllersAreVisible ? 'brightness(80%)' : ''}`,
        opacity: hidden ? '0.2' : '1',
        width:`${thumbWidth}px`,
        height:`${thumbHeight}px`,
        // width: width,
        margin: `${margin}px`,
        outlineWidth: `${defaultView === VIEW.SCENEVIEW ? margin : Math.max(1, margin)}px`,
        borderRadius: `${(selected && defaultView !== VIEW.SCENEVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: hexColor,
        backgroundImage: `url(${thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent})`,
      }}
    >
      <div>
        {thumbInfoValue !== undefined &&
          <div
            data-tid={`thumbInfoText_${sceneId}`}
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
            display: controllersAreVisible ? 'block' : 'none'
          }}
        >
          {defaultView === VIEW.SCENEVIEW &&
            <DragHandle
              width={thumbWidth - 1} // shrink it to prevent rounding issues
              height={(thumbWidth * aspectRatioInv) - 1}
              sceneId={sceneId}
            />
          }
          <Popup
            trigger={
              <button
                data-tid={`${hidden ? 'show' : 'hide'}ThumbBtn_${sceneId}`}
                type='button'
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
          {!hidden &&
            <div>
              {/* <Popup
                trigger={
                  <button
                    data-tid={`setInPointBtn_${sceneId}`}
                    type='button'
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
              /> */}
              <Popup
                trigger={
                  <button
                    data-tid={`scrubBtn_${sceneId}`}
                    type='button'
                    style={{
                      display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                      transformOrigin: 'center bottom',
                      transform: `translateX(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                    }}
                    className={`${styles.hoverButton} ${styles.textButton}`}
                    // onClick={onScrubWithStop}
                    onMouseDown={onScrubWithStop}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'<'}|{'>'}
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Click and drag left and right to change the frame (<mark>SHIFT</mark> add new thumb before, <mark>ALT</mark> add new thumb after, <mark>CTRL</mark> display original as overlay)</span>}
              />
              {/* <Popup
                trigger={
                  <button
                    data-tid={`setOutPointBtn_${sceneId}`}
                    type='button'
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
              /> */}
            </div>
        }
        </div>
      </div>
    </div>
  );
};

Scene.defaultProps = {
};

Scene.propTypes = {
};

export default Scene;
