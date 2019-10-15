import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  TIMELINE_PLAYHEAD_MINIMUM_WIDTH,
  TIMELINE_SCENE_MINIMUM_WIDTH,
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
    updateTimeFromPosition(xPerc);
  }

  function onTimelineMouseOver(e) {
    if (mouseStartDragInsideTimeline) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrame);
      updateTimeFromPosition(xPerc);
    }
    if (mouseStartDragInsideTimelineSelection) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsTimeline) * 1.0) / (widthTimeline - widthOfSingleFrameSelection);
      const xPercBucket = getBucketValueOfPercentage(xPerc, sceneInOutObject.length);
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
      TIMELINE_SCENE_MINIMUM_WIDTH
    );

    const lowestFrameOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * lowestFrame;
    const highestFrameOnTimeline =
      ((widthInPixel * 1.0) / frameCountOfMovie) * highestFrame;
    const cutWidthOnTimeLine = Math.max(
      highestFrameOnTimeline - lowestFrameOnTimeline,
      TIMELINE_SCENE_MINIMUM_WIDTH
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

  const widthOfSingleFrameSelection = Math.max(Math.floor(containerWidth / sceneInOutObject.length), TIMELINE_PLAYHEAD_MINIMUM_WIDTH);
  const playHeadPositionSelection = Math.floor(playHeadPositionPercSelection * (widthTimeline - widthOfSingleFrameSelection));
  const widthOfSingleFrame = Math.max((containerWidth * 1.0 / frameCount), TIMELINE_PLAYHEAD_MINIMUM_WIDTH);
  const playHeadPosition = playHeadPositionPerc * (widthTimeline - widthOfSingleFrame);

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
          left: Number.isFinite(playHeadPositionSelection) ? playHeadPositionSelection : 0,
          width: Number.isFinite(widthOfSingleFrameSelection) ? widthOfSingleFrameSelection : 0,
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
            left: Number.isFinite(sceneInOutObject.lowestFrameOnTimeline) ? sceneInOutObject.lowestFrameOnTimeline : 0,
            width: Number.isFinite(sceneInOutObject.cutWidthOnTimeLine) ? sceneInOutObject.cutWidthOnTimeLine : 0,
          }}
        />
        <div
          className={`${styles.timelineCutSelection}`}
          style={{
            left: Number.isFinite(sceneInOutObject.inPointPositionOnTimeline) ? sceneInOutObject.inPointPositionOnTimeline : 0,
            width: Number.isFinite(sceneInOutObject.selectionWidthOnTimeLine) ? sceneInOutObject.selectionWidthOnTimeLine : 0,
          }}
        />
        <div
          className={`${styles.timelinePlayhead}`}
          style={{
            left: Number.isFinite(playHeadPosition) ? playHeadPosition : 0,
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
