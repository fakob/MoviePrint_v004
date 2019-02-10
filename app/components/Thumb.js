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
  controllersAreVisible,
  dim,
  hidden,
  thumbId,
  index,
  indexForId,
  inputRefThumb,
  keyObject,
  margin,
  onOver,
  onSelect,
  onErrorThumb,
  onThumbDoubleClick,
  selected,
  defaultView,
  transparentThumb,
  thumbImageObjectUrl,
  base64,
  thumbInfoRatio,
  thumbInfoValue,
  thumbWidth,
}) => {

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

  function onOverWithStop(e) {
    // e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    if (onOver) {
      onOver(e);
    }
  }

  function onOutWithStop(e) {
    e.stopPropagation();
    // check if function is not null (passed from thumbgrid)
    // if (onOut) {
    //   onOut();
    // }
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
          src={transparentThumb ? transparent : thumbImageObjectUrl === undefined ? `data:image/jpeg;base64, ${base64}` : thumbImageObjectUrl}
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
        </div>
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
