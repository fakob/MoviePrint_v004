import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  SHEET_TYPE,
} from '../utils/constants';
import {
  getBucketValueOfPercentage,
  roundNumber,
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
}) => {

  // initialise refs
  const refTimeline = useRef(null);
  const refTimelineSelection = useRef(null);

  // initialise react hooks
  const [leftBoundsSelection, setLeftBoundsSelection] = useState(0);
  const [widthSelection, setWidthSelection] = useState(0);
  const [leftBounds, setLeftBounds] = useState(0);
  const [width, setWidth] = useState(0);
  const [mouseStartDragInsideTimelineSelection, setMouseStartDragInsideTimelineSelection] = useState(false);
  const [mouseStartDragInsideTimeline, setMouseStartDragInsideTimeline] = useState(false);

  const sceneInOutObject = getSceneInOutOnTimelineObject(frameCount, containerWidth, currentScene);
  // console.log(sceneInOutObject)

  // componentDidMount
  // initial call to getBoundingClientRect
  useEffect(() => {
    setLeftBoundsSelection(refTimelineSelection.current.getBoundingClientRect().left);
    setWidthSelection(refTimelineSelection.current.getBoundingClientRect().width);
    setLeftBounds(refTimeline.current.getBoundingClientRect().left);
    setWidth(refTimeline.current.getBoundingClientRect().width);
  });

  // componentDidMount
  // add updating getBoundingClientRect on resize
  useEffect(() => {
    const handleResize = () => {
      setLeftBoundsSelection(refTimelineSelection.current.getBoundingClientRect().left);
      setWidthSelection(refTimelineSelection.current.getBoundingClientRect().width);
      setLeftBounds(refTimeline.current.getBoundingClientRect().left);
      setWidth(refTimeline.current.getBoundingClientRect().width);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function onTimelineSelectionClick(e) {
    const xPerc = ((e.clientX - leftBoundsSelection) * 1.0) / (widthSelection - widthOfSingleFrameSelection);
    const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
    // console.log(widthSelection)
    // console.log(e.clientX)
    // console.log(leftBoundsSelection)
    // console.log(xPerc)
    updateTimeFromPositionSelection(xPercBucket);
  }

  function onTimelineClick(e) {
    const xPerc = ((e.clientX - leftBounds) * 1.0) / (width - widthOfSingleFrame);
    const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
    updateTimeFromPosition(xPercBucket);
  }

  function onTimelineMouseOver(e) {
    if (mouseStartDragInsideTimeline) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBounds) * 1.0) / (width - widthOfSingleFrame);
      const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
      updateTimeFromPosition(xPercBucket);
    }
    if (mouseStartDragInsideTimelineSelection) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsSelection) * 1.0) / (widthSelection - widthOfSingleFrameSelection);
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

  function getSceneInOutOnTimelineObject(frameCount, containerWidth, currentScene) {
    let inPoint = 0;
    let outPoint = 0;
    let length = 0;
    if (currentScene !== undefined) {
      inPoint = currentScene.start;
      outPoint = currentScene.start + currentScene.length - 1;
      length = currentScene.length;
    }
    const inPointPositionOnTimeline =
      ((containerWidth * 1.0) / frameCount) * inPoint;
    const outPointPositionOnTimeline =
      ((containerWidth * 1.0) / frameCount) * outPoint;
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );
    return {
      inPoint,
      outPoint,
      length,
      inPointPositionOnTimeline,
      outPointPositionOnTimeline,
      cutWidthOnTimeLine,
    }
  }

  const widthOfSingleFrameSelection = Math.floor(containerWidth / sceneInOutObject.length);
  const playHeadPositionSelection = Math.floor(playHeadPositionPercSelection * (widthSelection - widthOfSingleFrameSelection) + leftBoundsSelection);
  const widthOfSingleFrame = containerWidth * 1.0 / frameCount;
  const playHeadPosition = playHeadPositionPerc * (width - widthOfSingleFrame) + leftBounds;
  console.log(widthOfSingleFrame)
  console.log(playHeadPositionPerc)
  console.log(playHeadPosition)

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
          className={`${styles.timelinePlayhead}`}
          style={{
            left: Number.isNaN(playHeadPosition) ? 0 : playHeadPosition,
          }}
        />
        <div
          className={`${styles.timelineCut}`}
          style={{
            left: Number.isNaN(sceneInOutObject.inPointPositionOnTimeline) ? 0 : sceneInOutObject.inPointPositionOnTimeline,
            width: Number.isNaN(sceneInOutObject.cutWidthOnTimeLine) ? 0 : sceneInOutObject.cutWidthOnTimeLine,
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
