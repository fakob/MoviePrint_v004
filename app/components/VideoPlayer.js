import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import { changeThumb, addDefaultThumbs, addThumb } from '../actions';
import {
  VERTICAL_OFFSET_OF_INOUTPOINT_POPUP, MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  CHANGE_THUMB_STEP, MOVIEPRINT_COLORS
} from '../utils/constants'
import {
  getLowestFrame, getHighestFrame, getChangeThumbStep, getVisibleThumbs,
  mapRange, secondsToTimeCode, limitRange, frameCountToSeconds,
  getNextThumb, getPreviousThumb, secondsToFrameCount
} from './../utils/utils';
import styles from './VideoPlayer.css';

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
      showPlaybar: false
    };

    // this.onSaveThumbClick = this.onSaveThumbClick.bind(this);
    this.onInPointClick = this.onInPointClick.bind(this);
    this.onOutPointClick = this.onOutPointClick.bind(this);
    this.onBackClick = this.onBackClick.bind(this);
    this.onForwardClick = this.onForwardClick.bind(this);
    this.updatePositionWithStep = this.updatePositionWithStep.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.updateTimeFromThumbId = this.updateTimeFromThumbId.bind(this);
    this.updatePositionFromTime = this.updatePositionFromTime.bind(this);
    this.onVideoError = this.onVideoError.bind(this);
    this.onShowPlaybar = this.onShowPlaybar.bind(this);
    this.onHidePlaybar = this.onHidePlaybar.bind(this);

    this.onTimelineClick = this.onTimelineClick.bind(this);
    this.onTimelineDrag = this.onTimelineDrag.bind(this);
    this.onTimelineDragStop = this.onTimelineDragStop.bind(this);
    this.onTimelineMouseOver = this.onTimelineMouseOver.bind(this);
    this.onTimelineExit = this.onTimelineExit.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
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
      const videoHeight = nextProps.height - nextProps.controllerHeight;
      const videoWidth = videoHeight / nextProps.aspectRatioInv;
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

  // onSaveThumbClick() {
  //   saveThumb(this.props.file.fileName, frameNumber);
  // }

  onShowPlaybar() {
    if (!this.state.showPlaybar) {
      this.setState({
        showPlaybar: true
      });
    }
  }

  onHidePlaybar() {
    if (this.state.showPlaybar) {
      this.setState({
        showPlaybar: false
      });
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

  onBackClick(step = undefined) {
    let stepValue;
    if (step) {
      stepValue = step;
    } else {
      stepValue = CHANGE_THUMB_STEP[0] * -1;
      if (this.props.keyObject.shiftKey) {
        stepValue = CHANGE_THUMB_STEP[1] * -1;
      }
      if (this.props.keyObject.altKey) {
        stepValue = CHANGE_THUMB_STEP[2] * -1;
      }
    }
    console.log(stepValue);
    this.updatePositionWithStep(stepValue);
  }

  onForwardClick(step = undefined) {
    let stepValue;
    if (step) {
      stepValue = step;
    } else {
      stepValue = CHANGE_THUMB_STEP[0];
      if (this.props.keyObject.shiftKey) {
        stepValue = CHANGE_THUMB_STEP[1];
      }
      if (this.props.keyObject.altKey) {
        stepValue = CHANGE_THUMB_STEP[2];
      }
    }
    console.log(stepValue);
    this.updatePositionWithStep(stepValue);
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
    // rounds the number with 3 decimals
    const roundedCurrentTime = Math.round((currentTime * 1000) + Number.EPSILON) / 1000;

    this.setState({ currentTime: roundedCurrentTime });
    const xPos = mapRange(roundedCurrentTime, 0, this.state.duration, 0, this.state.videoWidth, false);
    this.setState({ playHeadPosition: xPos });
  }

  updateTimeFromThumbId(thumbId) {
    console.log(thumbId);
    console.log(this.props.thumbs);
    if (thumbId || this.props.thumbs) {
      let xPos = 0;
      let currentTime = 0;
      if (thumbId) {
        console.log('updateTimeFromThumbId');
        const selectedThumb = this.props.thumbs.find((thumb) => thumb.thumbId === thumbId);
        if (selectedThumb) {
          const frameNumberOfThumb = selectedThumb.frameNumber;
          const { frameCount } = this.props.file;
          xPos = mapRange(frameNumberOfThumb, 0, frameCount - 1, 0, this.state.videoWidth, false);
          currentTime = frameCountToSeconds(frameNumberOfThumb, this.props.file.fps);
        }
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
    console.log(`${newFrameNumber} = secondsToFrameCount(${this.state.currentTime}, ${this.props.file.fps})`);
    if (this.props.keyObject.altKey || this.props.keyObject.shiftKey) {
      const newThumbId = uuidV4();
      if (this.props.keyObject.altKey) {
        store.dispatch(addThumb(
          this.props.file,
          newFrameNumber,
          this.props.thumbs.find((thumb) => thumb.thumbId === this.props.selectedThumbId).index + 1,
          newThumbId
        ));
      } else { // if shiftKey
        store.dispatch(addThumb(
          this.props.file,
          newFrameNumber,
          this.props.thumbs.find((thumb) => thumb.thumbId === this.props.selectedThumbId).index,
          newThumbId
        ));
      }
      // delay selection so it waits for add thumb to be ready
      setTimeout(() => {
        this.props.selectMethod(newThumbId, newFrameNumber);
      }, 500);
    } else { // if normal set new thumb
      store.dispatch(changeThumb(this.props.file, this.props.selectedThumbId, newFrameNumber));
    }
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
            onMouseOver={this.onShowPlaybar}
            onMouseOut={this.onHidePlaybar}
            controls={this.state.showPlaybar ? 'true' : undefined}
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
            <button
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                marginLeft: '8px',
              }}
              className={`${styles.hoverButton} ${styles.textButton}`}
              onClick={this.onInPointClick}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              IN
            </button>
            <button
              style={{
                transformOrigin: 'center bottom',
                transform: 'translateX(-50%)',
                position: 'absolute',
                bottom: 0,
                left: '30%',
              }}
              className={`${styles.hoverButton} ${styles.textButton}`}
              onClick={() => this.onBackClick()}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              {this.props.keyObject.altKey ? '<<<' : (this.props.keyObject.shiftKey ? '<<' : '<')}
            </button>
            <button
              className={`${styles.hoverButton} ${styles.textButton}`}
              onClick={this.onApplyClick}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
              style={{
                display: this.props.selectedThumbId ? 'block' : 'none',
                transformOrigin: 'center bottom',
                transform: 'translateX(-50%)',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                color: MOVIEPRINT_COLORS[0]
              }}
            >
              {this.props.keyObject.altKey ? 'ADD AFTER' : (this.props.keyObject.shiftKey ? 'ADD BEFORE' : 'SET')}
            </button>
            <button
              style={{
                transformOrigin: 'center bottom',
                transform: 'translateX(-50%)',
                position: 'absolute',
                bottom: 0,
                left: '70%',
              }}
              className={`${styles.hoverButton} ${styles.textButton}`}
              onClick={() => this.onForwardClick()}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              {this.props.keyObject.altKey ? '>>>' : (this.props.keyObject.shiftKey ? '>>' : '>')}
            </button>
            <button
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                marginRight: '8px',
              }}
              className={`${styles.hoverButton} ${styles.textButton}`}
              onClick={this.onOutPointClick}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              OUT
            </button>
            {/* <Button.Group
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
            </Button.Group> */}
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
