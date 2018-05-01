// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import { mapRange, frameCountToTimeCode, pad, getObjectProperty } from './../utils/utils';

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
  function getThumbInfoValue(type, frames, framesPerSecond) {
    switch (type) {
      case 'frames':
        return pad(frames, 4);
      case 'timecode':
        return frameCountToTimeCode(frames, framesPerSecond);
      case 'hideInfo':
        return undefined;
      default:
        return undefined;
    }
  }

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
      // console.log(thumbs);
      if (thumbs.length === 0) {
        tempThumbObject = {
          key: String(i),
          index: i,
          // thumbId: String(i),
        };
      } else if (thumbs.length === tempArrayLength) {
        tempThumbObject = thumbs[i];
      } else {
        if ((thumbImages !== undefined) &&
          // thumbImages[thumbs[mappedIterator].frameId] &&
          (i === 0 || i === (tempArrayLength - 1))
        ) {
          tempThumbObject = thumbs[mappedIterator];
        }
        tempThumbObject.key = i;
        tempThumbObject.index = i;
      }
      // console.log(`${i} : ${mappedIterator}`);
      thumbArray[i] = tempThumbObject;
    }
  } else {
    thumbArray = thumbs;
  }
  // console.log(controlersAreVisibleId);
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
        onSelect={(showSettings || (thumb.thumbId !== controlersAreVisibleId)) ?
          null : () => {
            onSelectClick(thumb.thumbId, thumb.frameNumber);
          }}
        onThumbDoubleClick={onThumbDoubleClick}
        onBack={showSettings ? null : () => onBackClick(file, thumb.thumbId, thumb.frameNumber)}
        onForward={showSettings ? null : () => onForwardClick(file, thumb.thumbId, thumb.frameNumber)}
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
  inputRefThumb: PropTypes.object,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  controlersAreVisibleId: PropTypes.string,
  selectedThumbId: PropTypes.string,
  thumbCount: PropTypes.number.isRequired,
  showSettings: PropTypes.bool.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  showMoviePrintView: PropTypes.bool.isRequired,
  onSelectClick: PropTypes.func.isRequired,
  onToggleClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onMouseOverResult: PropTypes.func.isRequired,
  onMouseOutResult: PropTypes.func.isRequired,
};

const SortableThumbGrid = SortableContainer(ThumbGrid);

export default SortableThumbGrid;
