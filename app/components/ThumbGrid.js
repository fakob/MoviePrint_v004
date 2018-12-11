// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import stylesPop from './Popup.css';
import {
  getNextThumbs,
  getPreviousThumbs,
  mapRange,
  getObjectProperty,
  getThumbInfoValue,
  formatBytes,
  frameCountToTimeCode,
  getLowestFrame,
  getHighestFrame,
  getAllFrameNumbers,
  roundNumber,
} from './../utils/utils';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  MINIMUM_WIDTH_TO_SHRINK_HOVER,
  MINIMUM_WIDTH_TO_SHOW_HOVER,
  VIEW, SHEET_TYPE
} from './../utils/constants';

const SortableThumb = SortableElement(Thumb);

class ThumbGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      thumbsToDim: [],
      controllersVisible: undefined,
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
      hoverPos: undefined,
      parentPos: undefined,
    };

    this.thumbGridDivRef = null;

    this.setThumbGridDivRef = element => {
      this.thumbGridDivRef = element;
    }

    this.resetHover = this.resetHover.bind(this);
    this.onContainerOut = this.onContainerOut.bind(this);
    this.onExit = this.onExit.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onSaveThumb = this.onSaveThumb.bind(this);
    this.onInPoint = this.onInPoint.bind(this);
    this.onOutPoint = this.onOutPoint.bind(this);
    this.onHoverInPoint = this.onHoverInPoint.bind(this);
    this.onHoverOutPoint = this.onHoverOutPoint.bind(this);
    this.onLeaveInOut = this.onLeaveInOut.bind(this);
    this.onScrub = this.onScrub.bind(this);
    this.onAddBefore = this.onAddBefore.bind(this);
    this.onAddAfter = this.onAddAfter.bind(this);
    this.onBack = this.onBack.bind(this);
    this.onForward = this.onForward.bind(this);
    this.onHoverAddThumbBefore = this.onHoverAddThumbBefore.bind(this);
    this.onHoverAddThumbAfter = this.onHoverAddThumbAfter.bind(this);
    this.onLeaveAddThumb = this.onLeaveAddThumb.bind(this);
    // this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    // this.this.props.onScrubClickWithStop = this.this.props.onScrubClickWithStop.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {
    console.log(this.thumbGridDivRef)
    console.log(this.thumbGridDivRef.current)
    console.log(this.thumbGridDivRef.getBoundingClientRect())
    this.setState({
      parentPos: this.thumbGridDivRef.getBoundingClientRect(),
    })
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidUpdate(prevProps) {
    // console.log('ThumbGrid componentDidUpdate');
    // console.log(this.props.thumbImages);
  }

  over(e) {
    e.stopPropagation();
    e.target.style.opacity = 1;
  }

  out(e) {
    e.stopPropagation();
    e.target.style.opacity = 0.2;
  }

  resetHover() {
    this.setState({
      thumbsToDim: [],
      controllersVisible: undefined,
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
      hoverPos: undefined,
    });
  }

  onContainerOut(e) {
    e.stopPropagation();
    this.resetHover();
  }

  onExit(e) {
    e.stopPropagation();
    this.props.onExitClick();
    this.resetHover();
  }

  onToggle(e) {
    e.stopPropagation();
    this.props.onToggleClick(this.props.file.id, this.state.controllersVisible);
    this.resetHover();
  }

  onSaveThumb(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onSaveThumbClick(this.props.file.id, thumb.frameNumber, thumb.frameId);
    this.resetHover();
  }

  onInPoint(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onInPointClick(this.props.file, this.props.thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onOutPoint(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onOutPointClick(this.props.file, this.props.thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onBack(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onBackClick(this.props.file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onForward(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onForwardClick(this.props.file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onHoverInPoint(e) {
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getPreviousThumbs(this.props.thumbs, this.state.controllersVisible)
    });
  }

  onHoverOutPoint(e) {
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getNextThumbs(this.props.thumbs, this.state.controllersVisible)
    });
  }

  onLeaveInOut(e) {
    e.target.style.opacity = 0.2;
    e.stopPropagation();
    this.setState({
      thumbsToDim: []
    });
  }

  onScrub(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onScrubClick(this.props.file, thumb);
    this.resetHover();
  }

  onAddBefore(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onAddThumbClick(this.props.file, thumb, 'before');
    this.resetHover();
  }

  onAddAfter(e) {
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onAddThumbClick(this.props.file, thumb, 'after');
    this.resetHover();
  }

  onHoverAddThumbBefore(e) {
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbBeforeController: this.state.controllersVisible,
    });
  }

  onHoverAddThumbAfter(e) {
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbAfterController: this.state.controllersVisible,
    });
  }

  onLeaveAddThumb(e) {
    e.target.style.opacity = 0.2;
    e.stopPropagation();
    this.setState({
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
    });
  }

  render() {
    const fps = (this.props.file !== undefined && this.props.file.fps !== undefined ? this.props.file.fps : 25);
    const fileDetails = this.props.file ? `${frameCountToTimeCode(this.props.file.frameCount, fps)} | ${roundNumber(fps)} FPS | ${this.props.file.width} × ${this.props.file.height} | ${formatBytes(this.props.file.size, 1)} | ${this.props.file.fourCC}` : '';
// 00:06:48:12 (9789 frames) | 23.99 FPS | 1280 x 720 | 39.2 MB
    let thumbArray = this.props.thumbs;

    const getFrameInPercentage = (frameNumber, frameCount) => {
      if (frameCount > 1) {
        return (frameNumber / ((frameCount - 1) * 1.0)) * 100.0;
      }
      return 0;
    }

    // calculate in and outpoint for the timeline in percent
    const inPoint = getLowestFrame(this.props.thumbs);
    const outPoint = getHighestFrame(this.props.thumbs);
    const inPointPositionOnTimeline = getFrameInPercentage(inPoint, this.props.file.frameCount);
    const outPointPositionOnTimeline = getFrameInPercentage(outPoint, this.props.file.frameCount);
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );
    const allFrameNumbersArray = getAllFrameNumbers(this.props.thumbs);
    const allFrameNumbersInPercentArray = allFrameNumbersArray
      .map(frameNumber => getFrameInPercentage(frameNumber, this.props.file.frameCount));

    if (this.props.showSettings || this.props.thumbs.length === 0) {
      const tempArrayLength = this.props.thumbCount;
      thumbArray = Array(tempArrayLength);

      for (let i = 0; i < tempArrayLength; i += 1) {
        const mappedIterator = mapRange(
          i,
          0, tempArrayLength - 1,
          0, (this.props.thumbs !== undefined ? this.props.thumbs.length : tempArrayLength) - 1
        );
        let tempThumbObject = {
          id: String(mappedIterator),
        };
        if (this.props.thumbs.length === 0) {
          tempThumbObject = {
            index: i,
          };
        } else if (this.props.thumbs.length === tempArrayLength) {
          tempThumbObject = this.props.thumbs[i];
        } else {
          if ((this.props.thumbImages !== undefined) &&
            (i === 0 || i === (tempArrayLength - 1))
          ) {
            tempThumbObject = this.props.thumbs[mappedIterator];
          } else {
            tempThumbObject.transparentThumb = true; // set this to control displaying a thumb image or a color
          }
          tempThumbObject.index = i;
        }
        thumbArray[i] = tempThumbObject;
      }
    }
    const thumbWidth = this.props.scaleValueObject.newThumbWidth;

    const isScene = this.props.defaultSheet.indexOf(SHEET_TYPE.SCENES) === -1 &&
      this.props.defaultSheet.indexOf(SHEET_TYPE.INTERVAL) === -1;
    const hoverThumbIndex = thumbArray.findIndex(thumb => thumb.thumbId === this.state.controllersVisible);
    const isHidden = hoverThumbIndex !== -1 ? thumbArray[hoverThumbIndex].hidden : undefined;
    // console.log(this.thumbGridDivRef !== null ? this.thumbGridDivRef.getBoundingClientRect() : 'not set yet')
    // this.setState({
    //   parentPos: this.thumbGridDivRef.getBoundingClientRect(),
    // })
    const parentPos = this.thumbGridDivRef !== null ?
      this.thumbGridDivRef.getBoundingClientRect() :
      {
        left: 0,
        top: 0,
      };
    // console.log(this.state.hoverPos);
    // console.log(parentPos);

    const showBeforeController = (this.props.showSettings ? false : (this.state.controllersVisible === this.state.addThumbBeforeController)) || this.props.keyObject.shiftKey;
    const showAfterController = (this.props.showSettings ? false : (this.state.controllersVisible === this.state.addThumbAfterController)) || this.props.keyObject.altKey;

    return (
      <div
        data-tid='thumbGridDiv'
        className={styles.grid}
        style={{
          width: this.props.viewForPrinting ? this.props.scaleValueObject.newMoviePrintWidthForPrinting : this.props.scaleValueObject.newMoviePrintWidth,
          marginLeft: this.props.visibilitySettings.defaultView === VIEW.GRIDVIEW ? undefined : (thumbWidth / 4),
        }}
        id="ThumbGrid"
        ref={this.setThumbGridDivRef}
      >
        {this.props.settings.defaultShowHeader && this.props.visibilitySettings.defaultView === VIEW.GRIDVIEW &&
          <ThumbGridHeader
            viewForPrinting={this.props.viewForPrinting}
            defaultView={this.props.defaultView}
            fileName={this.props.file.name || ''}
            filePath={this.props.file.path || ''}
            fileDetails={fileDetails}
            showPathInHeader={this.props.settings.defaultShowPathInHeader}
            showDetailsInHeader={this.props.settings.defaultShowDetailsInHeader}
            showTimelineInHeader={this.props.settings.defaultShowTimelineInHeader}
            moviePrintWidth={this.props.viewForPrinting ? this.props.scaleValueObject.newMoviePrintWidthForPrinting : this.props.scaleValueObject.newMoviePrintWidth}
            headerHeight={this.props.scaleValueObject.newHeaderHeight}
            logoHeight={this.props.scaleValueObject.newLogoHeight}
            thumbMargin={this.props.scaleValueObject.newThumbMargin}
            scaleValue={this.props.scaleValueObject.newScaleValue}
            inPointPositionOnTimeline={inPointPositionOnTimeline}
            cutWidthOnTimeLine={cutWidthOnTimeLine}
            allFrameNumbersInPercentArray={allFrameNumbersInPercentArray}
          />
        }
        <div
          data-tid='thumbGridBodyDiv'
        >
          {thumbArray.map(thumb => (
            <SortableThumb
              defaultView={this.props.defaultView}
              keyObject={this.props.keyObject}
              key={thumb.thumbId || uuidV4()}
              thumbId={thumb.thumbId}
              index={thumb.index}
              indexForId={thumb.index}
              dim={(this.state.thumbsToDim.find((thumbToDim) => thumbToDim.thumbId === thumb.thumbId))}
              inputRefThumb={(this.props.selectedThumbId === thumb.thumbId) ?
                this.props.inputRefThumb : undefined} // for the thumb scrollIntoView function
              color={(this.props.colorArray !== undefined ? this.props.colorArray[thumb.index] : undefined)}
              thumbImageObjectUrl={
                getObjectProperty(() => this.props.thumbImages[thumb.frameId].objectUrl)
              }
              transparentThumb={thumb.transparentThumb || undefined}
              aspectRatioInv={this.props.scaleValueObject.aspectRatioInv}
              thumbWidth={thumbWidth}
              borderRadius={this.props.scaleValueObject.newBorderRadius}
              margin={this.props.scaleValueObject.newThumbMargin}
              thumbInfoValue={getThumbInfoValue(this.props.settings.defaultThumbInfo, thumb.frameNumber, fps)}
              thumbInfoRatio={this.props.settings.defaultThumbInfoRatio}
              hidden={thumb.hidden}
              controllersAreVisible={(this.props.showSettings || thumb.thumbId === undefined) ? false : (thumb.thumbId === this.state.controllersVisible)}
              selected={this.props.selectedThumbId ? (this.props.selectedThumbId === thumb.thumbId) : false}
              onOver={this.props.showSettings ? null : (event) => {
                // only setState if controllersVisible has changed
                // console.log(event.target.getBoundingClientRect());
                const hoverPos = event.target.getBoundingClientRect();
                event.stopPropagation();
                if (this.state.controllersVisible !== thumb.thumbId) {
                  this.setState({
                    controllersVisible: thumb.thumbId,
                    hoverPos,
                  });
                }
              }}
              onThumbDoubleClick={this.props.onThumbDoubleClick}
              onSelect={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => {
                  this.props.onSelectClick(thumb.thumbId, thumb.frameNumber);
                }}
              onErrorThumb={() => this.props.onErrorThumb(
                  this.props.file,
                  this.props.defaultSheet,
                  thumb.thumbId,
                  thumb.frameId)
                }
            />))}
        </div>
        {!this.props.isSorting && // only show when not sorting
        this.state.hoverPos !== undefined && // only show when hoveringOver a thumb
          <div
            className={styles.overlayContainer}
            onMouseLeave={this.onContainerOut}
          >
          <div
            className={styles.overlay}
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              left: this.state.hoverPos.left - parentPos.left,
              top: this.state.hoverPos.top - parentPos.top,
              width: `${thumbWidth}px`,
              height: `${(thumbWidth * this.props.scaleValueObject.aspectRatioInv)}px`,
            }}
          >
              {isScene && <Popup
                trigger={
                  <button
                    data-tid={`ExitThumbBtn_${this.state.controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayExit} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onExit}
                    onMouseOver={this.over}
                    onMouseLeave={this.out}
                    onFocus={this.over}
                    onBlur={this.out}
                  >
                    EXIT
                  </button>
                }
                className={stylesPop.popup}
                content="Enter into scene"
              />}
              <Popup
                trigger={
                  <button
                    data-tid={`${isHidden ? 'show' : 'hide'}ThumbBtn_${this.state.controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayHide} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onToggle}
                    onMouseOver={this.over}
                    onMouseLeave={this.out}
                    onFocus={this.over}
                    onBlur={this.out}
                  >
                    {isHidden ? 'SHOW' : 'HIDE'}
                  </button>
                }
                className={stylesPop.popup}
                content="Hide thumb"
              />
              <Popup
                trigger={
                  <button
                    data-tid={`saveThumbBtn_${this.state.controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlaySave} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onSaveThumb}
                    onMouseOver={this.over}
                    onMouseLeave={this.out}
                    onFocus={this.over}
                    onBlur={this.out}
                  >
                    SAVE
                  </button>
                }
                className={stylesPop.popup}
                content="Save thumb"
              />
              {!isHidden &&
                <div>
                  <Popup
                    trigger={
                      <button
                        data-tid={`setInPointBtn_${this.state.controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayIn} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onInPoint}
                        onMouseOver={this.onHoverInPoint}
                        onMouseLeave={this.onLeaveInOut}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        IN
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Set this thumb as new <mark>IN-point</mark></span>}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`addNewThumbBeforeBtn_${this.state.controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddBefore} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onAddBefore}
                        onMouseOver={this.onHoverAddThumbBefore}
                        onMouseLeave={this.onLeaveAddThumb}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        +
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Add new thumb before</span>}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`scrubBtn_${this.state.controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayScrub} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        // onClick={onScrubWithStop}
                        onMouseDown={this.onScrub}
                        onMouseOver={this.over}
                        onMouseLeave={this.out}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        {'<'}|{'>'}
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Click and drag left and right to change the frame (<mark>SHIFT</mark> add new thumb before, <mark>ALT</mark> add new thumb after, <mark>CTRL</mark> display original as overlay)</span>}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`addNewThumbAfterBtn_${this.state.controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddAfter} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onAddAfter}
                        onMouseOver={this.onHoverAddThumbAfter}
                        onMouseLeave={this.onLeaveAddThumb}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        +
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Add new thumb after</span>}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`setOutPointBtn_${this.state.controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayOut} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onOutPoint}
                        onMouseOver={this.onHoverOutPoint}
                        onMouseLeave={this.onLeaveInOut}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        OUT
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Set this thumb as new <mark>OUT-point</mark></span>}
                  />
                </div>
              }
              {this.props.visibilitySettings.defaultView !== VIEW.GRIDVIEW && (showBeforeController || showAfterController) &&
                <div
                  data-tid={`insertThumb${(!showAfterController && showBeforeController) ? 'Before' : 'After'}Div_${this.state.controllersVisible}`}
                  style={{
                    content: '',
                    backgroundColor: '#FF5006',
                    position: 'absolute',
                    width: `${Math.max(1, this.props.scaleValueObject.newThumbMargin * 0.5)}px`,
                    height: `${(thumbWidth * this.props.scaleValueObject.aspectRatioInv) + (Math.max(1, this.props.scaleValueObject.newThumbMargin * 2))}px`,
                    top: (Math.max(1, this.props.scaleValueObject.newThumbMargin * -1.0)),
                    left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
                    right: `${showAfterController ? 0 : undefined}`,
                    display: 'block',
                    transform: `translateX(${Math.max(1, this.props.scaleValueObject.newThumbMargin) * (showAfterController ? 1.25 : -1.25)}px)`,
                  }}
                />
              }
              {(showBeforeController || showAfterController) && (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) &&
                <div
                  data-tid={`insertThumb${(!showAfterController && showBeforeController) ? 'Before' : 'After'}Div_${this.state.controllersVisible}`}
                  style={{
                    zIndex: 100,
                    content: '',
                    backgroundColor: '#FF5006',
                    position: 'absolute',
                    width: `${Math.max(1, this.props.scaleValueObject.newThumbMargin * 0.5)}px`,
                    height: `${thumbWidth * this.props.scaleValueObject.aspectRatioInv}px`,
                    // top: (Math.max(1, this.props.scaleValueObject.newThumbMargin * -1.0)),
                    left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
                    right: `${showAfterController ? 0 : undefined}`,
                    display: 'block',
                    transform: `translateX(${Math.max(1, this.props.scaleValueObject.newThumbMargin) * (showAfterController ? 1.25 : -1.25)}px)`,
                  }}
                />
              }
            </div>
          </div>
        }
      </div>
    );
  }
}

ThumbGrid.defaultProps = {
  selectedThumbId: undefined,
  thumbs: [],
  thumbsToDim: [],
  file: {}
};

ThumbGrid.propTypes = {
  colorArray: PropTypes.array.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    path: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    fps: PropTypes.number,
  }),
  inputRefThumb: PropTypes.object.isRequired,
  keyObject: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onForwardClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired,
  onThumbDoubleClick: PropTypes.func,
  onScrubClick: PropTypes.func.isRequired,
  onAddThumbClick: PropTypes.func.isRequired,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbId: PropTypes.string,
  settings: PropTypes.object.isRequired,
  defaultView: PropTypes.string.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  thumbImages: PropTypes.object,
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
  thumbsToDim: PropTypes.array,
};

const SortableThumbGrid = SortableContainer(ThumbGrid);

export default SortableThumbGrid;
