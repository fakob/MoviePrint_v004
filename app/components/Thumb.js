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
import styles from './ThumbGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

const DragHandle = SortableHandle(({ width, height, thumbId }) =>
  (
    <Popup
      trigger={
        <button
          data-tid={`thumbDragHandleBtn_${thumbId}`}
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

const Thumb = ({
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
  indexForId,
  inputRefThumb,
  isScene,
  keyObject,
  margin,
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
  onExit,
  onErrorThumb,
  onThumbDoubleClick,
  onToggle,
  selected,
  defaultView,
  transparentThumb,
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
      if (defaultView === VIEW.GRIDVIEW) {
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

  function onExitWithStop(e) {
    e.stopPropagation();
    if (controllersAreVisible) {
      onExit();
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

  const showBeforeController = showAddThumbBeforeController || keyObject.shiftKey;
  const showAfterController = showAddThumbAfterController || keyObject.altKey;

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
      id={`thumb${indexForId}`}
      className={`${styles.gridItem} ${(defaultView !== VIEW.GRIDVIEW && selected && !(keyObject.altKey || keyObject.shiftKey)) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        width: thumbWidth,
        margin: `${defaultView === VIEW.GRIDVIEW ? margin : Math.max(1, margin)}px`,
        outlineWidth: `${defaultView === VIEW.GRIDVIEW ? margin : Math.max(1, margin)}px`,
        borderRadius: `${(selected && defaultView !== VIEW.GRIDVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: transparentThumb ||
          (thumbImageObjectUrl === undefined)  ||
          (thumbImageObjectUrl === 'blob:file:///fakeURL')? color : undefined,
      }}
    >
      <div>
        <img
          data-tid={`thumbImg_${thumbId}`}
          src={(thumbImageObjectUrl !== undefined) && !transparentThumb ? thumbImageObjectUrl : transparent}
          id={`thumbImage${indexForId}`}
          className={`${styles.image} ${dim ? styles.dim : ''}`}
          alt=""
          width={`${thumbWidth}px`}
          height={`${(thumbWidth * aspectRatioInv)}px`}
          style={{
            filter: `${controllersAreVisible ? 'brightness(80%)' : ''}`,
            opacity: hidden ? '0.2' : '1',
            borderRadius: `${(selected && defaultView !== VIEW.GRIDVIEW) ? 0 : borderRadius}px`,
          }}
          onError={onErrorThumb}
        />
        {thumbInfoValue !== undefined &&
          <div
            data-tid={`thumbInfoText_${thumbId}`}
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
          {defaultView === VIEW.GRIDVIEW &&
            <DragHandle
              width={thumbWidth - 1} // shrink it to prevent rounding issues
              height={(thumbWidth * aspectRatioInv) - 1}
              thumbId={thumbId}
            />
          }
          {isScene && <Popup
            trigger={
              <button
                data-tid={`ExitThumbBtn_${thumbId}`}
                type='button'
                style={{
                  display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                  transformOrigin: 'left top',
                  transform: `translateY(10%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  marginLeft: '8px',
                }}
                className={`${styles.hoverButton} ${styles.textButton}`}
                onClick={onExitWithStop}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                EXIT
              </button>
            }
            className={stylesPop.popup}
            content="Enter into scene"
          />}
          <Popup
            trigger={
              <button
                data-tid={`${hidden ? 'show' : 'hide'}ThumbBtn_${thumbId}`}
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
          <Popup
            trigger={
              <button
                data-tid={`saveThumbBtn_${thumbId}`}
                type='button'
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
                    data-tid={`setInPointBtn_${thumbId}`}
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
              />
              <Popup
                trigger={
                  <button
                    data-tid={`addNewThumbBeforeBtn_${thumbId}`}
                    type='button'
                    style={{
                      display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                      transformOrigin: 'left center',
                      transform: `translateY(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      marginLeft: '8px',
                    }}
                    className={`${styles.hoverButton} ${styles.textButton}`}
                    onClick={onAddBeforeWithStop}
                    onMouseOver={onHoverAddThumbBeforeWithStop}
                    onMouseLeave={onOutWithStop}
                    onFocus={over}
                    onBlur={out}
                  >
                    +
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Add new thumb before</span>}
              />
              <Popup
                trigger={
                  <button
                    data-tid={`scrubBtn_${thumbId}`}
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
              <Popup
                trigger={
                  <button
                    data-tid={`addNewThumbAfterBtn_${thumbId}`}
                    type='button'
                    style={{
                      display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
                      transformOrigin: 'right center',
                      transform: `translateY(-50%) scale(${(thumbWidth > MINIMUM_WIDTH_TO_SHRINK_HOVER) ? 1 : 0.7})`,
                      position: 'absolute',
                      top: '50%',
                      right: 0,
                      marginRight: '8px',
                    }}
                    className={`${styles.hoverButton} ${styles.textButton}`}
                    onClick={onAddAfterWithStop}
                    onMouseOver={onHoverAddThumbAfterWithStop}
                    onMouseLeave={onOutWithStop}
                    onFocus={over}
                    onBlur={out}
                  >
                    +
                  </button>
                }
                className={stylesPop.popup}
                content={<span>Add new thumb after</span>}
              />
              <Popup
                trigger={
                  <button
                    data-tid={`setOutPointBtn_${thumbId}`}
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
              />
            </div>
        }
        </div>
        {defaultView !== VIEW.GRIDVIEW && selected && (showBeforeController || showAfterController) &&
          <div
            data-tid={`insertThumb${(!showAfterController && showBeforeController) ? 'Before' : 'After'}Div_${thumbId}`}
            style={{
              content: '',
              backgroundColor: '#FF5006',
              position: 'absolute',
              width: `${Math.max(1, margin * 0.5)}px`,
              height: `${(thumbWidth * aspectRatioInv) + (Math.max(1, margin * 2))}px`,
              top: (Math.max(1, margin * -1.0)),
              left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
              right: `${showAfterController ? 0 : undefined}`,
              display: 'block',
              transform: `translateX(${Math.max(1, margin) * (showAfterController ? 1.25 : -1.25)}px)`,
            }}
          />
        }
        {controllersAreVisible && (showBeforeController || showAfterController) && (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) &&
          <div
            data-tid={`insertThumb${(!showAfterController && showBeforeController) ? 'Before' : 'After'}Div_${thumbId}`}
            style={{
              zIndex: 100,
              content: '',
              backgroundColor: '#FF5006',
              position: 'absolute',
              width: `${Math.max(1, margin * 0.5)}px`,
              height: `${thumbWidth * aspectRatioInv}px`,
              // top: (Math.max(1, margin * -1.0)),
              left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
              right: `${showAfterController ? 0 : undefined}`,
              display: 'block',
              transform: `translateX(${Math.max(1, margin) * (showAfterController ? 1.25 : -1.25)}px)`,
            }}
          />
        }
      </div>
    </div>
  );
};

Thumb.defaultProps = {
  controllersAreVisible: false,
  dim: undefined,
  hidden: false,
  index: undefined,
  indexForId: undefined,
  keyObject: {},
  onBack: null,
  onForward: null,
  onHoverAddThumbBefore: null,
  onHoverAddThumbAfter: null,
  onHoverInPoint: null,
  onHoverOutPoint: null,
  onScrub: null,
  onAddBefore: null,
  onAddAfter: null,
  onInPoint: null,
  onLeaveInOut: null,
  onOut: null,
  onOutPoint: null,
  onOver: null,
  onSaveThumb: null,
  onSelect: null,
  onExit: null,
  onToggle: null,
  selected: false,
  thumbImageObjectUrl: undefined,
  thumbInfoValue: undefined,
};

Thumb.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  borderRadius: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  controllersAreVisible: PropTypes.bool,
  dim: PropTypes.object,
  hidden: PropTypes.bool,
  inputRefThumb: PropTypes.object,
  keyObject: PropTypes.object,
  margin: PropTypes.number.isRequired,
  onBack: PropTypes.func,
  onForward: PropTypes.func,
  onHoverAddThumbBefore: PropTypes.func,
  onHoverAddThumbAfter: PropTypes.func,
  onHoverInPoint: PropTypes.func,
  onHoverOutPoint: PropTypes.func,
  onScrub: PropTypes.func,
  onAddBefore: PropTypes.func,
  onAddAfter: PropTypes.func,
  onInPoint: PropTypes.func,
  onLeaveInOut: PropTypes.func,
  onOut: PropTypes.func,
  onOutPoint: PropTypes.func,
  onOver: PropTypes.func,
  onSaveThumb: PropTypes.func,
  onSelect: PropTypes.func,
  onExit: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggle: PropTypes.func,
  selected: PropTypes.bool,
  defaultView: PropTypes.string.isRequired,
  index: PropTypes.number,
  indexForId: PropTypes.number,
  thumbImageObjectUrl: PropTypes.string,
  thumbInfoRatio: PropTypes.number.isRequired,
  thumbInfoValue: PropTypes.string,
  thumbWidth: PropTypes.number.isRequired,
};

export default Thumb;
