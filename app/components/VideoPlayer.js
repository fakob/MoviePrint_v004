import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Button, Divider } from 'semantic-ui-react';
import { changeThumb, addDefaultThumbs } from '../actions';
import {
  getLowestFrame, getHighestFrame, getChangeThumbStep, getVisibleThumbs,
  mapRange, secondsToTimeCode, limitRange, frameCountToSeconds
} from './../utils/utils';
import styles from './VideoPlayer.css';

import inPoint from './../img/Thumb_IN.png';
import outPoint from './../img/Thumb_OUT.png';
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
      // working: false,
      // filePath: '', // Setting video src="" prevents memory leak in chromium
      // playing: false,
      currentTime: undefined,
      duration: undefined,
      controlledPosition: {
        x: 0,
        y: 0
      },
      // cutStartTime: 0,
      // cutEndTime: undefined,
      // fileFormat: undefined,
    };

    this.onInPointClick = this.onInPointClick.bind(this);
    this.onOutPointClick = this.onOutPointClick.bind(this);
    this.onBackClick = this.onBackClick.bind(this);
    this.onForwardClick = this.onForwardClick.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
    this.updatePositionWithStep = this.updatePositionWithStep.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onControlledDrag = this.onControlledDrag.bind(this);

    this.onTimelineClick = this.onTimelineClick.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.positionRatio !== this.props.positionRatio) {
      this.updatePosition(this.props.positionRatio);
    }
  }

  onInPointClick(file, thumbs, thumbId, frameNumber) {
    const { store } = this.context;
    const newPositionRatio = ((this.state.currentTime * 1.0) / this.state.duration);
    const newFrameNumber = newPositionRatio * this.props.file.frameCount;
    store.dispatch(addDefaultThumbs(
      file,
      thumbs.length,
      newFrameNumber,
      getHighestFrame(thumbs)
    ));
  }

  onOutPointClick(file, thumbs, thumbId, frameNumber) {
    const { store } = this.context;
    const newPositionRatio = ((this.state.currentTime * 1.0) / this.state.duration);
    const newFrameNumber = newPositionRatio * this.props.file.frameCount;
    store.dispatch(addDefaultThumbs(
      file,
      thumbs.length,
      getLowestFrame(thumbs),
      newFrameNumber
    ));
  }

  onBackClick(file, thumbId, frameNumber, step) {
    // const { store } = this.context;
    // store.dispatch(changeThumb(file, thumbId, frameNumber - step));
    this.updatePositionWithStep(step);
  }

  onForwardClick(file, thumbId, frameNumber, step) {
    // const { store } = this.context;
    // store.dispatch(changeThumb(file, thumbId, frameNumber + step));
    this.updatePositionWithStep(step);
  }

  onDurationChange(duration) {
    // setState is asynchronious
    // updatePosition needs to wait for setState, therefore it is put into callback of setState
    this.setState({ duration }, () => {
      this.updatePosition();
    });
  }

  updatePositionWithStep(step) {
    const currentTime = this.video.currentTime + frameCountToSeconds(step, this.props.file.fps);
    console.log(`${currentTime} : ${this.props.positionRatio} : ${this.state.duration}`);
    console.log(this.state);
    this.onTimeUpdate(currentTime);
    this.video.currentTime = currentTime;
  }

  updatePosition() {
    const currentTime = this.props.positionRatio * this.state.duration;
    console.log(`${currentTime} : ${this.props.positionRatio} : ${this.state.duration}`);
    console.log(this.state);
    this.onTimeUpdate(currentTime);
    this.video.currentTime = currentTime;
  }

  onTimeUpdate(currentTime) {
    const width = ((this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv) - 24;
    this.setState({ currentTime });
    const newX = mapRange(currentTime, 0, this.state.duration, 0, width);
    this.setState({ controlledPosition: { x: newX, y: 0 } });
  }

  onTimelineClick(e) {
    // e = Mouse click event.
    // console.log(`onTimelineClick - target - ${e.target.id}`);
    // console.log(`onTimelineClick- current - ${e.currentTarget.id}`);
    if (e.target.id === 'timeLine') { // so this does not get fired when dragged
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      // const y = e.clientY - rect.top;  //y position within the element.
      console.log(this.state.controlledPosition);
      console.log(x);
      const width = ((this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv) - 24;
      // const { x } = position;
      this.setState({ controlledPosition: { x, y: 0 } });
      const newCurrentTime = mapRange(x, 0, width, 0, this.state.duration, false);
      this.video.currentTime = newCurrentTime;
      this.setState({ currentTime: newCurrentTime });
    }
  }

  onControlledDrag(e, position) {
    // console.log(`onControlledDrag - target - ${e.target.id}`);
    // console.log(`onControlledDrag- current - ${e.currentTarget.id}`);
    const width = ((this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv) - 24;
    const { x } = position;
    this.setState({ controlledPosition: { x, y: 0 } });
    const newCurrentTime = mapRange(x, 0, width, 0, this.state.duration, false);
    this.video.currentTime = newCurrentTime;
    this.setState({ currentTime: newCurrentTime });
  }

  onApplyClick = () => {
    const { store } = this.context;
    const newPositionRatio = ((this.state.currentTime * 1.0) / this.state.duration);
    const newFrameNumber = newPositionRatio * this.props.file.frameCount;
    store.dispatch(changeThumb(this.props.file, this.props.thumbId, newFrameNumber));
    // this.props.setNewFrame(this.props.thumbId, newPositionRatio);
  }

  onCancelClick = () => {
    this.props.closeModal();
  }

  render() {
    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { controlledPosition } = this.state;

    function over(event) {
      event.target.style.opacity = 1;
    }

    function out(event) {
      event.target.style.opacity = 0.5;
    }

    // console.log(this.props.positionRatio);
    // console.log(`${this.props.positionRatio} === ${((this.state.currentTime * 1.0) / this.state.duration)}`);
    return (
      <div>
        <div className={`${styles.player}`}>
          <video
            ref={(el) => { this.video = el; }}
            className={`${styles.video}`}
            controls={this.props.showPlaybar ? 'true' : undefined}
            muted
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width={(this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv}
            height={this.props.height - this.props.controllerHeight}
            onDurationChange={e => this.onDurationChange(e.target.duration)}
            onTimeUpdate={e => this.onTimeUpdate(e.target.currentTime)}
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
              display: (this.props.thumbId && !this.props.showPlaybar) ? 'block' : 'none',
            }}
          >
            <button
              className={styles.hoverButton}
              onClick={() => this.onInPointClick(this.props.file, this.props.thumbs, this.props.thumbId, this.props.frameNumber)}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              <img
                src={inPoint}
                className={styles.inPoint}
                alt=""
              />
            </button>
            <button
              className={styles.hoverButton}
              onClick={this.onApplyClick}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              <img
                src={choose}
                className={styles.choose}
                alt=""
              />
            </button>
            <button
              className={styles.hoverButton}
              onClick={() => this.onOutPointClick(this.props.file, this.props.thumbs, this.props.thumbId, this.props.frameNumber)}
              onMouseOver={over}
              onMouseLeave={out}
              onFocus={over}
              onBlur={out}
            >
              <img
                src={outPoint}
                className={styles.outPoint}
                alt=""
              />
            </button>
          </div>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div
            id="timeLine"
            className={`${styles.timelineWrapper}`}
            onClick={this.onTimelineClick}
          >
            <Draggable
              axis="x"
              handle=".handle"
              position={controlledPosition}
              onDrag={this.onControlledDrag}
              {...dragHandlers}
            >
              <div>
                <div className={`${styles.currentTime} handle`} />
              </div>
            </Draggable>
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
                onClick={() => this.onBackClick(this.props.file, this.props.thumbId, this.props.frameNumber, -100)}
              />
              <Button
                content="-10"
                onClick={() => this.onBackClick(this.props.file, this.props.thumbId, this.props.frameNumber, -10)}
              />
              <Button
                content="-1"
                onClick={() => this.onBackClick(this.props.file, this.props.thumbId, this.props.frameNumber, -1)}
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
                onClick={() => this.onForwardClick(this.props.file, this.props.thumbId, this.props.frameNumber, 1)}
              />
              <Button
                content="+10"
                onClick={() => this.onForwardClick(this.props.file, this.props.thumbId, this.props.frameNumber, 10)}
              />
              <Button
                content="+100"
                onClick={() => this.onForwardClick(this.props.file, this.props.thumbId, this.props.frameNumber, 100)}
              />
            </Button.Group>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const tempThumbs = (typeof state.undoGroup.present
    .thumbsByFileId[state.undoGroup.present.settings.currentFileId] === 'undefined')
    ? undefined : state.undoGroup.present
      .thumbsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    thumbImages: (typeof state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId] === 'undefined')
      ? undefined : state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files.find((file) =>
      file.id === state.undoGroup.present.settings.currentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  // return {
  //   onInPointClick: (file, thumbs, thumbId, frameNumber) => {
  //     dispatch(addDefaultThumbs(
  //       file,
  //       thumbs.length,
  //       frameNumber,
  //       getHighestFrame(thumbs)
  //     ));
  //   },
  //   onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
  //     dispatch(addDefaultThumbs(
  //       file,
  //       thumbs.length,
  //       getLowestFrame(thumbs),
  //       frameNumber
  //     ));
  //   },
  //   onBackClick: (file, thumbId, frameNumber, step) => {
  //     dispatch(changeThumb(file, thumbId, frameNumber - step));
  //   },
  //   onForwardClick: (file, thumbId, frameNumber, step) => {
  //     dispatch(changeThumb(file, thumbId, frameNumber + step));
  //     ownProps.updatePositionWithStep(step);
  //   }
  // };
};

VideoPlayer.contextTypes = {
  store: PropTypes.object,
  path: PropTypes.string,
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoPlayer);
