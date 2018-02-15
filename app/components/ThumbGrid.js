// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import empty from './../img/Thumb_EMPTY.png';
import { mapRange } from './../utils/utils';

const SortableThumb = SortableElement(Thumb);

const ThumbGrid = ({
  thumbs,
  thumbImages,
  file,
  columnWidth,
  controlersAreVisible,
  onToggleClick, onRemoveClick, onInPointClick, onOutPointClick,
  onBackClick, onForwardClick, onScrubClick,
  onMouseOverResult, onMouseOutResult, settings, editGrid, showPlaceholder,
  columnCount, rowCount, width, height, contentHeight, contentWidth
}) => {
  const thumbsAmount = columnCount * rowCount;
  const headerHeight = settings.defaultHeaderHeight;
  const thumbWidth = settings.defaultThumbnailWidth;
  const thumbMargin = settings.defaultMargin;
  const generalScale = 0.9;
  const marginWidth = 14;
  const marginHeight = 14;
  const scaleValueHeight = (((contentHeight * 1.0 * generalScale) -
    (marginHeight * 4) - headerHeight) / rowCount) /
    ((thumbWidth * (height / width)) + thumbMargin);
  const scaleValueWidth = (((contentWidth * 0.75 * generalScale) -
    (marginWidth * 4) - headerHeight) / columnCount) /
    (thumbWidth + thumbMargin); // 12 of 16 columns
  const scaleValue = Math.min(scaleValueHeight, scaleValueWidth);
  // const newThumbMargin = (thumbMargin / 2) * scaleValue;
  // const newthumbWidth = (thumbWidth * scaleValue) - (newThumbMargin * 2);
  // const newThumbHeight = (thumbWidth * (height / width) * scaleValue) - (newThumbMargin * 2);
  const newThumbMargin = Math.floor((thumbMargin / 2) * scaleValue);
  const newthumbWidth = Math.floor((thumbWidth * scaleValue) - (newThumbMargin * 2));
  const newThumbHeight = Math.floor((thumbWidth * (height / width) * scaleValue) - (newThumbMargin * 2));
  // console.log(contentHeight);
  // console.log(contentWidth);
  // console.log(rowCount);
  // console.log(height);
  // console.log(columnWidth);
  // console.log(columnCount);
  // console.log(width);
  // console.log(scaleValue);

  let thumbGridHeaderComponent = null;
  let thumbGridComponent = null;

  thumbGridHeaderComponent = (
    <ThumbGridHeader
      fileName={file.name || ''}
      filePath={file.path || ''}
      headerHeight={settings.defaultHeaderHeight}
    />
  );

  let thumbArray;
  let inputProps;
  let thumbImageObjectUrl;

  if (editGrid) {
    const thumbImageArrayLength = thumbs !== undefined ? thumbs.length : undefined;
    // const tempArrayLength = Math.max(thumbImageArrayLength, thumbsAmount);

    const tempArrayLength = thumbsAmount;
    thumbArray = Array(tempArrayLength);
    // thumbArray = Array.apply(null, Array(tempArrayLength)).map((val, i) => {
    //   // const thumbImageArrayLength = thumbs !== undefined ? thumbs.length : undefined;
    //   if (thumbImageArrayLength && thumbImages) {
    //     const mappedIterator = mapRange(i, 0, thumbsAmount - 1, 0, thumbImageArrayLength - 1);
    //     if (thumbImages[thumbs[mappedIterator].id]) {
    //       thumbImageObjectUrl = thumbImages[thumbs[mappedIterator].id].objectUrl;
    //     }
    //   }
    // });
    for (let i = 0; i < tempArrayLength; i++) {
      const mappedIterator = mapRange(
        i,
        0, tempArrayLength - 1,
        0, (thumbs !== undefined ? thumbs.length : tempArrayLength) - 1
      );
      // console.log(`${i} : ${thumbs.length} : ${thumbsAmount} : ${tempArrayLength} : ${i}`);
      let tempThumbObject = {
        id: String(mappedIterator),
      };
      if (thumbs[i] === undefined) {
        tempThumbObject = {
          // key: String(i),
          index: i,
          // frameNumber: 0,
        };
      } else {
        // tempThumbObject = thumbs[mappedIterator];
        // tempThumbObject.id = thumbs[mappedIterator].id;
        // tempThumbObject.key = thumbs[i].id;
        tempThumbObject.key = i;
        tempThumbObject.index = i;
        if (thumbImages[thumbs[mappedIterator].id]) {
          tempThumbObject.thumbImageObjectUrl = thumbImages[thumbs[mappedIterator].id].objectUrl;
        }
      }
      // tempArray[i] = thumbs[i];
      // console.log(`${thumbImages} : ${thumbImages[tempThumbObject.id]} : ${thumbImages[tempThumbObject.id].objectUrl} : ${i}`);
      // console.log(`${thumbImages} : ${thumbImages[tempThumbObject.id]} : ${i} : ${mappedIterator}`);
      // console.log(thumbImages[tempThumbObject.id]);
      thumbArray[i] = tempThumbObject;
    }
  } else {
    thumbArray = thumbs;
    console.log(thumbArray);
  }
  console.log(thumbArray);
  thumbGridComponent = (
    thumbArray.map(thumb => (
      <SortableThumb
        key={thumb.key}
        indexValue={thumb.index}
        thumbImageObjectUrl={thumb.thumbImageObjectUrl || (thumbImages !== undefined ? thumbImages[thumb.id] !== undefined ? thumbImages[thumb.id].objectUrl : undefined : undefined)}
        width={file.width || 1920}
        height={file.height || 1080}
        thumbWidth={thumbWidth}
        frameNumber={editGrid ? undefined : thumb.frameNumber}
        controlersAreVisible={editGrid ? undefined : (thumb.id === controlersAreVisible)}
        disabled={editGrid}
        onToggle={editGrid ? null : () => onToggleClick(file.id, thumb.id)}
        onRemove={editGrid ? null : () => onRemoveClick(file.id, thumb.id)}
        onInPoint={editGrid ? null : () => onInPointClick(file, thumbArray, thumb.id, thumb.frameNumber)}
        onOutPoint={editGrid ? null : () => onOutPointClick(file, thumbArray, thumb.id, thumb.frameNumber)}
        onBack={editGrid ? null : () => onBackClick(file, thumb.id, thumb.frameNumber)}
        onForward={editGrid ? null : () => onForwardClick(file, thumb.id, thumb.frameNumber)}
        onScrub={editGrid ? null : () => onScrubClick(file, thumb.id, thumb.frameNumber)}
        onOver={editGrid ? null : () => onMouseOverResult(thumb.id)}
        onOut={editGrid ? null : () => onMouseOutResult()}
      />))
  );

  return (
    <div
      className={styles.grid}
      style={{
        // width: editGrid ? columnWidth * scaleValue : columnWidth,
        width: columnWidth,
      }}
      id="ThumbGrid"
    >
      {thumbGridHeaderComponent}
      {thumbGridComponent}
    </div>
  );
};

ThumbGrid.defaultProps = {
  controlersAreVisible: 'false',
  thumbs: [],
  file: {}
};

ThumbGrid.propTypes = {
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
  thumbImages: PropTypes.object,
  // thumbImages: PropTypes.objectOf(PropTypes.objectOf(PropTypes.shape({
  //   objectUrl: PropTypes.string.isRequired
  // }).isRequired).isRequired).isRequired,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  columnWidth: PropTypes.number.isRequired,
  controlersAreVisible: PropTypes.string,
  onToggleClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onForwardClick: PropTypes.func.isRequired,
  onScrubClick: PropTypes.func.isRequired,
  onMouseOverResult: PropTypes.func.isRequired,
  onMouseOutResult: PropTypes.func.isRequired,
};

const SortableThumbGrid = SortableContainer(ThumbGrid);

// export default ThumbGrid;
export default SortableThumbGrid;
