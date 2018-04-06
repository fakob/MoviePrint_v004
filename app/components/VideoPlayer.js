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
    store.dispatch(addDefaultThumbs(
      file,
      thumbs.length,
      frameNumber,
      getHighestFrame(thumbs)
    ));
  }

  onOutPointClick(file, thumbs, thumbId, frameNumber) {
    const { store } = this.context;
    store.dispatch(addDefaultThumbs(
      file,
      thumbs.length,
      getLowestFrame(thumbs),
      frameNumber
    ));
  }

  onBackClick(file, thumbId, frameNumber, step) {
    const { store } = this.context;
    store.dispatch(changeThumb(file, thumbId, frameNumber - step));
  }

  onForwardClick(file, thumbId, frameNumber, step) {
    const { store } = this.context;
    store.dispatch(changeThumb(file, thumbId, frameNumber + step));
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
    const currentTime = (this.props.positionRatio) * this.state.duration + frameCountToSeconds(step, this.props.file.fps);
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
    const width = (this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv;
    this.setState({ currentTime });
    const newX = mapRange(currentTime, 0, this.state.duration, 0, width);
    this.setState({ controlledPosition: { x: newX, y: 0 } });
  }

  onControlledDrag(e, position) {
    const width = (this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv;
    const { x } = position;
    this.setState({ controlledPosition: { x, y: 0 } });
    const newCurrentTime = mapRange(x, 0, width, 0, this.state.duration, false);
    this.video.currentTime = newCurrentTime;
    this.setState({ currentTime: newCurrentTime });
  }

  onApplyClick = () => {
    const newPositionRatio = ((this.state.currentTime * 1.0) / this.state.duration);
    this.props.setNewFrame(this.props.thumbId, newPositionRatio);
  }

  onCancelClick = () => {
    this.props.closeModal();
  }

  render() {
    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { controlledPosition } = this.state;
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
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div className={`${styles.timelineWrapper}`}>
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
            <div id="currentTimeDisplay">{secondsToTimeCode(this.state.currentTime)}</div>
          </div>
          <div className={`${styles.buttonWrapper}`}>
            <Button.Group
              size="mini"
              compact
              floated="left"
            >
              <Button
                basic
                color="orange"
                content="Choose as IN-point"
                onClick={() => this.onInPointClick(this.props.file, this.props.thumbs, this.props.thumbId, this.props.frameNumber)}
              />
            </Button.Group>
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
            <Divider vertical>&nbsp;</Divider>
            <Button.Group
              size="mini"
              compact
            >
              <Button
                content="Choose"
                color="orange"
                onClick={this.onApplyClick}
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
            <Button.Group
              size="mini"
              compact
              floated="right"
            >
              <Button
                basic
                color="orange"
                content="Choose as OUT-point"
                onClick={() => this.onOutPointClick(this.props.file, this.props.thumbs, this.props.thumbId, this.props.frameNumber)}
              />
            </Button.Group>
          </div>
          <div>
            {/* <Button
              size="mini"
              compact
              color="orange"
              // disabled={(this.props.positionRatio === ((this.state.currentTime * 1.0) / this.state.duration)) ? 'true' : undefined}
              disabled={(this.props.thumbId === undefined) ? 'true' : undefined}
              onClick={this.onApplyClick}
            >
              Apply
            </Button> */}
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
