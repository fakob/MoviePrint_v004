/* eslint no-param-reassign: ["error"] */
/* eslint no-nested-ternary: "off" */

// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import { SHEET_TYPE, VIEW } from '../utils/constants';
import styles from './ThumbGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

const DragHandle = React.memo(
  SortableHandle(({ width, height, thumbId }) => (
    <Popup
      trigger={
        <button
          type="button"
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
      mouseEnterDelay={2000}
      on={['hover']}
      pinned
      offset="-50%r, -50%r"
      position="top right"
      basic
      className={stylesPop.popupSmall}
      content="Drag thumb"
    />
  )),
);

const AllFaces = ({ facesArray, thumbWidth, thumbHeight, uniqueFilter, expandedFaceNumber }) =>
  facesArray.map(face => {
    const showFaceRect =
      expandedFaceNumber === face.faceNumber ||
      (expandedFaceNumber === undefined && (!uniqueFilter || face.distToOrigin === 0));
    if (showFaceRect) {
      return <FaceRect key={face.faceId} face={face} thumbWidth={thumbWidth} thumbHeight={thumbHeight} />;
    }
    return undefined;
  });

const FaceRect = React.memo(({ face: { box, ...faceExceptForBox }, thumbWidth, thumbHeight }) => {
  const left = box.x * thumbWidth;
  const top = box.y * thumbHeight;
  const width = box.width * thumbWidth;
  const height = box.height * thumbHeight;
  const cornerLength = Math.min(thumbWidth, thumbHeight) / 32;

  const leftCornerLength = Math.max(1, left - cornerLength);
  const topCornerLength = Math.max(1, top - cornerLength);
  const leftWidth = Math.min(thumbWidth - 1, left + width);
  const topHeight = Math.min(thumbHeight - 1, top + height);
  const topHeightCornerLength = Math.min(thumbHeight - 1, topHeight + cornerLength);
  const leftWidthCornerLength = Math.min(thumbWidth - 1, leftWidth + cornerLength);

  const polylineLine0 = `${leftCornerLength}, ${top}, ${left}, ${top}, ${left}, ${topCornerLength}`;
  const polylineLine1 = `${leftWidth}, ${topCornerLength}, ${leftWidth}, ${top}, ${leftWidthCornerLength}, ${top}`;
  const polylineLine2 = `${leftCornerLength}, ${topHeight}, ${left}, ${topHeight}, ${left}, ${topHeightCornerLength}`;
  const polylineLine3 = `${leftWidth}, ${topHeightCornerLength}, ${leftWidth}, ${topHeight}, ${leftWidthCornerLength}, ${topHeight}`;
  return (
    <>
      <div
        className={styles.faceRect}
        title={JSON.stringify(faceExceptForBox)}
        style={{
          width: `${box.width * thumbWidth}px`,
          height: `${box.height * thumbHeight}px`,
          left: `${box.x * thumbWidth}px`,
          top: `${box.y * thumbHeight}px`,
        }}
      />
      <div
        className={styles.faceRectSVG}
        title={JSON.stringify(faceExceptForBox)}
        // style={{
        //   width: `${box.width * thumbWidth}px`,
        //   height: `${box.height * thumbHeight}px`,
        //   left: `${box.x * thumbWidth}px`,
        //   top: `${box.y * thumbHeight}px`,
        // }}
      >
        <svg width={thumbWidth} height={thumbHeight}>
          <polyline points={polylineLine0} />
          <polyline points={polylineLine1} />
          <polyline points={polylineLine2} />
          <polyline points={polylineLine3} />
        </svg>
      </div>
      <div
        className={styles.faceRectTag}
        style={{
          left: `${box.x * thumbWidth + box.width * thumbWidth}px`,
          top: `${box.y * thumbHeight}px`,
        }}
      >
        {faceExceptForBox.gender === 'female' ? '\u2640' : '\u2642'}
        <br />#<em>{faceExceptForBox.faceNumber}</em>
        <br />
        {faceExceptForBox.occurrence} x<br />
        {faceExceptForBox.distToOrigin}
        <br />
      </div>
    </>
  );
});

const Thumb = React.memo(
  ({
    aspectRatioInv,
    base64,
    facesArray,
    borderRadius,
    color,
    controllersAreVisible,
    defaultShowFaceRect,
    dim,
    expandedFaceNumber,
    frameninfoBackgroundColor,
    frameinfoColor,
    frameinfoPosition,
    hidden,
    index,
    indexForId,
    inputRefThumb,
    keyObject,
    margin,
    frameinfoMargin,
    onOver,
    onSelect,
    onThumbDoubleClick,
    selected,
    sheetType,
    thumbCSSTranslate,
    thumbId,
    thumbImageObjectUrl,
    thumbInfoValue,
    thumbWidth,
    transparentThumb,
    uniqueFilter,
    view,
  }) => {
    function onThumbDoubleClickWithStop(e) {
      e.stopPropagation();
      if (controllersAreVisible) {
        if (view === VIEW.PLAYERVIEW) {
          onSelect();
        } else {
          onThumbDoubleClick();
        }
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
      //   onOut(e);
      // }
    }

    const thumbHeight = thumbWidth * aspectRatioInv;

    return (
      <div
        ref={inputRefThumb}
        role="button"
        tabIndex={index}
        onMouseEnter={onOverWithStop}
        onMouseLeave={onOutWithStop}
        onFocus={onOverWithStop}
        onBlur={onOutWithStop}
        onClick={onSelectWithStop}
        onKeyPress={onSelectWithStop}
        onDoubleClick={onThumbDoubleClickWithStop}
        id={`thumb${indexForId}`}
        className={`${styles.gridItem} ${
          view === VIEW.PLAYERVIEW && selected && !(keyObject.altKey || keyObject.shiftKey)
            ? styles.gridItemSelected
            : ''
        }`}
        width={`${thumbWidth}px`}
        height={`${thumbHeight}px`}
        style={{
          // width: thumbWidth,
          margin,
          outlineWidth: margin,
          borderRadius: `${selected && view === VIEW.PLAYERVIEW ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
          backgroundColor:
            transparentThumb || thumbImageObjectUrl === undefined || thumbImageObjectUrl === 'blob:file:///fakeURL'
              ? color
              : undefined,
        }}
      >
        <img
          data-tid={`thumbImg_${thumbId}`}
          src={
            transparentThumb
              ? transparent
              : thumbImageObjectUrl !== undefined
              ? thumbImageObjectUrl
              : base64 !== undefined
              ? `data:image/jpeg;base64, ${base64}`
              : transparent
          }
          id={`thumbImage${indexForId}`}
          className={`${styles.image} ${dim ? styles.dim : ''}`}
          alt=""
          width={`${thumbWidth}px`}
          height={`${thumbHeight}px`}
          style={{
            filter: `${controllersAreVisible ? 'brightness(80%)' : ''}`,
            opacity: hidden ? '0.2' : facesArray !== undefined && defaultShowFaceRect ? '0.5' : '1.0',
            borderRadius: `${selected && view === VIEW.PLAYERVIEW ? 0 : borderRadius}px`,
          }}
        />
        {facesArray !== undefined && defaultShowFaceRect && (
          <AllFaces
            facesArray={facesArray}
            thumbWidth={thumbWidth}
            thumbHeight={thumbHeight}
            uniqueFilter={uniqueFilter}
            expandedFaceNumber={expandedFaceNumber}
          />
        )}
        {thumbInfoValue !== undefined && (
          <div
            data-tid={`thumbInfoText_${thumbId}`}
            className={`${styles.frameinfo} ${styles[frameinfoPosition]}`}
            style={{
              margin: frameinfoMargin,
              transform: thumbCSSTranslate,
              backgroundColor: frameninfoBackgroundColor,
              color: frameinfoColor,
            }}
          >
            {thumbInfoValue}
          </div>
        )}
        <div
          style={{
            display: controllersAreVisible ? 'block' : 'none',
          }}
        >
          {sheetType !== SHEET_TYPE.SCENES && (
            <DragHandle
              width={thumbWidth - 1} // shrink it to prevent rounding issues
              height={thumbHeight - 1}
              thumbId={thumbId}
            />
          )}
        </div>
      </div>
    );
  },
);

Thumb.defaultProps = {
  controllersAreVisible: false,
  dim: undefined,
  hidden: false,
  index: undefined,
  indexForId: undefined,
  keyObject: {},
  onOver: null,
  onSelect: null,
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
  margin: PropTypes.string.isRequired,
  onOver: PropTypes.func,
  onSelect: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  selected: PropTypes.bool,
  sheetType: PropTypes.string.isRequired,
  index: PropTypes.number,
  indexForId: PropTypes.number,
  thumbImageObjectUrl: PropTypes.string,
  thumbInfoValue: PropTypes.string,
  thumbWidth: PropTypes.number.isRequired,
};

export default Thumb;
