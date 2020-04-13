/* eslint no-nested-ternary: "off" */
/* eslint no-bitwise: "off" */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import Thumb from './Thumb';
import AllFaces from './AllFaces';
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
  DEFAULT_FRAMEINFO_BACKGROUND_COLOR,
  DEFAULT_FRAMEINFO_COLOR,
  DEFAULT_FRAMEINFO_MARGIN,
  DEFAULT_FRAMEINFO_POSITION,
  DEFAULT_FRAMEINFO_SCALE,
  DEFAULT_SHOW_FACERECT,
  FILTER_METHOD,
  MINIMUM_WIDTH_TO_SHOW_HOVER,
  MINIMUM_WIDTH_TO_SHRINK_HOVER,
  SHEET_TYPE,
  SHEET_VIEW,
  TIMELINE_SCENE_MINIMUM_WIDTH,
  VIDEOPLAYER_THUMB_MARGIN,
  VIEW,
} from '../utils/constants';

const SortableThumb = SortableElement(Thumb);

const over = e => {
  // console.log('over');
  e.stopPropagation();
  e.target.style.opacity = 1;
};

const out = e => {
  // console.log('out');
  e.stopPropagation();
  e.target.style.opacity = 0.2;
};

class ThumbGrid extends Component {
  constructor(props) {
    super(props);

    // stores all thumb refs in an object
    this.thumbsRef = {};

    // is set when the count has changed and used
    // to trigger getting new refs on next componentDidUpdate
    this.countHasChanged = false;

    this.state = {
      thumbsToDim: [],
      controllersVisible: undefined,
      currentThumb: undefined,
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
    };

    this.resetDim = this.resetDim.bind(this);
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

  componentDidUpdate(prevProps) {
    const { moviePrintWidth, sheetView, thumbs } = this.props;
    const { hoverPos } = this.state;
    const prevThumbArraySize = prevProps.thumbs.length;
    const currentThumbArraySize = thumbs.length;

    if (this.countHasChanged) {
      if (hoverPos !== undefined) {
        const x = hoverPos.left - 10;
        const y = hoverPos.top - 10;

        let newClientRect;
        // console.log(Object.keys(this.thumbsRef).length)
        const foundThumbId = Object.keys(this.thumbsRef).find(thumbId => {
          newClientRect = this.thumbsRef[thumbId].ref.node.getBoundingClientRect();
          // console.log(newClientRect);
          return newClientRect.y > y && newClientRect.x > x;
        });
        // console.log(foundThumbId);
        // console.log(thumbs[foundThumbId]);

        if (foundThumbId === undefined) {
          newClientRect = undefined;
        }

        let currentThumb;
        if (foundThumbId !== undefined) {
          currentThumb = thumbs.find(thumb => thumb.thumbId === foundThumbId);
          console.log(currentThumb);
        }

        this.setState({
          controllersVisible: foundThumbId,
          currentThumb,
          addThumbBeforeController: undefined,
          addThumbAfterController: undefined,
          hoverPos: newClientRect,
        });
      }
      this.countHasChanged = false;
    }

    // when count has changed clear thumbsRef object and set countHasChanged
    // to trigger getting new refs on next componentDidUpdate
    if (prevThumbArraySize !== currentThumbArraySize) {
      this.countHasChanged = true;
      this.thumbsRef = {};
      // console.log('countHasChanged');
    }

    // resetHover on moviePrintWidth and view change
    if (prevProps.moviePrintWidth !== moviePrintWidth || prevProps.sheetView !== sheetView) {
      this.resetHover();
    }
  }

  resetDim() {
    this.setState({
      thumbsToDim: [],
    });
  }

  resetHover() {
    this.setState({
      controllersVisible: undefined,
      currentThumb: undefined,
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
    const { currentSheetId, file, onExpandClick, sheetType } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onExpandClick(file, currentThumb.thumbId, currentSheetId, sheetType);
    this.resetDim();
  }

  onToggle(e) {
    // console.log('onToggle');
    const { file, onToggleClick } = this.props;
    const { controllersVisible } = this.state;

    e.stopPropagation();
    onToggleClick(file.id, controllersVisible);
  }

  onSaveThumb(e) {
    // console.log('onSaveThumb');
    const { file, onSaveThumbClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onSaveThumbClick(
      file.path,
      file.useRatio,
      file.name,
      currentThumb.frameNumber,
      currentThumb.frameId,
      file.transformObject,
    );
    // this.resetHover();
  }

  onInPoint(e) {
    // console.log('onInPoint');
    const { file, onInPointClick, thumbs } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onInPointClick(file, thumbs, currentThumb.thumbId, currentThumb.frameNumber);
    this.resetDim();
  }

  onOutPoint(e) {
    // console.log('onOutPoint');
    const { file, onOutPointClick, thumbs } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onOutPointClick(file, thumbs, currentThumb.thumbId, currentThumb.frameNumber);
    this.resetDim();
  }

  onHideBefore(e) {
    // console.log('onHideBefore');
    const { currentSheetId, file, onHideBeforeAfterClick, thumbs } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    const previousThumbs = getPreviousThumbs(thumbs, currentThumb.thumbId);
    const previousThumbIds = previousThumbs.map(t => t.thumbId);
    onHideBeforeAfterClick(file.id, currentSheetId, previousThumbIds);
    this.resetDim();
  }

  onHideAfter(e) {
    // console.log('onHideAfter');
    const { currentSheetId, file, onHideBeforeAfterClick, thumbs } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    const previousThumbs = getNextThumbs(thumbs, currentThumb.thumbId);
    const previousThumbIds = previousThumbs.map(t => t.thumbId);
    onHideBeforeAfterClick(file.id, currentSheetId, previousThumbIds);
    this.resetDim();
  }

  onBack(e) {
    // console.log('onBack');
    const { file, onBackClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onBackClick(file, currentThumb.thumbId, currentThumb.frameNumber);
  }

  onForward(e) {
    // console.log('onForward');
    const { file, onForwardClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onForwardClick(file, currentThumb.thumbId, currentThumb.frameNumber);
  }

  onHoverExpand(e) {
    // console.log('onHoverInPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getInvertedThumbs(thumbs, controllersVisible),
    });
  }

  onHoverInPoint(e) {
    // console.log('onHoverInPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getPreviousThumbs(thumbs, controllersVisible),
    });
  }

  onHoverOutPoint(e) {
    // console.log('onHoverOutPoint');
    const { thumbs } = this.props;
    const { controllersVisible } = this.state;

    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getNextThumbs(thumbs, controllersVisible),
    });
  }

