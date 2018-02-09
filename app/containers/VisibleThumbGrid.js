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
      columnCountTemp: undefined,
      rowCountTemp: undefined,
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
      columnCountTemp: store.getState().undoGroup.present.settings.defaultColumnCount,
      rowCountTemp: store.getState().undoGroup.present.settings.defaultRowCount,
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
    this.setState({ rowCountTemp: value });
  };

  onChangeColumn = (value) => {
    this.setState({ columnCountTemp: value });
  };

  onApplyClick = () => {
    this.setState({ rowCount: this.state.rowCountTemp });
    this.setState({ columnCount: this.state.columnCountTemp });
    this.props.onThumbCountChange(this.state.columnCountTemp, this.state.rowCountTemp);
    this.props.hideEditGrid();
  };

  onCancelClick = () => {
    this.setState({ rowCountTemp: this.state.rowCount });
    this.setState({ columnCountTemp: this.state.columnCount });
    this.props.hideEditGrid();
  };

  render() {
    const settingsComponent = (
      <Container>
        <Segment raised>
          <Segment.Group>
            <Segment>
              <Statistic horizontal>
                <Statistic.Value>{this.state.rowCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.state.rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
              </Statistic>
              <Slider
                className={styles.slider}
                min={1}
                max={20}
                defaultValue={this.state.rowCountTemp}
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
                <Statistic.Value>{this.state.columnCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.state.columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
              </Statistic>
              <Slider
                className={styles.slider}
                min={1}
                max={20}
                defaultValue={this.state.columnCountTemp}
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
      </Container>);

      console.log(this.props.showEditGrid);

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
        {(this.props.showEditGrid === true) &&
          <Grid.Column key="1" width={4}>
            {settingsComponent}
          </Grid.Column>
        }
        <Grid.Column
          key="2"
          width={this.props.showEditGrid ? 12 : 16}
          className={this.props.showEditGrid ? styles.PaperLandscape : undefined}
          style={{
            // backgroundColor: 'gold',
          }}
        >
          <SortableThumbGrid
            showEditGrid={this.props.showEditGrid}
            showPlaceholder={this.props.showPlaceholder}
            thumbs={this.props.thumbs}
            thumbImages={this.props.thumbImages}
            file={this.props.file}
            settings={this.props.settings}
            // thumbWidth={this.props.settings.defaultThumbnailWidth}
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
            // columnWidth={this.props.columnWidth}
            controlersAreVisible={this.controlersVisible}

            width={this.props.file ? (this.props.file.width || 1920) : 1920}
            height={this.props.file ? (this.props.file.height || 1080) : 1080}
            columnCount={this.state.columnCountTemp}
            rowCount={this.state.rowCountTemp}
            columnWidth={this.state.columnCountTemp *
              (this.props.settings.defaultThumbnailWidth + this.props.settings.defaultMargin)}
            contentHeight={this.props.contentHeight || 360}
            contentWidth={this.props.contentWidth || 640}
          />
        </Grid.Column>
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
