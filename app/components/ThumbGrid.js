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

  if (editGrid === true) {
    thumbGridHeaderComponent = (
      <div
        className={styles.gridHeader}
        style={{
          height: headerHeight * scaleValue,
          backgroundColor: 'black',
          margin: newThumbMargin,
        }}
      />
    );
  } else {
    thumbGridHeaderComponent = (
      <ThumbGridHeader
        file={file}
        headerHeight={settings.defaultHeaderHeight}
      />
    );
  }

  if (editGrid === true) {
    thumbGridComponent = (
      Array.apply(null, Array(thumbsAmount)).map((val, i) => {
        const thumbImageArrayLength = thumbs !== undefined ? thumbs.length : undefined;
        let thumbImageObjectUrl;
        if (thumbImageArrayLength && thumbImages) {
          const mappedIterator = mapRange(i, 0, thumbsAmount - 1, 0, thumbImageArrayLength - 1);
          if (thumbImages[thumbs[mappedIterator].id]) {
            thumbImageObjectUrl = thumbImages[thumbs[mappedIterator].id].objectUrl;
          }
        }

        return (
          <div
            key={i}
            className={styles.gridItem}
            style={{
              // width: newthumbWidth,
              // height: newThumbHeight,
              // backgroundColor: 'black',
              margin: newThumbMargin,
            }}
          >
            <img
              src={thumbImageObjectUrl || empty}
              style={{
                float: 'left',
                borderRadius: 8 * scaleValue,
                margin: newThumbMargin,
              }}
              alt=""
              width={newthumbWidth}
              height={newThumbHeight}
            />
          </div>
        );
      })
    );
  } else {
    thumbGridComponent = (
      thumbs.map(thumb => (
        <SortableThumb
          key={thumb.id}
          indexValue={thumb.index}
          thumbImageObjectUrl={thumbImages !== undefined ? thumbImages[thumb.id] !== undefined ? thumbImages[thumb.id].objectUrl : undefined : undefined}
          width={file.width || 1920}
          height={file.height || 1080}
          thumbWidth={thumbWidth}
          controlersAreVisible={(thumb.id === controlersAreVisible)}
          {...thumb}
          onToggle={() => onToggleClick(file.id, thumb.id)}
          onRemove={() => onRemoveClick(file.id, thumb.id)}
          onInPoint={() => onInPointClick(file, thumbs, thumb.id, thumb.frameNumber)}
          onOutPoint={() => onOutPointClick(file, thumbs, thumb.id, thumb.frameNumber)}
          onBack={() => onBackClick(file, thumb.id, thumb.frameNumber)}
          onForward={() => onForwardClick(file, thumb.id, thumb.frameNumber)}
          onScrub={() => onScrubClick(file, thumb.id, thumb.frameNumber)}
          onOver={() => onMouseOverResult(thumb.id)}
          onOut={() => onMouseOutResult()}
        />))
    );
  }

  return (
    <div
      className={styles.grid}
      style={{
        width: editGrid ? columnWidth * scaleValue : columnWidth,
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
