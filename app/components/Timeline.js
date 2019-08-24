import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  SHEET_TYPE,
} from '../utils/constants';
import styles from './Timeline.css';
// import stylesPop from './Popup.css';

const Timeline = ({
  playHeadPositionPercSelection,
  containerWidth,
  playHeadPositionPerc,
  sceneInOutObject,
  sheetType,
  updateTimeFromPosition,
  updateTimeFromPositionSelection,
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
    const xPerc = ((e.clientX - leftBoundsSelection) * 1.0) / widthSelection;
    // console.log(widthSelection)
    // console.log(e.clientX)
    // console.log(leftBoundsSelection)
    // console.log(xPerc)
    updateTimeFromPositionSelection(xPerc);
  }

  function onTimelineClick(e) {
    const xPerc = ((e.clientX - leftBounds) * 1.0) / width;
    updateTimeFromPosition(xPerc);
  }

  function onTimelineMouseOver(e) {
    if (mouseStartDragInsideTimeline) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBounds) * 1.0) / width;
      updateTimeFromPosition(xPerc);
    }
    if (mouseStartDragInsideTimelineSelection) { // check if dragging over timeline
      const xPerc = ((e.clientX - leftBoundsSelection) * 1.0) / widthSelection;
      updateTimeFromPositionSelection(xPerc);
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

  const playHeadPositionSelection = playHeadPositionPercSelection * widthSelection + leftBoundsSelection;
  const playHeadPosition = playHeadPositionPerc * width + leftBounds;

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
      // onMouseMove={onTimelineSelectionMouseOver}
      // onMouseLeave={onTimelineSelectionExit}
      ref={refTimelineSelection}
      // ref={measuredRefSelection}
    >
      <div
        className={`${styles.timelinePlayheadSelection}`}
        style={{
          left: Number.isNaN(playHeadPositionSelection) ? 0 : playHeadPositionSelection,
        }}
      />
        {sheetType === SHEET_TYPE.SCENES && <div
          className={`${styles.timelineCutSelection}`}
          style={{
            left: 0,
            width: containerWidth,
          }}
        />}
      </div>
      <div
        id="timeLine"
        className={`${styles.timelineWrapper}`}
        onClick={onTimelineClick}
        onMouseDown={onTimelineDrag}
        onMouseUp={onTimelineDragStop}
        // onMouseMove={onTimelineMouseOver}
        // onMouseLeave={onTimelineExit}
        ref={refTimeline}
        // ref={measuredRef}
      >
        <div
          className={`${styles.timelinePlayhead}`}
          style={{
            left: Number.isNaN(playHeadPosition) ? 0 : playHeadPosition,
          }}
        />
        {sheetType === SHEET_TYPE.SCENES && <div
          className={`${styles.timelineCut}`}
          style={{
            left: Number.isNaN(sceneInOutObject.inPointPositionOnTimeline) ? 0 : sceneInOutObject.inPointPositionOnTimeline,
            width: Number.isNaN(sceneInOutObject.cutWidthOnTimeLine) ? 0 : sceneInOutObject.cutWidthOnTimeLine,
          }}
        />}
      </div>
    </div>
  );
};

Timeline.defaultProps = {
};

Timeline.propTypes = {
};

export default Timeline;
