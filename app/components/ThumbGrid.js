// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import { mapRange, getObjectProperty, getThumbInfoValue } from './../utils/utils';

const SortableThumb = SortableElement(Thumb);

const ThumbGrid = ({
  colorArray,
  controlersAreVisibleId,
  showSettings,
  file,
  inputRefThumb,
  onInPointClick,
  onBackClick,
  onForwardClick,
  onMouseOutResult,
  onMouseOverResult,
  onOutPointClick,
  onSaveThumbClick,
  onRemoveClick,
  onSelectClick,
  onThumbDoubleClick,
  onToggleClick,
  scaleValueObject,
  selectedThumbId,
  settings,
  thumbCount,
  thumbImages,
  thumbs,
  thumbsToDim,
  showMoviePrintView,
  keyObject,
  onHoverInPointResult,
  onHoverOutPointResult,
  onLeaveInOutResult
}) => {
  const fps = (file !== undefined && file.fps !== undefined ? file.fps : 25);
  let thumbGridHeaderComponent = null;
  let thumbGridComponent = null;

  thumbGridHeaderComponent = (
    <ThumbGridHeader
      showMoviePrintView={showMoviePrintView}
      fileName={file.name || ''}
      filePath={file.path || ''}
      headerHeight={scaleValueObject.newHeaderHeight}
      thumbMargin={scaleValueObject.newThumbMargin}
      scaleValue={scaleValueObject.newScaleValue}
    />
  );

  let thumbArray;

  if (showSettings || thumbs.length === 0) {
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
      if (thumbs.length === 0) {
        tempThumbObject = {
          key: String(i),
          index: i,
        };
      } else if (thumbs.length === tempArrayLength) {
        tempThumbObject = thumbs[i];
      } else {
        if ((thumbImages !== undefined) &&
          (i === 0 || i === (tempArrayLength - 1))
        ) {
          tempThumbObject = thumbs[mappedIterator];
        }
        tempThumbObject.key = i;
        tempThumbObject.index = i;
      }
      thumbArray[i] = tempThumbObject;
    }
  } else {
    thumbArray = thumbs;
  }
  thumbGridComponent = (
    thumbArray.map(thumb => (
      <SortableThumb
        showMoviePrintView={showMoviePrintView}
        keyObject={keyObject}
        scaleValue={scaleValueObject.newScaleValue}
        key={thumb.key}
        index={thumb.index}
        dim={(thumbsToDim.find((thumbToDim) => thumbToDim.thumbId === thumb.thumbId))}
        inputRefThumb={(selectedThumbId === thumb.thumbId) ?
          inputRefThumb : undefined} // for the thumb scrollIntoView function
        color={(colorArray !== undefined ? colorArray[thumb.index] : undefined)}
        thumbImageObjectUrl={thumb.thumbImageObjectUrl ||
          getObjectProperty(() => thumbImages[thumb.frameId].objectUrl)}
        aspectRatioInv={scaleValueObject.aspectRatioInv}
        thumbWidth={scaleValueObject.newThumbWidth}
        borderRadius={scaleValueObject.newBorderRadius}
        margin={scaleValueObject.newThumbMargin}
        thumbInfoValue={getThumbInfoValue(settings.defaultThumbInfo, thumb.frameNumber, fps)}
        thumbInfoRatio={settings.defaultThumbInfoRatio}
        hidden={thumb.hidden}
        controlersAreVisible={showSettings ? undefined : (thumb.thumbId === controlersAreVisibleId)}
        disabled={showSettings}
        selected={selectedThumbId ? (selectedThumbId === thumb.thumbId) : false}
        onOver={showSettings ? null : () => onMouseOverResult(thumb.thumbId)}
        onOut={showSettings ? null : () => onMouseOutResult()}
        onLeaveInOut={showSettings ? null : () => onLeaveInOutResult()}
        onThumbDoubleClick={onThumbDoubleClick}
        onSelect={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => {
            onSelectClick(thumb.thumbId, thumb.frameNumber);
          }}
        onBack={showSettings ?
          null : () => onBackClick(file, thumb.thumbId, thumb.frameNumber)}
        onForward={showSettings ?
          null : () => onForwardClick(file, thumb.thumbId, thumb.frameNumber)}
        onToggle={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onToggleClick(file.id, thumb.thumbId)}
        onRemove={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onRemoveClick(file.id, thumb.thumbId)}
        onHoverInPoint={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onHoverInPointResult(thumbArray, thumb.thumbId)}
        onHoverOutPoint={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onHoverOutPointResult(thumbArray, thumb.thumbId)}
        onInPoint={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onInPointClick(file, thumbArray, thumb.thumbId, thumb.frameNumber)}
        onOutPoint={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onOutPointClick(file, thumbArray, thumb.thumbId, thumb.frameNumber)}
        onSaveThumb={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => onSaveThumbClick(file.name, thumb.frameNumber, thumb.frameId)}
      />))
  );

  return (
    <div
      className={styles.grid}
      style={{
        width: scaleValueObject.newMoviePrintWidth,
      }}
      id="ThumbGrid"
    >
      {settings.defaultShowHeader && showMoviePrintView && thumbGridHeaderComponent}
      {thumbGridComponent}
    </div>
  );
};

ThumbGrid.defaultProps = {
  controlersAreVisibleId: 'false',
  selectedThumbId: undefined,
  thumbs: [],
  thumbsToDim: [],
  file: {}
};

ThumbGrid.propTypes = {
  colorArray: PropTypes.object.isRequired,
  controlersAreVisibleId: PropTypes.string,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  inputRefThumb: PropTypes.object.isRequired,
  keyObject: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onForwardClick: PropTypes.func.isRequired,
  onHoverInPointResult: PropTypes.func.isRequired,
  onHoverOutPointResult: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onLeaveInOutResult: PropTypes.func.isRequired,
  onMouseOutResult: PropTypes.func.isRequired,
  onMouseOverResult: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbId: PropTypes.string,
  settings: PropTypes.object.isRequired,
  showMoviePrintView: PropTypes.bool.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  thumbImages: PropTypes.object,
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
  thumbsToDim: PropTypes.object,
};

const SortableThumbGrid = SortableContainer(ThumbGrid);

export default SortableThumbGrid;
