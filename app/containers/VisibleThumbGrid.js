import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Grid, Segment, Container, Statistic, Divider } from 'semantic-ui-react';
import { arrayMove } from 'react-sortable-hoc';
import { toggleThumb, updateOrder, removeThumb, updateObjectUrlsFromThumbList,
  changeThumb, addDefaultThumbs } from '../actions';
import SortableThumbGrid from '../components/ThumbGrid';
import ThumbGridPlaceholder from '../components/ThumbGridPlaceholder';
import styles from '../components/Settings.css';
import { getLowestFrame, getHighestFrame, getChangeThumbStep, getVisibleThumbs } from '../utils/utils';

// const createSliderWithTooltip = Slider.createSliderWithTooltip;
// const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;

let isManipulatingSlider = false;

const handle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

class SortedVisibleThumbGrid extends Component {
  constructor() {
    super();

    this.state = {
      columnCount: undefined,
      rowCount: undefined,
    };

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;

    this.setState({
      columnCount: store.getState().undoGroup.present.settings.defaultColumnCount,
      rowCount: store.getState().undoGroup.present.settings.defaultRowCount,
    });
  }

  componentDidMount() {
    console.log(this.props);
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    store.getState().undoGroup.present.files.map((singleFile) => {
      if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined) {
        store.dispatch(updateObjectUrlsFromThumbList(
          singleFile.id,
          Object.values(store.getState().undoGroup.present
            .thumbsByFileId[singleFile.id]
            .thumbs).map((a) => a.id)
        ));
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .thumbsByFileId[store.getState().undoGroup.present.settings.currentFileId]
      .thumbs, oldIndex, newIndex);
    store.dispatch(updateOrder(store.getState()
      .undoGroup.present.settings.currentFileId, newOrderedThumbs));
  };

  onChangeRow = (value) => {
    this.setState({ rowCount: value });
  };

  onChangeColumn = (value) => {
    this.setState({ columnCount: value });
  };

  onApplyClick = () => {
    this.props.onThumbCountChange(this.state.columnCount, this.state.rowCount);
    this.props.hideEditGrid();
  };

  onCancelClick = () => {
    this.props.hideEditGrid();
  };

  render() {
    console.log(this.props.showEditGrid);
    console.log(this.props.showPlaceholder);

    return (
      <Grid
        stretched
        verticalAlign="middle"
        padded="horizontally"
        style={{
          height: '100%',
          // position: 'absolute'
        }}
      >
        {(this.props.showEditGrid === false && this.props.showPlaceholder === false) &&
          <Grid.Column
            key="0"
            width={16}
            // className={styles.PaperLandscape}
            style={{
              // backgroundColor: 'gold',
            }}
          >
            <SortableThumbGrid
              thumbs={this.props.thumbs}
              thumbImages={this.props.thumbImages}
              file={this.props.file}
              settings={this.props.settings}
              thumbWidth={this.props.settings.defaultThumbnailWidth}
              onToggleClick={this.props.onToggleClick}
              onRemoveClick={this.props.onRemoveClick}
              onInPointClick={this.props.onInPointClick}
              onOutPointClick={this.props.onOutPointClick}
              onBackClick={this.props.onBackClick}
              onForwardClick={this.props.onForwardClick}
              onScrubClick={this.props.onScrubClick}
              onMouseOverResult={(thumbId) => {
                this.controlersVisible = thumbId;
                this.forceUpdate();
              }}
              onMouseOutResult={() => {
                this.controlersVisible = 'false';
              }}
              onSortEnd={
                this.onSortEnd.bind(this)
              }
              useDragHandle
              axis="xy"
              columnWidth={this.props.columnWidth}
              controlersAreVisible={this.controlersVisible}
            />
          </Grid.Column>}
        {(this.props.showEditGrid === true || this.props.showPlaceholder === true) &&
          <Grid><Grid.Column key="1" width={4}>
          <Container>
            <Segment raised>
              <Segment.Group>
                <Segment>
                  <Statistic horizontal>
                    <Statistic.Value>{this.state.rowCount}</Statistic.Value>
                    <Statistic.Label>{(this.state.rowCount === 1) ? 'Row' : 'Rows'}</Statistic.Label>
                  </Statistic>
                  <Slider
                    className={styles.slider}
                    min={1}
                    max={20}
                    defaultValue={this.state.rowCount}
                    marks={{
                      1: '1',
                      20: '20',
                    }}
                    handle={handle}
                    onChange={this.onChangeRow}
                    onAfterChange={this.onAfterChangeRow}
                  />
                </Segment>
                <Segment>
                  <Statistic horizontal>
                    <Statistic.Value>{this.state.columnCount}</Statistic.Value>
                    <Statistic.Label>{(this.state.columnCount === 1) ? 'Column' : 'Columns'}</Statistic.Label>
                  </Statistic>
                  <Slider
                    className={styles.slider}
                    min={1}
                    max={20}
                    defaultValue={this.state.columnCount}
                    marks={{
                      1: '1',
                      20: '20',
                    }}
                    handle={handle}
                    onChange={this.onChangeColumn}
                    onAfterChange={this.onAfterChangeColumn}
                  />
                </Segment>
              </Segment.Group>
              <Segment padded>
                <Button
                  fluid
                  color="pink"
                  onClick={this.onApplyClick}
                >
                  Apply
                </Button>
                <Divider horizontal>Or</Divider>
                <Button
                  compact
                  size="mini"
                  onClick={this.onCancelClick}
                >
                  Cancel
                </Button>
              </Segment>
            </Segment>
          </Container>
        </Grid.Column>
        <Grid.Column
          key="2"
          width={12}
          className={styles.PaperLandscape}
          style={{
            // backgroundColor: 'gold',
          }}
        >
          {/* <Segment raised> */}
            <ThumbGridPlaceholder
              thumbsAmount={(this.state.columnCount * this.state.rowCount)}
              settings={this.props.settings}
              width={this.props.file ? (this.props.file.width || 1920) : 1920}
              height={this.props.file ? (this.props.file.height || 1080) : 1080}
              axis={'xy'}
              columnCount={this.state.columnCount}
              rowCount={this.state.rowCount}
              columnWidth={this.state.columnCount * (this.props.settings.defaultThumbnailWidth + this.props.settings.defaultMargin)}
              contentHeight={this.props.contentHeight || 360}
              contentWidth={this.props.contentWidth || 640}
              thumbWidth={this.props.settings.defaultThumbnailWidth}
              thumbMargin={this.props.settings.defaultMargin}
              // columnWidth={(this.state.tempColumnCount === undefined) ?
              //   settings.defaultColumnCount * thumbnailWidthPlusMargin :
              //   this.state.tempColumnCount * thumbnailWidthPlusMargin}
            />
          {/* </Segment> */}
        </Grid.Column></Grid>}
      </Grid>
    );
  }
}

const mapStateToProps = state => {
  const tempThumbs = (typeof state.undoGroup.present
    .thumbsByFileId[state.undoGroup.present.settings.currentFileId] === 'undefined')
    ? undefined : state.undoGroup.present
      .thumbsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  // console.log(tempThumbs);
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    thumbImages: state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files.find((file) =>
      file.id === state.undoGroup.present.settings.currentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onToggleClick: (fileId, thumbId) => {
      dispatch(toggleThumb(fileId, thumbId));
    },
    onRemoveClick: (fileId, thumbId) => {
      dispatch(removeThumb(fileId, thumbId));
    },
    onInPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        thumbs.length,
        frameNumber,
        getHighestFrame(thumbs)
      ));
    },
    onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        thumbs.length,
        getLowestFrame(thumbs),
        frameNumber
      ));
    },
    onBackClick: (file, thumbId, frameNumber) => {
      dispatch(changeThumb(file, thumbId, frameNumber - getChangeThumbStep(1)));
    },
    onForwardClick: (file, thumbId, frameNumber) => {
      dispatch(changeThumb(file, thumbId, frameNumber + getChangeThumbStep(1)));
    },
    onScrubClick: (file, thumbId, frameNumber) => {
      ownProps.parentMethod(file, thumbId, frameNumber);
    }
  };
};

SortedVisibleThumbGrid.contextTypes = {
  store: PropTypes.object,
  // isManipulatingSliderInHeader: PropTypes.bool
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
