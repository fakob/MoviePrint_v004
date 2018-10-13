// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Thumb from './Thumb';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
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
    };

    // this.onScrubMouseMoveWithStop = this.onScrubMouseMoveWithStop.bind(this);
    // this.this.props.onScrubClickWithStop = this.this.props.onScrubClickWithStop.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidUpdate(prevProps) {
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
            key: String(i),
            index: i,
          };
        } else if (this.props.thumbs.length === tempArrayLength) {
          tempThumbObject = this.props.thumbs[i];
        } else {
          if ((this.props.thumbImages !== undefined) &&
            (i === 0 || i === (tempArrayLength - 1))
          ) {
            tempThumbObject = this.props.thumbs[mappedIterator];
          }
          tempThumbObject.key = i;
          tempThumbObject.index = i;
        }
        thumbArray[i] = tempThumbObject;
      }
    }
    return (
      <div
        data-tid='thumbGridDiv'
        className={styles.grid}
        style={{
          width: this.props.viewForPrinting ? this.props.scaleValueObject.newMoviePrintWidthForPrinting : this.props.scaleValueObject.newMoviePrintWidth,
          marginLeft: this.props.showMoviePrintView ? undefined : (this.props.scaleValueObject.newThumbWidth / 4),
        }}
        id="ThumbGrid"
      >
        {this.props.settings.defaultShowHeader && this.props.showMoviePrintView &&
          <ThumbGridHeader
            viewForPrinting={this.props.viewForPrinting}
            showMoviePrintView={this.props.showMoviePrintView}
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
              showMoviePrintView={this.props.showMoviePrintView}
              keyObject={this.props.keyObject}
              key={thumb.thumbId}
              thumbId={thumb.thumbId}
              index={thumb.index}
              indexForId={thumb.index}
              dim={(this.state.thumbsToDim.find((thumbToDim) => thumbToDim.thumbId === thumb.thumbId))}
              inputRefThumb={(this.props.selectedThumbId === thumb.thumbId) ?
                this.props.inputRefThumb : undefined} // for the thumb scrollIntoView function
              color={(this.props.colorArray !== undefined ? this.props.colorArray[thumb.index] : undefined)}
              thumbImageObjectUrl={thumb.thumbImageObjectUrl ||
                getObjectProperty(() => this.props.thumbImages[thumb.frameId].objectUrl)}
              aspectRatioInv={this.props.scaleValueObject.aspectRatioInv}
              thumbWidth={this.props.scaleValueObject.newThumbWidth}
              borderRadius={this.props.scaleValueObject.newBorderRadius}
              margin={this.props.scaleValueObject.newThumbMargin}
              thumbInfoValue={getThumbInfoValue(this.props.settings.defaultThumbInfo, thumb.frameNumber, fps)}
              thumbInfoRatio={this.props.settings.defaultThumbInfoRatio}
              hidden={thumb.hidden}
              showAddThumbBeforeController={this.props.showSettings ? false : (thumb.thumbId === this.state.addThumbBeforeController)}
              showAddThumbAfterController={this.props.showSettings ? false : (thumb.thumbId === this.state.addThumbAfterController)}
              controllersAreVisible={(this.props.showSettings || thumb.thumbId === undefined) ? false : (thumb.thumbId === this.state.controllersVisible)}
              selected={this.props.selectedThumbId ? (this.props.selectedThumbId === thumb.thumbId) : false}
              onHoverAddThumbBefore={this.props.showSettings ? null : () => {
                // only setState if controllersVisible has changed
                if (this.state.addThumbBeforeController !== thumb.thumbId) {
                  this.setState({
                    addThumbBeforeController: thumb.thumbId,
                  });
                }
              }}
              onHoverAddThumbAfter={this.props.showSettings ? null : () => {
                // only setState if controllersVisible has changed
                if (this.state.addThumbAfterController !== thumb.thumbId) {
                  this.setState({
                    addThumbAfterController: thumb.thumbId,
                  });
                }
              }}
              onOver={this.props.showSettings ? null : () => {
                // only setState if controllersVisible has changed
                if (this.state.controllersVisible !== thumb.thumbId) {
                  this.setState({
                    controllersVisible: thumb.thumbId,
                  });
                }
              }}
              onOut={this.props.showSettings ? null : () => {
                this.setState({
                  thumbsToDim: [],
                  controllersVisible: undefined,
                  addThumbBeforeController: undefined,
                  addThumbAfterController: undefined,
                });
              }}
              onLeaveInOut={this.props.showSettings ? null : () => {
                this.setState({
                  thumbsToDim: []
                });
              }}
              onThumbDoubleClick={this.props.onThumbDoubleClick}
              onSelect={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => {
                  this.props.onSelectClick(thumb.thumbId, thumb.frameNumber);
                }}
              onBack={this.props.showSettings ?
                null : () => this.props.onBackClick(this.props.file, thumb.thumbId, thumb.frameNumber)}
              onForward={this.props.showSettings ?
                null : () => this.props.onForwardClick(this.props.file, thumb.thumbId, thumb.frameNumber)}
              onToggle={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onToggleClick(this.props.file.id, thumb.thumbId)}
              onHoverInPoint={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => {
                this.setState({
                  thumbsToDim: getPreviousThumbs(thumbArray, thumb.thumbId)
                });
              }}
              onHoverOutPoint={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => {
                this.setState({
                  thumbsToDim: getNextThumbs(thumbArray, thumb.thumbId)
                });
              }}
              onScrub={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onScrubClick(this.props.file, thumb)}
              onAddBefore={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onAddThumbClick(this.props.file, thumb, 'before')}
              onAddAfter={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onAddThumbClick(this.props.file, thumb, 'after')}
              onInPoint={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onInPointClick(this.props.file, thumbArray, thumb.thumbId, thumb.frameNumber)}
              onOutPoint={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onOutPointClick(this.props.file, thumbArray, thumb.thumbId, thumb.frameNumber)}
              onSaveThumb={(this.props.showSettings || (thumb.thumbId !== this.state.controllersVisible)) ?
                null : () => this.props.onSaveThumbClick(this.props.file.name, thumb.frameNumber, thumb.frameId)}
            />))}
        </div>
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
  showMoviePrintView: PropTypes.bool.isRequired,
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
