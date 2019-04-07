// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import styles from './ThumbGrid.css';
import {
  SHEET_VIEW
} from '../utils/constants';
import transparent from './../img/Thumb_TRANSPARENT.png';

const ThumbEmpty = ({
  onSelect, onToggle, onInPoint, onOutPoint, onBack, onForward, tempId, color, scaleValue,
  onOver, onOut, onScrub, hidden, thumbImageObjectUrl, aspectRatioInv, thumbInfoRatio,
  controlersAreVisible, thumbWidth, margin, defaultSheetView, borderRadius, thumbInfoValue, selected,
  inputRefThumb, onThumbDoubleClick
}) => {

  return (
    <div
      onDoubleClick={onThumbDoubleClick}
      className={`${styles.gridItem} ${(selected && defaultSheetView !== SHEET_VIEW.GRIDVIEW) ? styles.gridItemSelected : ''}`}
      width={`${thumbWidth}px`}
      height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        opacity: hidden ? '0.2' : '1',
        width: thumbWidth,
        margin: `${margin}px`,
        outlineWidth: `${(selected && defaultSheetView !== SHEET_VIEW.GRIDVIEW) ? margin : 0}px`,
        borderRadius: `${(selected && defaultSheetView !== SHEET_VIEW.GRIDVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
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
          borderRadius: `${(selected && defaultSheetView !== SHEET_VIEW.GRIDVIEW) ? 0 : borderRadius}px`,
        }}
      />
    </div>
  );
};

ThumbEmpty.defaultProps = {
  // thumbImageObjectUrl: empty,
};

ThumbEmpty.propTypes = {
  // defaultSheetView: PropTypes.string,
  // aspectRatioInv: PropTypes.number,
  // thumbWidth: PropTypes.number,
  // margin: PropTypes.number,
  // borderRadius: PropTypes.number,
  // hidden: PropTypes.bool,
  // controlersAreVisible: PropTypes.bool,
  // frameNumber: PropTypes.number,
  // thumbImageObjectUrl: PropTypes.string,
  // onToggle: PropTypes.func,
  // onInPoint: PropTypes.func,
  // onOutPoint: PropTypes.func,
  // onBack: PropTypes.func,
  // onForward: PropTypes.func,
  // onScrub: PropTypes.func,
  // onOver: PropTypes.func,
  // onOut: PropTypes.func,
};

export default ThumbEmpty;
