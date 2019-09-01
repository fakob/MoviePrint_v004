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
  getInvertedThumbs,
  mapRange,
  getThumbInfoValue,
  formatBytes,
  frameCountToTimeCode,
  getFrameInPercentage,
  getLowestFrame,
  getHighestFrame,
  getAllFrameNumbers,
  roundNumber,
} from '../utils/utils';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  MINIMUM_WIDTH_TO_SHRINK_HOVER,
  MINIMUM_WIDTH_TO_SHOW_HOVER,
  SHEET_TYPE,
  SHEET_VIEW,
  VIEW,
  VIDEOPLAYER_THUMB_MARGIN,
} from '../utils/constants';

const SortableThumb = SortableElement(Thumb);

const over = (e) => {
  // console.log('over');
  e.stopPropagation();
  e.target.style.opacity = 1;
}

const out = (e) => {
  // console.log('out');
  e.stopPropagation();
  e.target.style.opacity = 0.2;
}

class ThumbGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      thumbsToDim: [],
      controllersVisible: undefined,
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
      hoverPos: undefined,
    };

    // this.thumbGridDivRef = null;
    this.thumbGridBodyDivRef = null;

    // this.setThumbGridDivRef = element => {
    //   this.thumbGridDivRef = element;
    // }

    this.setThumbGridBodyDivRef = element => {
      this.thumbGridBodyDivRef = element;
    }

    this.resetHover = this.resetHover.bind(this);
    this.onContainerOut = this.onContainerOut.bind(this);
    this.onExpand = this.onExpand.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onSaveThumb = this.onSaveThumb.bind(this);
    this.onInPoint = this.onInPoint.bind(this);
    this.onOutPoint = this.onOutPoint.bind(this);
    this.onHideBefore = this.onHideBefore.bind(this);
    this.onHideAfter = this.onHideAfter.bind(this);
    this.onHoverExpand = this.onHoverExpand.bind(this);
    this.onHoverInPoint = this.onHoverInPoint.bind(this);
    this.onHoverOutPoint = this.onHoverOutPoint.bind(this);
    this.onLeaveInOut = this.onLeaveInOut.bind(this);
    this.onScrub = this.onScrub.bind(this);
    this.onAddBefore = this.onAddBefore.bind(this);
    this.onAddAfter = this.onAddAfter.bind(this);
    this.onJumpToCutBefore = this.onJumpToCutBefore.bind(this);
    this.onJumpToCutAfter = this.onJumpToCutAfter.bind(this);
    this.onBack = this.onBack.bind(this);
    this.onForward = this.onForward.bind(this);
    this.onHoverAddThumbBefore = this.onHoverAddThumbBefore.bind(this);
    this.onHoverAddThumbAfter = this.onHoverAddThumbAfter.bind(this);
    this.onLeaveAddThumb = this.onLeaveAddThumb.bind(this);
  }

  // componentWillMount() {
  // }

  // componentDidMount() {
  // }

  // componentWillReceiveProps(nextProps) {
  // }

  // componentDidUpdate(prevProps) {
  // }

  resetHover() {
    this.setState({
      thumbsToDim: [],
      controllersVisible: undefined,
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
      hoverPos: undefined,
    });
  }

  onContainerOut() {
    // console.log('onContainerOut');
    // e.stopPropagation();
    this.resetHover();
  }

  onExpand(e) {
    // console.log('onExpand');
    const { currentSheetId, file, onExpandClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onExpandClick(file, thumb.thumbId, currentSheetId);
    this.resetHover();
  }

  onToggle(e) {
    // console.log('onToggle');
    const { file, onToggleClick } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    onToggleClick(file.id, controllersVisible);
    this.resetHover();
  }

  onSaveThumb(e) {
    // console.log('onSaveThumb');
    const { file, onSaveThumbClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onSaveThumbClick(file.path, file.useRatio, file.name, thumb.frameNumber, thumb.frameId, file.transformObject);
    // this.resetHover();
  }

  onInPoint(e) {
    // console.log('onInPoint');
    const { file, onInPointClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onInPointClick(file, thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onOutPoint(e) {
    // console.log('onOutPoint');
    const { file, onOutPointClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onOutPointClick(file, thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onHideBefore(e) {
    // console.log('onHideBefore');
    const { currentSheetId, file, onHideBeforeAfterClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    const previousThumbs = getPreviousThumbs(thumbs, thumb.thumbId);
    const previousThumbIds = previousThumbs.map(t => t.thumbId);
    onHideBeforeAfterClick(file.id, currentSheetId, previousThumbIds);
    this.resetHover();
  }

  onHideAfter(e) {
    // console.log('onHideAfter');
    const { currentSheetId, file, onHideBeforeAfterClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    const previousThumbs = getNextThumbs(thumbs, thumb.thumbId);
    const previousThumbIds = previousThumbs.map(t => t.thumbId);
    onHideBeforeAfterClick(file.id, currentSheetId, previousThumbIds);
    this.resetHover();
  }

  onBack(e) {
    // console.log('onBack');
    const { file, onBackClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onBackClick(file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onForward(e) {
    // console.log('onForward');
    const { file, onForwardClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onForwardClick(file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onHoverExpand(e) {
    // console.log('onHoverInPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getInvertedThumbs(thumbs, controllersVisible)
    });
  }

  onHoverInPoint(e) {
    // console.log('onHoverInPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getPreviousThumbs(thumbs, controllersVisible)
    });
  }

  onHoverOutPoint(e) {
    // console.log('onHoverOutPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getNextThumbs(thumbs, controllersVisible)
    });
  }

  onLeaveInOut(e) {
    // console.log('onLeaveInOut');
    e.target.style.opacity = 0.2;
    e.stopPropagation();
    this.setState({
      thumbsToDim: []
    });
  }

  onScrub(e, triggerTime) {
    // console.log('onScrub');
    // for the scrub window the user has to click and drag while keeping the mouse pressed
    // use triggerTime to keep scrub window open if users just click and release the mouse within 1000ms
    const { file, onScrubClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onScrubClick(file, thumb, triggerTime);
    this.resetHover();
  }

  onAddBefore(e) {
    // console.log('onAddBefore');
    const { file, onAddThumbClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onAddThumbClick(file, thumb, 'before');
    this.resetHover();
  }

  onAddAfter(e) {
    // console.log('onAddAfter');
    const { file, onAddThumbClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onAddThumbClick(file, thumb, 'after');
    this.resetHover();
  }

  onJumpToCutBefore(e) {
    // console.log('onJumpToCutBefore');
    const { file, onJumpToCutThumbClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onJumpToCutThumbClick(file, thumb.thumbId, 'before');
    this.resetHover();
  }

  onJumpToCutAfter(e) {
    // console.log('onJumpToCutAfter');
    const { file, onJumpToCutThumbClick, thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    const thumb = thumbs.find(item => item.thumbId === controllersVisible);
    onJumpToCutThumbClick(file, thumb.thumbId, 'after');
    this.resetHover();
  }

  onHoverAddThumbBefore(e) {
    // console.log('onHoverAddThumbBefore');
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbBeforeController: controllersVisible,
    });
  }

  onHoverAddThumbAfter(e) {
    // console.log('onHoverAddThumbAfter');
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbAfterController: controllersVisible,
    });
  }

  onLeaveAddThumb(e) {
    // console.log('onLeaveAddThumb');
    e.target.style.opacity = 0.2;
    e.stopPropagation();
    this.setState({
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
    });
  }

  render() {
    const {
      defaultShowDetailsInHeader,
      defaultShowHeader,
      defaultShowImages,
      defaultShowPathInHeader,
      defaultShowTimelineInHeader,
      defaultThumbInfo,
      defaultThumbInfoRatio,
      emptyColorsArray,
      file,
      inputRefThumb,
      isSorting,
      isViewForPrinting,
      keyObject,
      moviePrintWidth,
      objectUrlObjects,
      onSelectClick,
      onThumbDoubleClick,
      scaleValueObject,
      selectedThumbsArray,
      sheetType,
      sheetView,
      showSettings,
      thumbCount,
      thumbs,
      useBase64,
      view,
    } = this.props;
    const {
      addThumbAfterController,
      addThumbBeforeController,
      controllersVisible,
      hoverPos,
      thumbsToDim,
    } = this.state;

    const isPlayerView = view !== VIEW.STANDARDVIEW;


    const fps = (file !== undefined && file.fps !== undefined ? file.fps : 25);
    const fileDetails = file ? `${frameCountToTimeCode(file.frameCount, fps)} | ${roundNumber(fps)} FPS | ${file.width} × ${file.height} | ${formatBytes(file.size, 1)} | ${file.fourCC}` : '';
// 00:06:48:12 (9789 frames) | 23.99 FPS | 1280 x 720 | 39.2 MB
    let thumbArray = thumbs;

    // calculate in and outpoint for the timeline in percent
    const inPoint = getLowestFrame(thumbs);
    const outPoint = getHighestFrame(thumbs);
    const inPointPositionOnTimeline = getFrameInPercentage(inPoint, file.frameCount);
    const outPointPositionOnTimeline = getFrameInPercentage(outPoint, file.frameCount);
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );
    const allFrameNumbersArray = getAllFrameNumbers(thumbs);
    const allFrameNumbersInPercentArray = allFrameNumbersArray
      .map(frameNumber => getFrameInPercentage(frameNumber, file.frameCount));

    if (showSettings || thumbs.length === 0) {
      const tempArrayLength = thumbCount;
      thumbArray = Array(tempArrayLength);

      for (let i = 0; i < tempArrayLength; i += 1) {
        const mappedIterator = mapRange(
          i,
          0, tempArrayLength - 1,
          0, (thumbs !== undefined ? thumbs.length : tempArrayLength) - 1
        );
        let tempThumbObject = {
          id: String(mappedIterator),
        };
        if (thumbs.length === 0) {
          tempThumbObject = {
            index: i,
          };
        } else if (thumbs.length === tempArrayLength) {
          tempThumbObject = thumbs[i];
        } else {
          if ((objectUrlObjects !== undefined) &&
            (i === 0 || i === (tempArrayLength - 1))
          ) {
            tempThumbObject = thumbs[mappedIterator];
          } else {
            tempThumbObject.transparentThumb = true; // set this to control displaying a thumb image or a color
          }
          tempThumbObject.index = i;
        }
        thumbArray[i] = tempThumbObject;
      }
    }
    const thumbWidth = scaleValueObject.newThumbWidth;

    const hoverThumbIndex = thumbArray.findIndex(thumb => thumb.thumbId === controllersVisible);
    const isHidden = hoverThumbIndex !== -1 ? thumbArray[hoverThumbIndex].hidden : undefined;

    const parentPos = this.thumbGridBodyDivRef !== null ?
      this.thumbGridBodyDivRef.getBoundingClientRect() :
      {
        left: 0,
        top: 0,
      };
    // console.log(hoverPos);
    // console.log(parentPos);

    const showBeforeController = (controllersVisible === addThumbBeforeController);
    const showAfterController = (controllersVisible === addThumbAfterController);

    const thumbMarginGridView = isPlayerView ? VIDEOPLAYER_THUMB_MARGIN : scaleValueObject.newThumbMargin;

    return (
      <div
        data-tid='thumbGridDiv'
        className={styles.grid}
        style={{
          width: moviePrintWidth,
          // paddingLeft: isPlayerView ? '48px' : undefined,
        }}
        id="ThumbGrid"
        onMouseLeave={this.onContainerOut}
        // ref={this.setThumbGridDivRef}
      >
        {!isPlayerView && defaultShowHeader && sheetView === SHEET_VIEW.GRIDVIEW &&
          <ThumbGridHeader
            isViewForPrinting={isViewForPrinting}
            fileName={file.name || ''}
            filePath={file.path || ''}
            fileDetails={fileDetails}
            showPathInHeader={defaultShowPathInHeader}
            showDetailsInHeader={defaultShowDetailsInHeader}
            showTimelineInHeader={defaultShowTimelineInHeader}
            moviePrintWidth={moviePrintWidth}
            headerHeight={scaleValueObject.newHeaderHeight}
            logoHeight={scaleValueObject.newLogoHeight}
            thumbMargin={thumbMarginGridView}
            inPointPositionOnTimeline={inPointPositionOnTimeline}
            cutWidthOnTimeLine={cutWidthOnTimeLine}
            allFrameNumbersInPercentArray={allFrameNumbersInPercentArray}
          />
        }
        <div
          data-tid='thumbGridBodyDiv'
          ref={this.setThumbGridBodyDivRef}
        >
          {thumbArray.map(thumb => (
            <SortableThumb
              sheetView={sheetView}
              sheetType={sheetType}
              view={view}
              keyObject={keyObject}
              key={thumb.thumbId || uuidV4()}
              thumbId={thumb.thumbId}
              index={thumb.index}
              indexForId={thumb.index}
              dim={(thumbsToDim.find((thumbToDim) => thumbToDim.thumbId === thumb.thumbId))}
              inputRefThumb={(selectedThumbsArray.length !== 0 && selectedThumbsArray[0].thumbId === thumb.thumbId) ?
                inputRefThumb : undefined} // for the thumb scrollIntoView function
              color={ // use thumb color, else emptyColor
                thumb.colorArray !== undefined ?
                `#${((1 << 24) + (Math.round(thumb.colorArray[0]) << 16) + (Math.round(thumb.colorArray[1]) << 8) + Math.round(thumb.colorArray[2])).toString(16).slice(1)}` :
                (emptyColorsArray !== undefined ? emptyColorsArray[thumb.index] : undefined)}
              thumbImageObjectUrl={ // used for data stored in IndexedDB
                ((useBase64 === undefined && objectUrlObjects !== undefined) ? objectUrlObjects[thumb.frameId] : undefined)
              }
              base64={ // used for live captured data when saving movieprint
                ((useBase64 !== undefined && objectUrlObjects !== undefined) ? objectUrlObjects[thumb.frameId] : undefined)
              }
              transparentThumb={!defaultShowImages || thumb.transparentThumb || undefined}
              aspectRatioInv={scaleValueObject.aspectRatioInv}
              thumbWidth={thumbWidth}
              borderRadius={scaleValueObject.newBorderRadius}
              margin={thumbMarginGridView}
              thumbInfoValue={getThumbInfoValue(defaultThumbInfo, thumb.frameNumber, fps)}
              thumbInfoRatio={defaultThumbInfoRatio}
              hidden={thumb.hidden}
              controllersAreVisible={(thumb.thumbId === undefined) ? false : (thumb.thumbId === controllersVisible)}
              selected={selectedThumbsArray.length !== 0 ?
                selectedThumbsArray.some(item => item.thumbId === thumb.thumbId) :
                false
              }
              onOver={(event) => {
                // console.log('onOver from Thumb');
                // only setState if controllersVisible has changed
                // console.log(event.target.getBoundingClientRect());
                const hoverPosition = event.target.getBoundingClientRect();
                // event.stopPropagation();
                if (controllersVisible !== thumb.thumbId) {
                  this.setState({
                    controllersVisible: thumb.thumbId,
                    hoverPos: hoverPosition,
                  });
                }
              }}
              onOut={(event) => {
                // console.log('onOut from Thumb');
                // this.resetHover();
                // only setState if controllersVisible has changed
                // console.log(event.target.getBoundingClientRect());
                // const hoverPos = event.target.getBoundingClientRect();
                // event.stopPropagation();
                // if (controllersVisible !== thumb.thumbId) {
                //   this.resetHover();
                // }
              }}
              onThumbDoubleClick={onThumbDoubleClick}
              onSelect={(thumb.thumbId !== controllersVisible) ?
                null : () => {
                  onSelectClick(thumb.thumbId, thumb.frameNumber);
                }}
            />))}
        </div>
        {!isSorting && // only show when not sorting
        hoverPos !== undefined && // only show when hoveringOver a thumb
        // !this.props.showSettings && // only show when not showSettings
          <div
            className={styles.overlayContainer}
            // onMouseOut={this.onContainerOut}
          >
          <div
            className={styles.overlay}
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              left: hoverPos.left - parentPos.left,
              top: hoverPos.top - parentPos.top,
              width: `${thumbWidth}px`,
              height: `${(thumbWidth * scaleValueObject.aspectRatioInv)}px`,
            }}
          >
              <Popup
                trigger={
                  <button
                    data-tid={`ExpandThumbBtn_${controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayExit} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onExpand}
                    onMouseOver={this.onHoverExpand}
                    onMouseOut={this.onLeaveInOut}
                    onFocus={over}
                    onBlur={out}
                  >
                    EXPAND
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position='bottom center'
                className={stylesPop.popup}
                content="Create a new MoviePrint for this scene"
              />
              <Popup
                trigger={
                  <button
                    data-tid={`${isHidden ? 'show' : 'hide'}ThumbBtn_${controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayHide} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onToggle}
                    onMouseOver={over}
                    onMouseOut={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {isHidden ? 'SHOW' : 'HIDE'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position='bottom center'
                className={stylesPop.popup}
                content="Hide thumb"
              />
              <Popup
                trigger={
                  <button
                    data-tid={`saveThumbBtn_${controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlaySave} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onSaveThumb}
                    onMouseOver={over}
                    onMouseOut={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    SAVE
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position='bottom center'
                className={stylesPop.popup}
                content="Save thumb"
              />
              {!isHidden &&
                <div>
                  {sheetType === SHEET_TYPE.INTERVAL && <Popup
                    trigger={
                      <button
                        data-tid={`setInPointBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayIn} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onInPoint}
                        onMouseOver={this.onHoverInPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={over}
                        onBlur={out}
                      >
                        IN
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={<span>Set this thumb as new <mark>IN-point</mark></span>}
                  />}
                  {sheetType === SHEET_TYPE.SCENES && <Popup
                    trigger={
                      <button
                        data-tid={`hideBeforeBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayIn} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onHideBefore}
                        onMouseOver={this.onHoverInPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={over}
                        onBlur={out}
                      >
                        IN
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={<span>Hide all thumbs before</span>}
                  />}
                  <Popup
                    trigger={
                      <button
                        data-tid={`addNewThumbBeforeBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddBefore} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={sheetType === SHEET_TYPE.SCENES ? this.onJumpToCutBefore : this.onAddBefore}
                        onMouseOver={this.onHoverAddThumbBefore}
                        onMouseOut={this.onLeaveAddThumb}
                        onFocus={over}
                        onBlur={out}
                      >
                        {sheetType === SHEET_TYPE.SCENES ? '||' : '+'}
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={sheetType === SHEET_TYPE.SCENES ? (<span>Jump to cut</span>) : (<span>Add new thumb before</span>)}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`scrubBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayScrub} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onMouseDown={(e) => this.onScrub(e, Date.now())}
                        onMouseOver={over}
                        onMouseOut={out}
                        onFocus={over}
                        onBlur={out}
                      >
                        {'<|>'}
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={<span>Click and drag left and right to change the frame (then with <mark>SHIFT</mark> add new thumb before, <mark>ALT</mark> add new thumb after, <mark>CTRL</mark> allow dragging over whole movie)</span>}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`addNewThumbAfterBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddAfter} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={sheetType === SHEET_TYPE.SCENES ? this.onJumpToCutAfter : this.onAddAfter}
                        onMouseOver={this.onHoverAddThumbAfter}
                        onMouseOut={this.onLeaveAddThumb}
                        onFocus={over}
                        onBlur={out}
                      >
                        {sheetType === SHEET_TYPE.SCENES ? '||' : '+'}
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={sheetType === SHEET_TYPE.SCENES ? (<span>Jump to cut</span>) : (<span>Add new thumb after</span>)}
                  />
                  {sheetType === SHEET_TYPE.SCENES && <Popup
                    trigger={
                      <button
                        data-tid={`hideAfterBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayOut} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onHideAfter}
                        onMouseOver={this.onHoverOutPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={over}
                        onBlur={out}
                      >
                        OUT
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={<span>Hide all thumbs after</span>}
                  />}
                  {sheetType === SHEET_TYPE.INTERVAL && <Popup
                    trigger={
                      <button
                        data-tid={`setOutPointBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayOut} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onOutPoint}
                        onMouseOver={this.onHoverOutPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={over}
                        onBlur={out}
                      >
                        OUT
                      </button>
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='bottom center'
                    className={stylesPop.popup}
                    content={<span>Set this thumb as new <mark>OUT-point</mark></span>}
                  />}
                </div>
              }
              {sheetType !== SHEET_TYPE.SCENES && (showBeforeController || showAfterController) && (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) &&
                <div
                  data-tid={`insertThumb${(!showAfterController && showBeforeController) ? 'Before' : 'After'}Div_${controllersVisible}`}
                  style={{
                    zIndex: 100,
                    content: '',
                    backgroundColor: '#FF5006',
                    position: 'absolute',
                    width: `${Math.max(1, thumbMarginGridView * 0.5)}px`,
                    height: `${thumbWidth * scaleValueObject.aspectRatioInv}px`,
                    // top: (Math.max(1, thumbMarginGridView * -1.0)),
                    left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
                    right: `${showAfterController ? 0 : undefined}`,
                    display: 'block',
                    transform: `translateX(${Math.max(1, thumbMarginGridView) * (showAfterController ? 1.25 : -1.25)}px)`,
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
  selectedThumbsArray: [],
  thumbs: [],
  file: {},
  useBase64: undefined,
};

ThumbGrid.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    path: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    fps: PropTypes.number,
  }),
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
  currentSheetId: PropTypes.string.isRequired,
  defaultShowDetailsInHeader: PropTypes.bool,
  defaultShowHeader: PropTypes.bool,
  defaultShowImages: PropTypes.bool,
  defaultShowPathInHeader: PropTypes.bool,
  defaultShowTimelineInHeader: PropTypes.bool,
  defaultThumbInfo: PropTypes.string,
  defaultThumbInfoRatio: PropTypes.number,
  emptyColorsArray: PropTypes.array.isRequired,
  inputRefThumb: PropTypes.object.isRequired,
  isSorting: PropTypes.bool.isRequired,
  isViewForPrinting: PropTypes.bool.isRequired,
  keyObject: PropTypes.object.isRequired,
  moviePrintWidth: PropTypes.number.isRequired,
  objectUrlObjects: PropTypes.object,
  onAddThumbClick: PropTypes.func.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func.isRequired,
  onForwardClick: PropTypes.func.isRequired,
  onHideBeforeAfterClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onJumpToCutThumbClick: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onScrubClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbsArray: PropTypes.array,
  sheetType: PropTypes.string.isRequired,
  sheetView: PropTypes.string.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  useBase64: PropTypes.bool,
  view: PropTypes.string.isRequired,
};

const SortableThumbGrid = SortableContainer(ThumbGrid);

export default SortableThumbGrid;
