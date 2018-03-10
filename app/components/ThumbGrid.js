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
  controlersAreVisible,
  onToggleClick, onRemoveClick, onInPointClick, onOutPointClick,
  onBackClick, onForwardClick, onScrubClick,
  onMouseOverResult, onMouseOutResult, settings, editGrid,
  columnCount, thumbCount, reCapture, containerHeight, containerWidth,
  zoomOut
}) => {
  const width = (typeof file !== 'undefined' && typeof file.width !== 'undefined' ? file.width : 1920);
  const height = (typeof file !== 'undefined' && typeof file.height !== 'undefined' ? file.height : 1080);
  const aspectRatioInv = (height * 1.0) / width;
  const rowCount = Math.ceil(thumbCount / columnCount);
  const headerHeight = settings.defaultHeaderHeight;
  const thumbWidth = settings.defaultThumbnailWidth;
  const thumbMargin = settings.defaultMargin;
  const borderRadius = settings.defaultBorderRadius;
  const generalScale = 0.95;
  const marginWidth = 14;
  const marginHeight = 14;

  const thumbnailWidthPlusMargin = thumbWidth + (thumbMargin * 2);
  const thumbnailHeightPlusMargin = thumbnailWidthPlusMargin * aspectRatioInv;

  const moviePrintWidth = columnCount * thumbnailWidthPlusMargin;
  const moviePrintHeightBody = rowCount * thumbnailHeightPlusMargin;
  const moviePrintHeight = headerHeight + (thumbMargin * 2) + moviePrintHeightBody;

  const scaleValueWidth = containerWidth / moviePrintWidth;
  const scaleValueHeight = containerHeight / moviePrintHeight;

  const scaleValue = Math.min(1, Math.min(scaleValueWidth, scaleValueHeight) * generalScale);

  // const scaleValueHeight = (((containerHeight * 1.0 * generalScale) -
  //   (marginHeight * 4) - headerHeight) / rowCount) /
  //   ((thumbWidth * aspectRatioInv) + (thumbMargin * 2));
  // const scaleValueWidth = (
  //   ((containerWidth * 1.0 * generalScale) - (marginWidth * 4)) / columnCount) /
  //   (thumbWidth + (thumbMargin * 2));
  // const scaleValue = Math.min(scaleValueHeight, scaleValueWidth);

  const newThumbMargin = thumbMargin * scaleValue;
  const newThumbWidth = thumbWidth * scaleValue;
  const newBorderRadius = borderRadius * scaleValue;

  // console.log(`columnCount: ${columnCount}`);
  // console.log(`rowCount: ${rowCount}`);
  // console.log(`aspectRatioInv: ${aspectRatioInv}`);
  // console.log(`containerWidth: ${containerWidth}`);
  // console.log(`containerHeight: ${containerHeight}`);
  // console.log(`moviePrintWidth: ${moviePrintWidth}`);
  // console.log(`moviePrintHeightBody: ${moviePrintHeightBody}`);
  // console.log(`moviePrintHeight: ${moviePrintHeight}`);
  // console.log(`scaleValueWidth: ${scaleValueWidth}`);
  // console.log(`scaleValueHeight: ${scaleValueHeight}`);
  // console.log(`scaleValue: ${scaleValue}`);
  // console.log(`width: ${zoomOut ? containerWidth : moviePrintWidth}`);

  let thumbGridHeaderComponent = null;
  let thumbGridComponent = null;

  thumbGridHeaderComponent = (
    <ThumbGridHeader
      zoomOut={zoomOut}
      fileName={file.name || ''}
      filePath={file.path || ''}
      headerHeight={settings.defaultHeaderHeight}
      thumbMargin={thumbMargin}
      scaleValue={zoomOut ? scaleValue : 1}
    />
  );

  let thumbArray;

  if (editGrid || thumbs.length === 0) {
    const tempArrayLength = thumbCount;
    thumbArray = Array(tempArrayLength);

    for (let i = 0; i < tempArrayLength; i += 1) {
      const mappedIterator = mapRange(
        i,
        0, tempArrayLength - 1,
        0, (thumbs !== undefined ? thumbs.length : tempArrayLength) - 1
      );
      let tempThumbObject = {
        id: String(mappedIterator),
      };
      // console.log(thumbs);
      if (thumbs.length === 0) {
        tempThumbObject = {
          key: String(i),
          index: i,
        };
      } else {
        tempThumbObject.key = i;
        tempThumbObject.index = i;
        // console.log(thumbs[mappedIterator]);
        // console.log(thumbImages);
        if ((typeof thumbImages !== 'undefined') && thumbImages[thumbs[mappedIterator].frameId]) {
          tempThumbObject.thumbImageObjectUrl = thumbImages[thumbs[mappedIterator].frameId].objectUrl;
        }
      }
      // console.log(`${i} : ${mappedIterator}`);
      thumbArray[i] = tempThumbObject;
    }
  } else {
    thumbArray = thumbs;
  }
  // console.log(width);
  thumbGridComponent = (
    thumbArray.map(thumb => (
      <SortableThumb
        zoomOut={zoomOut}
        key={thumb.key}
        index={thumb.index}
        tempId={thumb.index}
        thumbImageObjectUrl={thumb.thumbImageObjectUrl ||
          (thumbImages !== undefined ?
            thumbImages[thumb.frameId] !== undefined ?
              thumbImages[thumb.frameId].objectUrl : undefined : undefined)}
        aspectRatioInv={aspectRatioInv}
        thumbWidth={zoomOut ? newThumbWidth : thumbWidth}
        borderRadius={zoomOut ? newBorderRadius : borderRadius}
        margin={zoomOut ? newThumbMargin : thumbMargin}
        frameNumber={editGrid ? undefined : thumb.frameNumber}
        hidden={editGrid ? undefined : thumb.hidden}
        controlersAreVisible={editGrid ? undefined : (thumb.thumbId === controlersAreVisible)}
        disabled={editGrid}
        onToggle={editGrid ? null : () => onToggleClick(file.id, thumb.thumbId)}
        onRemove={editGrid ? null : () => onRemoveClick(file.id, thumb.thumbId)}
        onInPoint={editGrid ? null : () => onInPointClick(file, thumbArray, thumb.thumbId, thumb.frameNumber)}
        onOutPoint={editGrid ? null : () => onOutPointClick(file, thumbArray, thumb.thumbId, thumb.frameNumber)}
        onBack={editGrid ? null : () => onBackClick(file, thumb.thumbId, thumb.frameNumber)}
        onForward={editGrid ? null : () => onForwardClick(file, thumb.thumbId, thumb.frameNumber)}
        onScrub={editGrid ? null : () => onScrubClick(file, thumb.thumbId, thumb.frameNumber)}
        onOver={editGrid ? null : () => onMouseOverResult(thumb.thumbId)}
        onOut={editGrid ? null : () => onMouseOutResult()}
      />))
  );

  return (
    <div
      className={styles.grid}
      style={{
        width: zoomOut ? (moviePrintWidth * scaleValue) : moviePrintWidth,
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
    thumbId: PropTypes.string.isRequired,
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
