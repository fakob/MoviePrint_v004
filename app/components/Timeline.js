import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
} from '../utils/constants';
import {
  getBucketValueOfPercentage,
} from '../utils/utils';
import styles from './Timeline.css';
// import stylesPop from './Popup.css';

const Timeline = ({
  playHeadPositionPercSelection,
  containerWidth,
  playHeadPositionPerc,
  sheetType,
  updateTimeFromPosition,
  updateTimeFromPositionSelection,
  frameCount,
  currentScene,
  lowestFrame,
  highestFrame,
}) => {

  // initialise refs
  const refTimeline = useRef(null);
  const refTimelineSelection = useRef(null);

  // initialise react hooks
  const [leftBoundsTimeline, setLeftBoundsTimeline] = useState(0);
  const [widthTimeline, setWidthTimeline] = useState(0);
  const [mouseStartDragInsideTimelineSelection, setMouseStartDragInsideTimelineSelection] = useState(false);
  const [mouseStartDragInsideTimeline, setMouseStartDragInsideTimeline] = useState(false);

  const sceneInOutObject = getSceneInOutOnTimelineObject(frameCount, containerWidth, currentScene, lowestFrame, highestFrame);

  // componentDidMount
  // initial call to getBoundingClientRect
  useEffect(() => {
    setLeftBoundsTimeline(refTimelineSelection.current.getBoundingClientRect().left);
    setWidthTimeline(refTimelineSelection.current.getBoundingClientRect().width);
  });

  // componentDidMount
  // add updating getBoundingClientRect on resize
  useEffect(() => {
    const handleResize = () => {
      setLeftBoundsTimeline(refTimelineSelection.current.getBoundingClientRect().left);
      setWidthTimeline(refTimelineSelection.current.getBoundingClientRect().width);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function onTimelineSelectionClick(e) {
    const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrameSelection);
    const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
    updateTimeFromPositionSelection(xPercBucket);
  }

  function onTimelineClick(e) {
    const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrame);
    const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
    updateTimeFromPosition(xPercBucket);
  }

  function onTimelineMouseOver(e) {
    if (mouseStartDragInsideTimeline) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrame);
      const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
      updateTimeFromPosition(xPercBucket);
    }
    if (mouseStartDragInsideTimelineSelection) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrameSelection);
      const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
      console.log(xPercBucket)
      updateTimeFromPositionSelection(xPercBucket);
    }
  }

  function onTimelineSelectionDrag() {
    setMouseStartDragInsideTimelineSelection(true);
  }

  function onTimelineDrag() {
    setMouseStartDragInsideTimeline(true);
  }

  function onTimelineDragStop() {
    setMouseStartDragInsideTimeline(false);
    setMouseStartDragInsideTimelineSelection(false);
  }

  function onTimelineExit() {
    if (mouseStartDragInsideTimeline) {
      setMouseStartDragInsideTimeline(false);
    }
    if (mouseStartDragInsideTimelineSelection) {
      setMouseStartDragInsideTimelineSelection(false);
    }
  }

  function getSceneInOutOnTimelineObject(frameCountOfMovie, widthInPixel, scene, lowestFrame, highestFrame) {
    let inPoint = 0;
    let outPoint = 0;
    let length = 0;
    if (scene !== undefined) {
      inPoint = scene.start;
      outPoint = scene.start + scene.length - 1;
      length = scene.length;
    }
    const inPointPositionOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * inPoint;
    const outPointPositionOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * outPoint;
    const selectionWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );

    const lowestFrameOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * lowestFrame;
    const highestFrameOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * highestFrame;
    const cutWidthOnTimeLine = Math.max(
      highestFrameOnTimeline - lowestFrameOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );
    return {
      inPoint,
      outPoint,
      length,
      inPointPositionOnTimeline,
      selectionWidthOnTimeLine,
      lowestFrameOnTimeline,
      cutWidthOnTimeLine,
    }
  }

  const widthOfSingleFrameSelection = Math.floor(containerWidth / sceneInOutObject.length);
  const playHeadPositionSelection = Math.floor(playHeadPositionPercSelection * (widthTimeline - widthOfSingleFrameSelection));
  const widthOfSingleFrame = containerWidth * 1.0 / frameCount;
  const playHeadPosition = playHeadPositionPerc * (widthTimeline - widthOfSingleFrame);
  console.log(playHeadPositionPerc)
  console.log(widthTimeline)
  console.log(playHeadPosition)
  console.log(leftBoundsTimeline)

  return (
    <div
      className={`${styles.container}`}
      style={{
      }}
      onMouseMove={onTimelineMouseOver}
      onMouseLeave={onTimelineExit}
      onMouseUp={onTimelineDragStop}
    >
    <div
      id="timeLineSelection"
      className={`${styles.timelineWrapperSelection}`}
      onClick={onTimelineSelectionClick}
      onMouseDown={onTimelineSelectionDrag}
      onMouseUp={onTimelineDragStop}
      ref={refTimelineSelection}
      style={{
        // backgroundImage: `url(${timelineFrameBackground})`,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${widthOfSingleFrameSelection*2}' height='64' fill='none'><rect opacity='0.015' width='${widthOfSingleFrameSelection}' height='64' fill='white'/></svg>")`,
      }}
    >
      <div
        className={`${styles.timelinePlayheadSelection}`}
        style={{
          left: Number.isNaN(playHeadPositionSelection) ? 0 : playHeadPositionSelection,
          width: widthOfSingleFrameSelection,
        }}
      />
      </div>
      <div
        id="timeLine"
        className={`${styles.timelineWrapper}`}
        onClick={onTimelineClick}
        onMouseDown={onTimelineDrag}
        onMouseUp={onTimelineDragStop}
        ref={refTimeline}
      >
        <div
          className={`${styles.timelineCut}`}
          style={{
            left: Number.isNaN(sceneInOutObject.lowestFrameOnTimeline) ? 0 : sceneInOutObject.lowestFrameOnTimeline,
            width: Number.isNaN(sceneInOutObject.cutWidthOnTimeLine) ? 0 : sceneInOutObject.cutWidthOnTimeLine,
          }}
        />
        <div
          className={`${styles.timelineCutSelection}`}
          style={{
            left: Number.isNaN(sceneInOutObject.inPointPositionOnTimeline) ? 0 : sceneInOutObject.inPointPositionOnTimeline,
            width: Number.isNaN(sceneInOutObject.selectionWidthOnTimeLine) ? 0 : sceneInOutObject.selectionWidthOnTimeLine,
          }}
        />
        <div
          className={`${styles.timelinePlayhead}`}
          style={{
            left: Number.isNaN(playHeadPosition) ? 0 : playHeadPosition,
          }}
        />
      </div>
    </div>
  );
};

Timeline.defaultProps = {
};

Timeline.propTypes = {
};

export default Timeline;
