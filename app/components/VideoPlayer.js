/* eslint no-param-reassign: "error" */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import { changeThumb, addDefaultThumbs, addThumb } from '../actions';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  CHANGE_THUMB_STEP, MOVIEPRINT_COLORS
} from '../utils/constants';
import {
  frameCountToSeconds,
  getHighestFrame,
  getLowestFrame,
  getVisibleThumbs,
  mapRange,
  secondsToFrameCount,
  secondsToTimeCode,
} from './../utils/utils';
import styles from './VideoPlayer.css';
import stylesPop from './Popup.css';

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
      showPlaybar: false,
      loadVideo: false,
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
    this.onLoadedData = this.onLoadedData.bind(this);
    this.onShowPlaybar = this.onShowPlaybar.bind(this);
    this.onHidePlaybar = this.onHidePlaybar.bind(this);

    this.onTimelineClick = this.onTimelineClick.bind(this);
    this.onTimelineDrag = this.onTimelineDrag.bind(this);
    this.onTimelineDragStop = this.onTimelineDragStop.bind(this);
    this.onTimelineMouseOver = this.onTimelineMouseOver.bind(this);
    this.onTimelineExit = this.onTimelineExit.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
  }

  componentWillMount() {
    const videoHeight = this.props.height - this.props.controllerHeight;
    const videoWidth = videoHeight / this.props.aspectRatioInv;
    this.setState({
      videoHeight,
      videoWidth,
      loadVideo: true
    });
  }

  componentDidMount() {
    this.updateTimeFromThumbId(this.props.selectedThumbId);
  }

  componentWillReceiveProps(nextProps) {
    // console.log('VideoPlayer - componentWillReceiveProps');
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
    const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
    let stepValue;
    if (step) {
      stepValue = step;
    } else {
      stepValue = stepValue1 * -1;
      if (this.props.keyObject.shiftKey) {
        stepValue = stepValue0 * -1;
      }
      if (this.props.keyObject.altKey) {
        stepValue = stepValue2 * -1;
      }
    }
    console.log(stepValue);
    this.updatePositionWithStep(stepValue);
  }

  onForwardClick(step = undefined) {
    const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
    let stepValue;
    if (step) {
      stepValue = step;
    } else {
      stepValue = stepValue1;
      if (this.props.keyObject.shiftKey) {
        stepValue = stepValue0;
      }
      if (this.props.keyObject.altKey) {
        stepValue = stepValue2;
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
    const currentTimePlusStep = this.state.currentTime +
      frameCountToSeconds(step, this.props.file.fps);
    this.updatePositionFromTime(currentTimePlusStep);
    if (this.state.loadVideo) {
      this.video.currentTime = currentTimePlusStep;
    }
  }

  updatePositionFromTime(currentTime) {
    if (currentTime) {
      // rounds the number with 3 decimals
      const roundedCurrentTime = Math.round((currentTime * 1000) + Number.EPSILON) / 1000;

      this.setState({ currentTime: roundedCurrentTime });
      const xPos = mapRange(
        roundedCurrentTime,
        0, this.state.duration,
        0, this.state.videoWidth, false
      );
      this.setState({ playHeadPosition: xPos });
    }
  }

  updateTimeFromThumbId(thumbId) {
    if (this.props.thumbs && thumbId) {
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
      this.setState({ playHeadPosition: xPos });
      this.setState({ currentTime });
      if (this.state.loadVideo) {
        this.video.currentTime = currentTime;
      }
    }
  }

  updateTimeFromPosition(xPos) {
    if (xPos) {
      this.setState({ playHeadPosition: xPos });
      const currentTime = mapRange(xPos, 0, this.state.videoWidth, 0, this.state.duration, false);
      console.log(`${currentTime} : ${xPos} : ${this.state.videoWidth} : ${this.state.duration}`);
      this.setState({ currentTime });
      if (this.state.loadVideo) {
        this.video.currentTime = currentTime;
      }
    }
  }

  onTimelineClick(e) {
    const bounds = this.timeLine.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    this.updateTimeFromPosition(x);
  }

  onTimelineDrag() {
    this.setState({ mouseStartDragInsideTimeline: true });
  }

  onTimelineMouseOver(e) {
    if (this.state.mouseStartDragInsideTimeline) { // check if dragging over timeline
      const bounds = this.timeLine.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      this.updateTimeFromPosition(x);
    }
  }

  onTimelineDragStop() {
    this.setState({ mouseStartDragInsideTimeline: false });
  }

  onTimelineExit() {
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

  onVideoError = () => {
    console.log('onVideoError');
    // console.log(this);
    this.onDurationChange(frameCountToSeconds(this.props.file.frameCount));
    this.setState({
      loadVideo: false
    });
  }

  onLoadedData = () => {
    console.log('onLoadedData');
    // console.log(this);
    this.setState({
      loadVideo: true
    });
  }

  render() {
    const { playHeadPosition } = this.state;

    function over(event) {
      event.target.style.opacity = 1;
    }

    function out(event) {
      event.target.style.opacity = 0.5;
    }

    const inPoint = getLowestFrame(this.props.thumbs);
    const outPoint = getHighestFrame(this.props.thumbs);
    const inPointPositionOnTimeline =
      ((this.state.videoWidth * 1.0) / this.props.file.frameCount) * inPoint;
    const outPointPositionOnTimeline =
      ((this.state.videoWidth * 1.0) / this.props.file.frameCount) * outPoint;
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );

    return (
      <div>
        <div
          className={`${styles.player}`}
          style={{
            width: this.state.videoWidth,
            height: this.state.videoHeight,
          }}
        >
          <Popup
            trigger={
              <button
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  marginTop: '8px',
                  marginRight: '8px',
                  zIndex: 1,
                }}
                className={`${styles.hoverButton} ${styles.textButton}`}
                onClick={this.props.onThumbDoubleClick}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                BACK
              </button>
            }
            className={stylesPop.popup}
            content="Back to MoviePrint view"
          />
          {this.state.loadVideo ?
            <video
              ref={(el) => { this.video = el; }}
              className={`${styles.video}`}
              onMouseOver={this.onShowPlaybar}
              onFocus={this.onShowPlaybar}
              onMouseOut={this.onHidePlaybar}
              onBlur={this.onHidePlaybar}
              controls={this.state.showPlaybar ? 'true' : undefined}
              muted
              src={this.props.file ? `${pathModule.dirname(this.props.file.path)}/${encodeURIComponent(pathModule.basename(this.props.file.path))}` || '' : ''}
              width={this.state.videoWidth}
              height={this.state.videoHeight}
              onDurationChange={e => this.onDurationChange(e.target.duration)}
              onTimeUpdate={e => this.updatePositionFromTime(e.target.currentTime)}
              onLoadedData={this.onLoadedData}
              onError={this.onVideoError}
            >
              <track kind="captions" />
            </video>
            :
            <div
              style={{
                backgroundColor: '#111111',
                width: this.state.videoWidth,
                height: this.state.videoHeight
              }}
            >
              <div
                className={styles.textButton}
                style={{
                  transformOrigin: 'center center',
                  transform: 'translate(-50%, -50%)',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  textAlign: 'center',
                }}
              >
                NO PLAYER AVAILABE
              </div>
            </div>
          }
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
            <Popup
              trigger={
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
              }
              className={stylesPop.popup}
              content="Set this thumb as new IN-point"
            />
            <Popup
              trigger={
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
                  {this.props.keyObject.altKey ? '<<<' : (this.props.keyObject.shiftKey ? '<' : '<<')}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 10 frames back | with <mark>SHIFT</mark> move 1 frame | with <mark>ALT</mark> move 100 frames</span>}
            />
            <Popup
              trigger={
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
                  {this.props.keyObject.altKey ? 'ADD AFTER' : (this.props.keyObject.shiftKey ? 'ADD BEFORE' : 'CHANGE')}
                </button>
              }
              className={stylesPop.popup}
              content={this.props.keyObject.altKey ? (<span>Add a new thumb <mark>after</mark> selection</span>) : (this.props.keyObject.shiftKey ? (<span>Add a new thumb <mark>before</mark> selection</span>) : (<span>Change the thumb to use this frame | with <mark>SHIFT</mark> add a thumb before selection | with <mark>ALT</mark> add a thumb after selection</span>))}
            />
            <Popup
              trigger={
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
                  {this.props.keyObject.altKey ? '>>>' : (this.props.keyObject.shiftKey ? '>' : '>>')}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 10 frames forward | with <mark>SHIFT</mark> move 1 frame | with <mark>ALT</mark> move 100 frames</span>}
            />
            <Popup
              trigger={
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
              }
              className={stylesPop.popup}
              content="Set this thumb as new OUT-point"
            />
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
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

VideoPlayer.contextTypes = {
  store: PropTypes.object,
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

VideoPlayer.defaultProps = {
  // currentFileId: undefined,
  file: {
    id: undefined,
    width: 640,
    height: 360,
    columnCount: 4,
    frameCount: 16,
    fps: 25,
    path: '',
  },
  height: 360,
  selectedThumbId: undefined,
  width: 640,
  thumbs: undefined,
  // thumbsByFileId: {},
};

VideoPlayer.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  controllerHeight: PropTypes.number.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    columnCount: PropTypes.number,
    frameCount: PropTypes.number,
    fps: PropTypes.number,
    path: PropTypes.string,
  }),
  height: PropTypes.number,
  keyObject: PropTypes.object.isRequired,
  onThumbDoubleClick: PropTypes.func.isRequired,
  selectedThumbId: PropTypes.string,
  selectMethod: PropTypes.func.isRequired,
  width: PropTypes.number,
  // settings: PropTypes.object.isRequired,
  thumbs: PropTypes.array,
  // thumbsByFileId: PropTypes.object,
  // visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(VideoPlayer);
