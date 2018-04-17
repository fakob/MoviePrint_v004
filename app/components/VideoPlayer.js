import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Button, Popup } from 'semantic-ui-react';
import { changeThumb, addDefaultThumbs, addThumb } from '../actions';
import {
  VERTICAL_OFFSET_OF_INOUTPOINT_POPUP, MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
} from '../utils/constants'
import {
  getLowestFrame, getHighestFrame, getChangeThumbStep, getVisibleThumbs,
  mapRange, secondsToTimeCode, limitRange, frameCountToSeconds,
  getNextThumb, getPreviousThumb, secondsToFrameCount
} from './../utils/utils';
import styles from './VideoPlayer.css';
import stylesThumb from './ThumbGrid.css';

import inPointButton from './../img/Thumb_IN.png';
import outPointButton from './../img/Thumb_OUT.png';
import back from './../img/Thumb_BACK.png';
import forward from './../img/Thumb_FORWARD.png';
import choose from './../img/Thumb_CHOOSE.png';
import scrub from './../img/Thumb_SCRUB.png';
import handleWide from './../img/Thumb_HANDLE_wide.png';
import hide from './../img/Thumb_HIDE.png';
import show from './../img/Thumb_SHOW.png';
import empty from './../img/Thumb_EMPTY.png';
import transparent from './../img/Thumb_TRANSPARENT.png';

const pathModule = require('path');

class VideoPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTime: 0, // in seconds
      duration: 0, // in seconds
      playHeadPosition: 0, // in pixel
      mouseStartDragInsideTimeline: false,
      videoHeight: 360,
      videoWidth: 640,
    };

    this.onInPointClick = this.onInPointClick.bind(this);
    this.onOutPointClick = this.onOutPointClick.bind(this);
    this.onBackClick = this.onBackClick.bind(this);
    this.onForwardClick = this.onForwardClick.bind(this);
    this.updatePositionWithStep = this.updatePositionWithStep.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.updateTimeFromThumbId = this.updateTimeFromThumbId.bind(this);
    this.updatePositionFromTime = this.updatePositionFromTime.bind(this);
    this.onVideoError = this.onVideoError.bind(this);

    this.onTimelineClick = this.onTimelineClick.bind(this);
    this.onTimelineDrag = this.onTimelineDrag.bind(this);
    this.onTimelineDragStop = this.onTimelineDragStop.bind(this);
    this.onTimelineMouseOver = this.onTimelineMouseOver.bind(this);
    this.onTimelineExit = this.onTimelineExit.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentWillMount(prevProps) {
    const videoHeight = this.props.height - this.props.controllerHeight;
    const videoWidth = videoHeight / this.props.aspectRatioInv;
    this.setState({
      videoHeight,
      videoWidth
    })
  }

  componentDidMount() {
    this.updateTimeFromThumbId(this.props.selectedThumbId);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.aspectRatioInv !== this.props.aspectRatioInv ||
      nextProps.height !== this.props.height ||
      nextProps.width !== this.props.width
    ) {
      const videoHeight = this.props.height - this.props.controllerHeight;
      const videoWidth = videoHeight / this.props.aspectRatioInv;
      this.setState({
        videoHeight,
        videoWidth
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedThumbId !== this.props.selectedThumbId) {
      this.updateTimeFromThumbId(this.props.selectedThumbId);
    }
  }

  onInPointClick() {
    const { store } = this.context;
    const newFrameNumber = mapRange(
      this.state.currentTime,
      0, this.state.duration,
      0, this.props.file.frameCount - 1
    );
    store.dispatch(addDefaultThumbs(
      this.props.file,
      this.props.thumbs.length,
      newFrameNumber,
      getHighestFrame(this.props.thumbs)
    ));
  }

  onOutPointClick() {
    const { store } = this.context;
    const newFrameNumber = mapRange(
      this.state.currentTime,
      0, this.state.duration,
      0, this.props.file.frameCount - 1
    );
    store.dispatch(addDefaultThumbs(
      this.props.file,
      this.props.thumbs.length,
      getLowestFrame(this.props.thumbs),
      newFrameNumber
    ));
  }

  onBackClick(step) {
    this.updatePositionWithStep(step);
  }

  onForwardClick(step) {
    this.updatePositionWithStep(step);
  }

  onDurationChange(duration) {
    // setState is asynchronious
    // updatePosition needs to wait for setState, therefore it is put into callback of setState
    this.setState({ duration }, () => {
      this.updateTimeFromPosition(this.state.playHeadPosition);
    });
  }

  updatePositionWithStep(step) {
    const currentTimePlusStep = this.state.currentTime + frameCountToSeconds(step, this.props.file.fps);
    this.updatePositionFromTime(currentTimePlusStep);
    this.video.currentTime = currentTimePlusStep;
  }

  updatePositionFromTime(currentTime) {
    this.setState({ currentTime });
    const xPos = mapRange(currentTime, 0, this.state.duration, 0, this.state.videoWidth, false);
    this.setState({ playHeadPosition: xPos });
  }

  updateTimeFromThumbId(thumbId) {
    if (this.props.thumbs) {
      let xPos = 0;
      let currentTime = 0;
      if (thumbId) {
        console.log('updateTimeFromThumbId');
        const frameNumberOfThumb =
          this.props.thumbs.find((thumb) => thumb.thumbId === thumbId).frameNumber;
        const { frameCount } = this.props.file;
        xPos = mapRange(frameNumberOfThumb, 0, frameCount - 1, 0, this.state.videoWidth, false);
        currentTime = frameCountToSeconds(frameNumberOfThumb, this.props.file.fps);
        // currentTime = mapRange(
        //   frameNumberOfThumb,
        //   0, frameCount - 1,
        //   0, this.state.duration, false
        // );
      }
      console.log(currentTime);
      this.setState({ playHeadPosition: xPos });
      this.setState({ currentTime });
      this.video.currentTime = currentTime;
    }
  }

  updateTimeFromPosition(xPos) {
    this.setState({ playHeadPosition: xPos });
    const currentTime = mapRange(xPos, 0, this.state.videoWidth, 0, this.state.duration, false);
    // console.log(`${currentTime} : ${this.props.positionRatio} : ${this.state.duration}`);
    this.setState({ currentTime });
    this.video.currentTime = currentTime;
  }

  onTimelineClick(e) {
    const bounds = this.timeLine.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    // const y = e.clientY - bounds.top;
    // console.log('mouse dragging over');
    this.updateTimeFromPosition(x);
    }

  onTimelineDrag() {
    // console.log('start dragging');
    this.setState({ mouseStartDragInsideTimeline: true });
  }

  onTimelineMouseOver(e) {
    // console.log('mouse moving over');
    if (this.state.mouseStartDragInsideTimeline) { // check if dragging over timeline
      const bounds = this.timeLine.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      // const y = e.clientY - bounds.top;
      // console.log('mouse dragging over');
      this.updateTimeFromPosition(x);
    }
  }

  onTimelineDragStop() {
    // console.log('stopped dragging');
    this.setState({ mouseStartDragInsideTimeline: false });
  }

  onTimelineExit() {
    // console.log('leaving timeline');
    if (this.state.mouseStartDragInsideTimeline) {
      this.setState({ mouseStartDragInsideTimeline: false });
    }
  }

  onApplyClick = () => {
    const { store } = this.context;
    const newFrameNumber = secondsToFrameCount(this.state.currentTime, this.props.file.fps);
    store.dispatch(changeThumb(this.props.file, this.props.selectedThumbId, newFrameNumber));

    // move selection to next thumb
    const nextThumbObject = getNextThumb(this.props.thumbs, this.props.selectedThumbId);
    this.props.selectMethod(nextThumbObject.thumbId, nextThumbObject.frameNumber);
  }

  onAddClick = () => {
    const { store } = this.context;
    const newFrameNumber = secondsToFrameCount(this.state.currentTime, this.props.file.fps);
    store.dispatch(addThumb(
      this.props.file,
      newFrameNumber,
      this.props.thumbs.find((thumb) => thumb.thumbId === this.props.selectedThumbId).index + 1
    ));

    // move selection to next thumb
    const nextThumbObject = getNextThumb(this.props.thumbs, this.props.selectedThumbId);
    this.props.selectMethod(nextThumbObject.thumbId, nextThumbObject.frameNumber);
  }

  onCancelClick = () => {
    this.props.closeModal();
  }

  onVideoError = () => {
    console.log('onVideoError');
    console.log(this);
  }

  render() {
    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { playHeadPosition } = this.state;

    function over(event) {
      event.target.style.opacity = 1;
    }

    function out(event) {
      event.target.style.opacity = 0.5;
    }

    const inPoint = getLowestFrame(this.props.thumbs);
    const outPoint = getHighestFrame(this.props.thumbs);
    const inPointPositionOnTimeline = ((this.state.videoWidth * 1.0) / this.props.file.frameCount) * inPoint;
    const outPointPositionOnTimeline = ((this.state.videoWidth * 1.0) / this.props.file.frameCount) * outPoint;
    const cutWidthOnTimeLine = Math.max(outPointPositionOnTimeline - inPointPositionOnTimeline, MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE);

    // console.log(inPoint);
    // console.log(outPoint);
    // console.log(this.state.mouseStartDragInsideTimeline);
    return (
      <div>
        <div
          className={`${styles.player}`}
          style={{
            width: this.state.videoWidth,
            height: this.state.videoHeight,
          }}
        >
          <video
            ref={(el) => { this.video = el; }}
            className={`${styles.video}`}
            controls={this.props.showPlaybar ? 'true' : undefined}
            muted
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width={this.state.videoWidth}
            height={this.state.videoHeight}
            onDurationChange={e => this.onDurationChange(e.target.duration)}
            onTimeUpdate={e => this.updatePositionFromTime(e.target.currentTime)}
            onError={this.onVideoError}
          >
            <track kind="captions" />
          </video>
          <div
            id="currentTimeDisplay"
            className={styles.frameNumberOrTimeCode}
          >
            {secondsToTimeCode(this.state.currentTime, this.props.file.fps)}
          </div>
          <div
            className={`${styles.overVideoButtonWrapper}`}
            style={{
              // display: this.props.selectedThumbId ? 'block' : 'none',
              transform: this.props.showPlaybar ? 'translateY(-64px)' : undefined,
            }}
          >
            <Popup
              trigger={
                <button
                  className={styles.hoverButton}
                  onClick={this.onInPointClick}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  <img
                    src={inPointButton}
                    className={styles.inPoint}
                    alt=""
                  />
                </button>
              }
              content="Use this frame as In-point"
              hoverable
              basic
              inverted
              mouseEnterDelay={1000}
              position="top left"
              className={stylesThumb.popupThumb}
              verticalOffset={VERTICAL_OFFSET_OF_INOUTPOINT_POPUP}
            />
            <Popup
              trigger={
                <button
                  className={styles.hoverButton}
                  onClick={this.onApplyClick}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                  style={{
                    display: this.props.selectedThumbId ? 'block' : 'none',
                  }}
                >
                  <img
                    src={choose}
                    className={styles.choose}
                    alt=""
                  />
                </button>
              }
              content="Choose this frame as thumb"
              hoverable
              basic
              inverted
              size="mini"
              mouseEnterDelay={1000}
              position="top center"
              className={stylesThumb.popupThumb}
              verticalOffset={VERTICAL_OFFSET_OF_INOUTPOINT_POPUP}
              horizontalOffset={this.state.videoWidth / 2}
            />
            <Popup
              trigger={
                <button
                  className={styles.hoverButton}
                  onClick={this.onAddClick}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                  style={{
                    display: this.props.selectedThumbId ? 'block' : 'none',
                  }}
                >
                  <img
                    src={choose}
                    className={styles.addThumb}
                    alt=""
                  />
                </button>
              }
              content="Add this frame as thumb"
              hoverable
              basic
              inverted
              size="mini"
              mouseEnterDelay={1000}
              position="top center"
              className={stylesThumb.popupThumb}
              verticalOffset={VERTICAL_OFFSET_OF_INOUTPOINT_POPUP}
              horizontalOffset={this.state.videoWidth / 2}
            />
            <Popup
              trigger={
                <button
                  className={styles.hoverButton}
                  onClick={this.onOutPointClick}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  <img
                    src={outPointButton}
                    className={styles.outPoint}
                    alt=""
                  />
                </button>
              }
              content="Use this frame as Out-point"
              hoverable
              basic
              inverted
              mouseEnterDelay={1000}
              position="top right"
              className={stylesThumb.popupThumb}
              verticalOffset={VERTICAL_OFFSET_OF_INOUTPOINT_POPUP}
              horizontalOffset={this.state.videoWidth}
            />
          </div>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div
            id="timeLine"
            className={`${styles.timelineWrapper}`}
            onClick={this.onTimelineClick}
            onMouseDown={this.onTimelineDrag}
            onMouseUp={this.onTimelineDragStop}
            onMouseMove={this.onTimelineMouseOver}
            onMouseLeave={this.onTimelineExit}
            ref={(el) => { this.timeLine = el; }}
          >
            <div
              className={`${styles.timelinePlayhead}`}
              style={{
                left: playHeadPosition,
              }}
            />
            <div
              className={`${styles.timelineCut}`}
              style={{
                left: inPointPositionOnTimeline,
                width: cutWidthOnTimeLine
              }}
            />
          </div>
          <div className={`${styles.buttonWrapper}`}>
            <Button.Group
              size="mini"
              compact
              style={{
                marginRight: '20px'
              }}
            >
              <Button
                content="-100"
                onClick={() => this.onBackClick(-100)}
              />
              <Button
                content="-10"
                onClick={() => this.onBackClick(-10)}
              />
              <Button
                content="-1"
                onClick={() => this.onBackClick(-1)}
              />
            </Button.Group>
            <Button.Group
              size="mini"
              compact
              style={{
                marginLeft: '20px'
              }}
            >
              <Button
                content="+1"
                onClick={() => this.onForwardClick(1)}
              />
              <Button
                content="+10"
                onClick={() => this.onForwardClick(10)}
              />
              <Button
                content="+100"
                onClick={() => this.onForwardClick(100)}
              />
            </Button.Group>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const tempThumbs = (state.undoGroup.present
    .thumbsByFileId[state.undoGroup.present.settings.currentFileId] === undefined)
    ? undefined : state.undoGroup.present
      .thumbsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    thumbImages: (state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId] === undefined)
      ? undefined : state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files.find((file) =>
      file.id === state.undoGroup.present.settings.currentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

VideoPlayer.contextTypes = {
  store: PropTypes.object,
  path: PropTypes.string,
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

export default connect(mapStateToProps)(VideoPlayer);