  onLeaveInOut(e) {
    // console.log('onLeaveInOut');
    e.target.style.opacity = 0.2;
    e.stopPropagation();
    this.setState({
      thumbsToDim: [],
    });
  }

  onScrub(e, triggerTime) {
    // console.log('onScrub');
    // for the scrub window the user has to click and drag while keeping the mouse pressed
    // use triggerTime to keep scrub window open if users just click and release the mouse within 1000ms
    const { file, onScrubClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onScrubClick(file, currentThumb, triggerTime);
  }

  onAddBefore(e) {
    // console.log('onAddBefore');
    const { file, onAddThumbClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onAddThumbClick(file, currentThumb, 'before');
  }

  onAddAfter(e) {
    // console.log('onAddAfter');
    const { file, onAddThumbClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onAddThumbClick(file, currentThumb, 'after');
  }

  onJumpToCutBefore(e) {
    // console.log('onJumpToCutBefore');
    const { file, onJumpToCutThumbClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onJumpToCutThumbClick(file, currentThumb.thumbId, 'before');
  }

  onJumpToCutAfter(e) {
    // console.log('onJumpToCutAfter');
    const { file, onJumpToCutThumbClick } = this.props;
    const { currentThumb } = this.state;

    e.stopPropagation();
    onJumpToCutThumbClick(file, currentThumb.thumbId, 'after');
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
      ageFilterEnabled,
      uniqueFilterEnabled,
      faceCountFilterEnabled,
      faceOccurrenceFilterEnabled,
      sizeFilterEnabled,
      genderFilterEnabled,
      isExpanded,
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
      settings,
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
      currentThumb,
      hoverPos,
      thumbsToDim,
    } = this.state;

    let currentFaceArray;
    if (currentThumb !== undefined) {
      currentFaceArray = currentThumb.facesArray;
    }

    const isPlayerView = view !== VIEW.STANDARDVIEW;
    const isIntervalType = sheetType === SHEET_TYPE.INTERVAL;
    const isShotType = sheetType === SHEET_TYPE.SCENES;
    const isFaceType = sheetType === SHEET_TYPE.FACES;

    const isAltKey = keyObject.altKey;

    const {
      defaultFrameinfoBackgroundColor = DEFAULT_FRAMEINFO_BACKGROUND_COLOR,
      defaultFrameinfoColor = DEFAULT_FRAMEINFO_COLOR,
      defaultFrameinfoPosition = DEFAULT_FRAMEINFO_POSITION,
      defaultFrameinfoScale = DEFAULT_FRAMEINFO_SCALE,
      defaultFrameinfoMargin = DEFAULT_FRAMEINFO_MARGIN,
      defaultShowFaceRect = DEFAULT_SHOW_FACERECT,
    } = settings;
    const frameinfoBackgroundColorString = `rgba(${defaultFrameinfoBackgroundColor.r}, ${defaultFrameinfoBackgroundColor.g}, ${defaultFrameinfoBackgroundColor.b}, ${defaultFrameinfoBackgroundColor.a})`;
    const frameinfoColorString = `rgba(${defaultFrameinfoColor.r}, ${defaultFrameinfoColor.g}, ${defaultFrameinfoColor.b}, ${defaultFrameinfoColor.a})`;

    const fps = file !== undefined && file.fps !== undefined ? file.fps : 25;
    const fileDetails = file
      ? `${frameCountToTimeCode(file.frameCount, fps)} | ${roundNumber(fps)} FPS | ${file.width} × ${
          file.height
        } | ${formatBytes(file.size, 1)} | ${file.fourCC}`
      : '';
    // 00:06:48:12 (9789 frames) | 23.99 FPS | 1280 x 720 | 39.2 MB
    let thumbArray = thumbs;

    // calculate in and outpoint for the timeline in percent
    const inPoint = getLowestFrame(thumbs);
    const outPoint = getHighestFrame(thumbs);
    const inPointPositionOnTimeline = getFrameInPercentage(inPoint, file.frameCount);
    const outPointPositionOnTimeline = getFrameInPercentage(outPoint, file.frameCount);
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      TIMELINE_SCENE_MINIMUM_WIDTH,
    );
    const allFrameNumbersArray = getAllFrameNumbers(thumbs);
    const allFrameNumbersInPercentArray = allFrameNumbersArray.map(frameNumber =>
      getFrameInPercentage(frameNumber, file.frameCount),
    );

    if (showSettings || thumbs.length === 0) {
      const tempArrayLength = thumbCount;
      thumbArray = Array(tempArrayLength);

      for (let i = 0; i < tempArrayLength; i += 1) {
        const mappedIterator = mapRange(
          i,
          0,
          tempArrayLength - 1,
          0,
          (thumbs !== undefined ? thumbs.length : tempArrayLength) - 1,
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
          if (objectUrlObjects !== undefined && (i === 0 || i === tempArrayLength - 1)) {
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
    const thumbHeight = thumbWidth * scaleValueObject.aspectRatioInv;

    const hoverThumbIndex = thumbArray.findIndex(thumb => thumb.thumbId === controllersVisible);
    const isHidden = hoverThumbIndex !== -1 ? thumbArray[hoverThumbIndex].hidden : undefined;

    const parentPos =
      this.thumbGridBodyDivRef !== null
        ? this.thumbGridBodyDivRef.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
          };
    // console.log(hoverPos);
    // console.log(parentPos);
    // console.log(hoverPos)

    const showBeforeController = controllersVisible === addThumbBeforeController;
    const showAfterController = controllersVisible === addThumbAfterController;

    const thumbMarginGridView = isPlayerView ? VIDEOPLAYER_THUMB_MARGIN : scaleValueObject.newThumbMargin;

    let thumbCSSTranslate;
    if (defaultFrameinfoPosition === 'topCenter' || defaultFrameinfoPosition === 'bottomCenter') {
      thumbCSSTranslate = `translateX(-50%) scale(${(defaultFrameinfoScale *
        0.1 *
        (defaultThumbInfoRatio * thumbWidth * scaleValueObject.aspectRatioInv)) /
        10})`;
    } else if (defaultFrameinfoPosition === 'centerCenter') {
      thumbCSSTranslate = `translate(-50%, -50%) scale(${(defaultFrameinfoScale *
        0.1 *
        (defaultThumbInfoRatio * thumbWidth * scaleValueObject.aspectRatioInv)) /
        10})`;
    } else {
      thumbCSSTranslate = `scale(${(defaultFrameinfoScale *
        0.1 *
        (defaultThumbInfoRatio * thumbWidth * scaleValueObject.aspectRatioInv)) /
        10})`;
    }

    let frameinfoMargin;
    if (defaultFrameinfoPosition === 'topCenter' || defaultFrameinfoPosition === 'bottomCenter') {
      frameinfoMargin = `${defaultFrameinfoMargin}px 0px`;
    } else if (defaultFrameinfoPosition === 'centerCenter') {
      frameinfoMargin = undefined;
    } else {
      frameinfoMargin = `${defaultFrameinfoMargin}px`;
    }

    const margin = `${view === VIEW.STANDARDVIEW ? thumbMarginGridView : Math.max(1, thumbMarginGridView)}px`;

    return (
      <div
        data-tid="thumbGridDiv"
        className={styles.grid}
        style={{
          width: moviePrintWidth,
          // paddingLeft: isPlayerView ? '48px' : undefined,
        }}
        id="ThumbGrid"
        onMouseLeave={this.onContainerOut}
        // ref={this.setThumbGridDivRef}
      >
        {!isPlayerView && defaultShowHeader && sheetView === SHEET_VIEW.GRIDVIEW && (
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
        )}
        <div data-tid="thumbGridBodyDiv" ref={this.setThumbGridBodyDivRef}>
          {thumbArray.map(thumb => (
            <SortableThumb
              ref={ref => (this.thumbsRef[thumb.thumbId] = ref)}
              sheetView={sheetView}
              sheetType={sheetType}
              view={view}
              keyObject={keyObject}
              key={thumb.thumbId || uuidV4()}
              thumbId={thumb.thumbId}
              index={thumb.index}
              indexForId={thumb.index}
              defaultShowFaceRect={defaultShowFaceRect}
              facesArray={thumb.facesArray !== undefined ? thumb.facesArray : undefined}
              dim={thumbsToDim.find(thumbToDim => thumbToDim.thumbId === thumb.thumbId)}
              inputRefThumb={
                selectedThumbsArray.length !== 0 && selectedThumbsArray[0].thumbId === thumb.thumbId
                  ? inputRefThumb
                  : undefined
              } // for the thumb scrollIntoView function
              color={
                // use thumb color, else emptyColor
                thumb.colorArray !== undefined
                  ? `#${(
                      (1 << 24) +
                      (Math.round(thumb.colorArray[0]) << 16) +
                      (Math.round(thumb.colorArray[1]) << 8) +
                      Math.round(thumb.colorArray[2])
                    )
                      .toString(16)
                      .slice(1)}`
                  : emptyColorsArray !== undefined
                  ? emptyColorsArray[thumb.index]
                  : undefined
              }
              thumbImageObjectUrl={
                // used for data stored in IndexedDB
                useBase64 === undefined && objectUrlObjects !== undefined ? objectUrlObjects[thumb.frameId] : undefined
              }
              base64={
                // used for live captured data when saving movieprint
                useBase64 !== undefined && objectUrlObjects !== undefined ? objectUrlObjects[thumb.frameId] : undefined
              }
              transparentThumb={!defaultShowImages || thumb.transparentThumb || undefined}
              thumbWidth={thumbWidth}
              thumbHeight={thumbHeight}
              borderRadius={scaleValueObject.newBorderRadius}
              margin={margin}
              thumbInfoValue={getThumbInfoValue(defaultThumbInfo, thumb.frameNumber, fps)}
              thumbInfoRatio={defaultThumbInfoRatio}
              hidden={thumb.hidden}
              controllersAreVisible={thumb.thumbId === undefined ? false : thumb.thumbId === controllersVisible}
              selected={
                selectedThumbsArray.length !== 0
                  ? selectedThumbsArray.some(item => item.thumbId === thumb.thumbId)
                  : false
              }
              onOver={event => {
                // console.log('onOver from Thumb');
                // only setState if controllersVisible has changed
                // console.log(event.target.getBoundingClientRect());
                const hoverPosition = event.target.getBoundingClientRect();
                // event.stopPropagation();
                if (controllersVisible !== thumb.thumbId) {
                  this.setState({
                    controllersVisible: thumb.thumbId,
                    currentThumb: thumb,
                    hoverPos: hoverPosition,
                  });
                }
              }}
              onOut={event => {
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
              onSelect={
                thumb.thumbId !== controllersVisible
                  ? null
                  : () => {
                      onSelectClick(thumb.thumbId, thumb.frameNumber);
                    }
              }
              frameninfoBackgroundColor={frameinfoBackgroundColorString}
              frameinfoColor={frameinfoColorString}
              frameinfoPosition={defaultFrameinfoPosition}
              frameinfoScale={defaultFrameinfoScale}
              frameinfoMargin={frameinfoMargin}
              thumbCSSTranslate={thumbCSSTranslate}
              ageFilterEnabled={ageFilterEnabled}
              uniqueFilterEnabled={uniqueFilterEnabled}
              faceCountFilterEnabled={faceCountFilterEnabled}
              faceOccurrenceFilterEnabled={faceOccurrenceFilterEnabled}
              sizeFilterEnabled={sizeFilterEnabled}
              genderFilterEnabled={genderFilterEnabled}
              isExpanded={isExpanded}
            />
          ))}
        </div>
        {!isSorting && // only show when not sorting
        hoverPos !== undefined && ( // only show when hoveringOver a thumb
            // !this.props.showSettings && // only show when not showSettings
            <div
              className={styles.overlayContainer}
              // onMouseOut={this.onContainerOut}
            >
              <div
                className={styles.overlay}
                style={{
                  display: thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER ? 'block' : 'none',
                  left: hoverPos.left - parentPos.left,
                  top: hoverPos.top - parentPos.top,
                  width: `${thumbWidth}px`,
                  height: `${thumbWidth * scaleValueObject.aspectRatioInv}px`,
                }}
              >
                {currentThumb !== undefined && currentThumb.facesArray !== undefined && (
                  <AllFaces
                    facesArray={currentFaceArray}
                    thumbWidth={thumbWidth}
                    thumbHeight={thumbHeight}
                    ageFilterEnabled={ageFilterEnabled}
                    uniqueFilterEnabled={uniqueFilterEnabled}
                    faceCountFilterEnabled={faceCountFilterEnabled}
                    faceOccurrenceFilterEnabled={faceOccurrenceFilterEnabled}
                    sizeFilterEnabled={sizeFilterEnabled}
                    genderFilterEnabled={genderFilterEnabled}
                    isExpanded={isExpanded}
                    thumbHover={true}
                  />
                )}
                <Popup
                  trigger={
                    <button
                      data-tid={`ExpandThumbBtn_${controllersVisible}`}
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayExit} ${
                        thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                      }`}
                      onClick={this.onExpand}
                      onMouseOver={this.onHoverExpand}
                      onMouseOut={this.onLeaveInOut}
                      onFocus={over}
                      onBlur={out}
                    >
                      {isFaceType ? 'FIND' : 'EXPAND'}
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="top center"
                  className={stylesPop.popup}
                  content={
                    isFaceType
                      ? 'Create a new MoviePrint of all occurrences of the largest face in this thumb'
                      : 'Create a new MoviePrint using In- and Outpoints of this scene'
                  }
                />
                <Popup
                  trigger={
                    <button
                      data-tid={`${isHidden ? 'show' : 'hide'}ThumbBtn_${controllersVisible}`}
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayHide} ${
                        thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                      }`}
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
                  position="top center"
                  className={stylesPop.popup}
                  content="Hide thumb"
                />
                <Popup
                  trigger={
                    <button
                      data-tid={`saveThumbBtn_${controllersVisible}`}
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.overlaySave} ${
                        thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                      }`}
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
                  position="top center"
                  className={stylesPop.popup}
                  content="Save thumb"
                />
                {!isHidden && (
                  <div>
                    <Popup
                      trigger={
                        <button
                          data-tid={`setInPointBtn_${controllersVisible}`}
                          type="button"
                          className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayIn} ${
                            thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                          }`}
                          onClick={isIntervalType && !isAltKey ? this.onInPoint : this.onHideBefore}
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
                      position="bottom center"
                      className={stylesPop.popup}
                      content={
                        isIntervalType && !isAltKey ? (
                          <span>
                            Set this thumb as new <mark>IN-point</mark> and re-capture in-between thumbs
                            <br />
                            With <mark>ALT</mark> hide all thumbs before
                          </span>
                        ) : (
                          <span>Hide all thumbs before</span>
                        )
                      }
                    />
                    {!isFaceType && (
                      <Popup
                        trigger={
                          <button
                            data-tid={`addNewThumbBeforeBtn_${controllersVisible}`}
                            type="button"
                            className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddBefore} ${
                              thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                            }`}
                            onClick={isShotType ? this.onJumpToCutBefore : this.onAddBefore}
                            onMouseOver={this.onHoverAddThumbBefore}
                            onMouseOut={this.onLeaveAddThumb}
                            onFocus={over}
                            onBlur={out}
                          >
                            {isShotType ? '||' : '+'}
                          </button>
                        }
                        mouseEnterDelay={1000}
                        on={['hover']}
                        position="bottom center"
                        className={stylesPop.popup}
                        content={isShotType ? <span>Jump to cut</span> : <span>Insert new thumb before</span>}
                      />
                    )}
                    {!isFaceType && (
                      <Popup
                        trigger={
                          <button
                            data-tid={`scrubBtn_${controllersVisible}`}
                            type="button"
                            className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayScrub} ${
                              thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                            }`}
                            onMouseDown={e => this.onScrub(e, Date.now())}
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
                        position="bottom center"
                        className={stylesPop.popup}
                        content={
                          <span>
                            Click and drag left and right to change the frame (then with <mark>SHIFT</mark> insert new
                            thumb before, <mark>ALT</mark> insert new thumb after, <mark>CTRL</mark> allow dragging over
                            whole movie)
                          </span>
                        }
                      />
                    )}
                    {!isFaceType && (
                      <Popup
                        trigger={
                          <button
                            data-tid={`addNewThumbAfterBtn_${controllersVisible}`}
                            type="button"
                            className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayAddAfter} ${
                              thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                            }`}
                            onClick={isShotType ? this.onJumpToCutAfter : this.onAddAfter}
                            onMouseOver={this.onHoverAddThumbAfter}
                            onMouseOut={this.onLeaveAddThumb}
                            onFocus={over}
                            onBlur={out}
                          >
                            {isShotType ? '||' : '+'}
                          </button>
                        }
                        mouseEnterDelay={1000}
                        on={['hover']}
                        position="bottom center"
                        className={stylesPop.popup}
                        content={isShotType ? <span>Jump to cut</span> : <span>Insert new thumb after</span>}
                      />
                    )}
                    <Popup
                      trigger={
                        <button
                          data-tid={`setOutPointBtn_${controllersVisible}`}
                          type="button"
                          className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayOut} ${
                            thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER ? styles.overlayShrink : ''
                          }`}
                          onClick={isIntervalType && !isAltKey ? this.onOutPoint : this.onHideAfter}
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
                      position="bottom center"
                      className={stylesPop.popup}
                      content={
                        isIntervalType && !isAltKey ? (
                          <span>
                            Set this thumb as new <mark>OUT-point</mark> and re-capture in-between thumbs
                            <br />
                            With <mark>ALT</mark> hide all thumbs after
                          </span>
                        ) : (
                          <span>Hide all thumbs after</span>
                        )
                      }
                    />
                  </div>
                )}
                {sheetType !== SHEET_TYPE.SCENES &&
                  (showBeforeController || showAfterController) &&
                  thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER && (
                    <div
                      data-tid={`insertThumb${
                        !showAfterController && showBeforeController ? 'Before' : 'After'
                      }Div_${controllersVisible}`}
                      style={{
                        zIndex: 100,
                        content: '',
                        backgroundColor: '#FF5006',
                        position: 'absolute',
                        width: `${Math.max(1, thumbMarginGridView * 0.5)}px`,
                        height: `${thumbWidth * scaleValueObject.aspectRatioInv}px`,
                        // top: (Math.max(1, thumbMarginGridView * -1.0)),
                        left: `${!showAfterController && showBeforeController ? 0 : undefined}`,
                        right: `${showAfterController ? 0 : undefined}`,
                        display: 'block',
                        transform: `translateX(${Math.max(1, thumbMarginGridView) *
                          (showAfterController ? 1.25 : -1.25)}px)`,
                      }}
                    />
                  )}
              </div>
            </div>
          )}
      </div>
    );
  }
}

ThumbGrid.defaultProps = {
  currentSheetId: undefined,
  currentSheetFilter: {},
  file: {},
  selectedThumbsArray: [],
  thumbs: [],
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
  thumbs: PropTypes.arrayOf(
    PropTypes.shape({
      thumbId: PropTypes.string.isRequired,
      index: PropTypes.number.isRequired,
      hidden: PropTypes.bool.isRequired,
      frameNumber: PropTypes.number.isRequired,
    }).isRequired,
  ),
  currentSheetId: PropTypes.string,
  currentSheetFilter: PropTypes.object,
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
