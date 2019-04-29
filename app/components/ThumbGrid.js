// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import stylesApp from '../containers/App.css';
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
  SHEET_TYPE,
  SHEET_VIEW,
  VIEW,
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
    // this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    // this.this.props.onScrubClickWithStop = this.this.props.onScrubClickWithStop.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {
    // console.log(this.thumbGridDivRef);
    // console.log(this.thumbGridDivRef.current);
    // console.log(this.thumbGridDivRef.getBoundingClientRect());
    // console.log(this.thumbGridBodyDivRef);
    // console.log(this.thumbGridBodyDivRef.current);
    // console.log(this.thumbGridBodyDivRef.getBoundingClientRect());
    this.setState({
      parentPos: this.thumbGridBodyDivRef.getBoundingClientRect(),
    })
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidUpdate(prevProps) {
    // console.log('ThumbGrid componentDidUpdate');
    // console.log(this.props.objectUrlObjects);
  }

  over(e) {
    // console.log('over');
    e.stopPropagation();
    e.target.style.opacity = 1;
  }

  out(e) {
    // console.log('out');
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
    // console.log('onContainerOut');
    // e.stopPropagation();
    this.resetHover();
  }

  onExpand(e) {
    // console.log('onExpand');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onExpandClick(this.props.file, thumb.thumbId, this.props.currentSheetId);
    this.resetHover();
  }

  onToggle(e) {
    // console.log('onToggle');
    e.stopPropagation();
    this.props.onToggleClick(this.props.file.id, this.state.controllersVisible);
    this.resetHover();
  }

  onSaveThumb(e) {
    // console.log('onSaveThumb');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onSaveThumbClick(this.props.file.path, this.props.file.useRatio, this.props.file.name, thumb.frameNumber, thumb.frameId, this.props.file.transformObject);
    this.resetHover();
  }

  onInPoint(e) {
    // console.log('onInPoint');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onInPointClick(this.props.file, this.props.thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onOutPoint(e) {
    // console.log('onOutPoint');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onOutPointClick(this.props.file, this.props.thumbs, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onBack(e) {
    // console.log('onBack');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onBackClick(this.props.file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onForward(e) {
    // console.log('onForward');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onForwardClick(this.props.file, thumb.thumbId, thumb.frameNumber);
    this.resetHover();
  }

  onHoverInPoint(e) {
    // console.log('onHoverInPoint');
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getPreviousThumbs(this.props.thumbs, this.state.controllersVisible)
    });
  }

  onHoverOutPoint(e) {
    // console.log('onHoverOutPoint');
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      thumbsToDim: getNextThumbs(this.props.thumbs, this.state.controllersVisible)
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

  onScrub(e) {
    // console.log('onScrub');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onScrubClick(this.props.file, thumb);
    this.resetHover();
  }

  onAddBefore(e) {
    // console.log('onAddBefore');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onAddThumbClick(this.props.file, thumb, 'before');
    this.resetHover();
  }

  onAddAfter(e) {
    // console.log('onAddAfter');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onAddThumbClick(this.props.file, thumb, 'after');
    this.resetHover();
  }

  onJumpToCutBefore(e) {
    // console.log('onJumpToCutBefore');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onJumpToCutThumbClick(this.props.file, thumb.thumbId, 'before');
    this.resetHover();
  }

  onJumpToCutAfter(e) {
    // console.log('onJumpToCutAfter');
    e.stopPropagation();
    const thumb = this.props.thumbs.find(thumb => thumb.thumbId === this.state.controllersVisible);
    this.props.onJumpToCutThumbClick(this.props.file, thumb.thumbId, 'after');
    this.resetHover();
  }

  onHoverAddThumbBefore(e) {
    // console.log('onHoverAddThumbBefore');
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbBeforeController: this.state.controllersVisible,
    });
  }

  onHoverAddThumbAfter(e) {
    // console.log('onHoverAddThumbAfter');
    e.target.style.opacity = 1;
    e.stopPropagation();
    this.setState({
      addThumbAfterController: this.state.controllersVisible,
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
    const { file, isGridView, keyObject, scaleValueObject, settings, sheetType, sheetView, thumbs, view } = this.props;
    const { controllersVisible } = this.state;

    const isPlayerView = view !== VIEW.STANDARDVIEW;


    const fps = (file !== undefined && file.fps !== undefined ? file.fps : 25);
    const fileDetails = file ? `${frameCountToTimeCode(file.frameCount, fps)} | ${roundNumber(fps)} FPS | ${file.width} × ${file.height} | ${formatBytes(file.size, 1)} | ${file.fourCC}` : '';
// 00:06:48:12 (9789 frames) | 23.99 FPS | 1280 x 720 | 39.2 MB
    let thumbArray = thumbs;

    const getFrameInPercentage = (frameNumber, frameCount) => {
      if (frameCount > 1) {
        return (frameNumber / ((frameCount - 1) * 1.0)) * 100.0;
      }
      return 0;
    }

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

    if (this.props.showSettings || thumbs.length === 0) {
      const tempArrayLength = this.props.thumbCount;
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
          if ((this.props.objectUrlObjects !== undefined) &&
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
    // console.log(this.thumbGridDivRef !== null ? this.thumbGridDivRef.getBoundingClientRect() : 'not set yet')
    // this.setState({
    //   parentPos: this.thumbGridDivRef.getBoundingClientRect(),
    // })
    const parentPos = this.thumbGridBodyDivRef !== null ?
      this.thumbGridBodyDivRef.getBoundingClientRect() :
      {
        left: 0,
        top: 0,
      };
    // console.log(this.state.hoverPos);
    // console.log(parentPos);
    console.log(this.props.showMovielist);
    console.log(this.props.showSettings);

    const showBeforeController = (controllersVisible === this.state.addThumbBeforeController);
    const showAfterController = (controllersVisible === this.state.addThumbAfterController);

    return (
      <div
        data-tid='thumbGridDiv'
        className={styles.grid}
        style={{
          width: this.props.moviePrintWidth,
          paddingLeft: isPlayerView ? '48px' : undefined,
        }}
        id="ThumbGrid"
        onMouseLeave={this.onContainerOut}
        // ref={this.setThumbGridDivRef}
      >
        {isPlayerView &&
          sheetType === SHEET_TYPE.SCENES &&
          <Popup
          trigger={
            <button
              type='button'
              className={`${styles.hoverButton} ${styles.textButton} ${styles.sheetTypeSwitchButton} ${this.props.showMovielist ? stylesApp.ItemMainLeftAnim : ''}`}
              onClick={() => this.props.onToggleSheetView(file.id,this.props.currentSheetId)}
              onMouseOver={this.over}
              onMouseLeave={this.out}
              onFocus={this.over}
              onBlur={this.out}
            >
              <Icon
                name="barcode"
              />
            </button>
          }
          className={stylesPop.popup}
          content={<span>Switch to timeline view <mark>G</mark></span>}
        />}
        {!isPlayerView && settings.defaultShowHeader && this.props.sheetView === SHEET_VIEW.GRIDVIEW &&
          <ThumbGridHeader
            viewForPrinting={this.props.viewForPrinting}
            fileName={file.name || ''}
            filePath={file.path || ''}
            fileDetails={fileDetails}
            showPathInHeader={settings.defaultShowPathInHeader}
            showDetailsInHeader={settings.defaultShowDetailsInHeader}
            showTimelineInHeader={settings.defaultShowTimelineInHeader}
            moviePrintWidth={this.props.moviePrintWidth}
            headerHeight={scaleValueObject.newHeaderHeight}
            logoHeight={scaleValueObject.newLogoHeight}
            thumbMargin={scaleValueObject.newThumbMargin}
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
              sheetView={this.props.sheetView}
              sheetType={this.props.sheetType}
              view={this.props.view}
              keyObject={keyObject}
              key={thumb.thumbId || uuidV4()}
              thumbId={thumb.thumbId}
              index={thumb.index}
              indexForId={thumb.index}
              dim={(this.state.thumbsToDim.find((thumbToDim) => thumbToDim.thumbId === thumb.thumbId))}
              inputRefThumb={(this.props.selectedThumbsArray.length !== 0 && this.props.selectedThumbsArray[0].thumbId === thumb.thumbId) ?
                this.props.inputRefThumb : undefined} // for the thumb scrollIntoView function
              color={(this.props.colorArray !== undefined ? this.props.colorArray[thumb.index] : undefined)}
              thumbImageObjectUrl={ // used for data stored in IndexedDB
                ((this.props.useBase64 === undefined && this.props.objectUrlObjects !== undefined) ? this.props.objectUrlObjects[thumb.frameId] : undefined)
              }
              base64={ // used for live captured data when saving movieprint
                ((this.props.useBase64 !== undefined && this.props.objectUrlObjects !== undefined) ? this.props.objectUrlObjects[thumb.frameId] : undefined)
              }
              transparentThumb={thumb.transparentThumb || undefined}
              aspectRatioInv={scaleValueObject.aspectRatioInv}
              thumbWidth={thumbWidth}
              borderRadius={scaleValueObject.newBorderRadius}
              margin={scaleValueObject.newThumbMargin}
              thumbInfoValue={getThumbInfoValue(settings.defaultThumbInfo, thumb.frameNumber, fps)}
              thumbInfoRatio={settings.defaultThumbInfoRatio}
              hidden={thumb.hidden}
              controllersAreVisible={(thumb.thumbId === undefined) ? false : (thumb.thumbId === controllersVisible)}
              selected={this.props.selectedThumbsArray.length !== 0 ?
                this.props.selectedThumbsArray.some(item => item.thumbId === thumb.thumbId) :
                false
              }
              onOver={(event) => {
                // console.log('onOver from Thumb');
                // only setState if controllersVisible has changed
                // console.log(event.target.getBoundingClientRect());
                const hoverPos = event.target.getBoundingClientRect();
                // event.stopPropagation();
                if (controllersVisible !== thumb.thumbId) {
                  this.setState({
                    controllersVisible: thumb.thumbId,
                    hoverPos,
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
              onThumbDoubleClick={this.props.onThumbDoubleClick}
              onSelect={(thumb.thumbId !== controllersVisible) ?
                null : () => {
                  this.props.onSelectClick(thumb.thumbId, thumb.frameNumber);
                }}
              onErrorThumb={() => this.props.onErrorThumb(
                  file,
                  this.props.currentSheetId,
                  thumb.thumbId,
                  thumb.frameId)
                }
            />))}
        </div>
        {!this.props.isSorting && // only show when not sorting
        this.state.hoverPos !== undefined && // only show when hoveringOver a thumb
        // !this.props.showSettings && // only show when not showSettings
          <div
            className={styles.overlayContainer}
            // onMouseOut={this.onContainerOut}
          >
          <div
            className={styles.overlay}
            style={{
              display: (thumbWidth > MINIMUM_WIDTH_TO_SHOW_HOVER) ? 'block' : 'none',
              left: this.state.hoverPos.left - parentPos.left,
              top: this.state.hoverPos.top - parentPos.top,
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
                    onMouseOver={this.over}
                    onMouseOut={this.out}
                    onFocus={this.over}
                    onBlur={this.out}
                  >
                    EXPAND
                  </button>
                }
                className={stylesPop.popup}
                content="Expand scene"
              />
              <Popup
                trigger={
                  <button
                    data-tid={`${isHidden ? 'show' : 'hide'}ThumbBtn_${controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayHide} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onToggle}
                    onMouseOver={this.over}
                    onMouseOut={this.out}
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
                    data-tid={`saveThumbBtn_${controllersVisible}`}
                    type='button'
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.overlaySave} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                    onClick={this.onSaveThumb}
                    onMouseOver={this.over}
                    onMouseOut={this.out}
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
                  {sheetType === SHEET_TYPE.INTERVAL && <Popup
                    trigger={
                      <button
                        data-tid={`setInPointBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayIn} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onInPoint}
                        onMouseOver={this.onHoverInPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        IN
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Set this thumb as new <mark>IN-point</mark></span>}
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
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        {sheetType === SHEET_TYPE.SCENES ? '||' : '+'}
                      </button>
                    }
                    className={stylesPop.popup}
                    content={sheetType === SHEET_TYPE.SCENES ? (<span>Jump to cut</span>) : (<span>Add new thumb before</span>)}
                  />
                  <Popup
                    trigger={
                      <button
                        data-tid={`scrubBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayScrub} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onMouseDown={this.onScrub}
                        onMouseOver={this.over}
                        onMouseOut={this.out}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        {'<|>'}
                      </button>
                    }
                    className={stylesPop.popup}
                    content={<span>Click and drag left and right to change the frame (<mark>SHIFT</mark> add new thumb before, <mark>ALT</mark> add new thumb after, <mark>CTRL</mark> display original as overlay)</span>}
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
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        {sheetType === SHEET_TYPE.SCENES ? '||' : '+'}
                      </button>
                    }
                    className={stylesPop.popup}
                    content={sheetType === SHEET_TYPE.SCENES ? (<span>Jump to cut</span>) : (<span>Add new thumb after</span>)}
                  />
                  {sheetType === SHEET_TYPE.INTERVAL && <Popup
                    trigger={
                      <button
                        data-tid={`setOutPointBtn_${controllersVisible}`}
                        type='button'
                        className={`${styles.hoverButton} ${styles.textButton} ${styles.overlayOut} ${(thumbWidth < MINIMUM_WIDTH_TO_SHRINK_HOVER) ? styles.overlayShrink : ''}`}
                        onClick={this.onOutPoint}
                        onMouseOver={this.onHoverOutPoint}
                        onMouseOut={this.onLeaveInOut}
                        onFocus={this.over}
                        onBlur={this.out}
                      >
                        OUT
                      </button>
                    }
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
                    width: `${Math.max(1, scaleValueObject.newThumbMargin * 0.5)}px`,
                    height: `${thumbWidth * scaleValueObject.aspectRatioInv}px`,
                    // top: (Math.max(1, scaleValueObject.newThumbMargin * -1.0)),
                    left: `${(!showAfterController && showBeforeController) ? 0 : undefined}`,
                    right: `${showAfterController ? 0 : undefined}`,
                    display: 'block',
                    transform: `translateX(${Math.max(1, scaleValueObject.newThumbMargin) * (showAfterController ? 1.25 : -1.25)}px)`,
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
  onJumpToCutThumbClick: PropTypes.func.isRequired,
  onToggleClick: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbsArray: PropTypes.array,
  settings: PropTypes.object.isRequired,
  sheetView: PropTypes.string.isRequired,
  showMovielist: PropTypes.bool.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  objectUrlObjects: PropTypes.object,
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
