import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Grid, Segment, Container } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import styles from './Settings.css';
import ThumbGridPlaceholder from '../components/ThumbGridPlaceholder';

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


class EditGrid extends Component {
  constructor() {
    super();

    this.state = {
      columnCount: undefined,
      rowCount: undefined,
    }

    this.onChangeRow = this.onChangeRow.bind(this);
    this.onAfterChangeRow = this.onAfterChangeRow.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);
    this.onAfterChangeColumn = this.onAfterChangeColumn.bind(this);
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

  componentWillUnmount() {
  }

  onChangeRow = (value) => {
    this.setState({ rowCount: value });
    // if (!isManipulatingSlider) {
    //   isManipulatingSlider = true;
    //   this.props.onStartSliding();
    // } else {
    //   this.props.onRowSliding(value);
    // }
  };

  onAfterChangeRow = (value) => {
    // isManipulatingSlider = false;
    // onRowChange(value);
    // this.props.onAfterChange();
  };

  onChangeColumn = (value) => {
    this.setState({ columnCount: value });
    // if (!isManipulatingSlider) {
    //   isManipulatingSlider = true;
    //   this.props.onStartSliding();
    // } else {
    //   this.props.onColumnSliding(value);
    // }
  };

  onAfterChangeColumn = (value) => {
    // isManipulatingSlider = false;
    // onColumnChange(value);
    // onAfterChange();
  };

  onApplyClick = () => {
    this.props.onThumbCountChange(this.state.columnCount, this.state.rowCount);
    this.props.hideEditGrid();
  };

  onCancelClick = () => {
    this.props.hideEditGrid();
  };

  render() {
    return (
      <Grid
        stretched
        verticalAlign="middle"
        padded="horizontally"
        style={{
          height: '100%',
          position: 'absolute'
        }}
      >
        {/* <Grid stretched> */}
        <Grid.Column key="1" width={4}>
          <Container>
            <Segment raised>
              <Segment.Group>
                <Segment>
                  <b>{this.state.rowCount}</b> rows
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
                  <b>{this.state.columnCount}</b> columns
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
              <Button
                fluid
                color="pink"
                onClick={this.onApplyClick}
              >
                Apply
              </Button>
              <Button
                compact
                size="mini"
                onClick={this.onCancelClick}
              >
                  Cancel
              </Button>
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
              // thumbsAmount={(this.state.thumbsAmount === undefined) ?
              //   settings.defaultRowCount *
              //   settings.defaultColumnCount :
              //   this.state.thumbsAmount}
              width={this.props.file ? (this.props.file.width || 1920) : 1920}
              height={this.props.file ? (this.props.file.height || 1080) : 1080}
              axis={'xy'}
              columnCount={this.state.columnCount}
              rowCount={this.state.rowCount}
              columnWidth={this.state.columnCount * this.props.thumbnailWidthPlusMargin}
              contentHeight={this.props.contentHeight || 360}
              contentWidth={this.props.contentWidth || 640}
              thumbWidth={this.props.thumbWidth}
              thumbMargin={this.props.thumbMargin}
              // columnWidth={(this.state.tempColumnCount === undefined) ?
              //   settings.defaultColumnCount * thumbnailWidthPlusMargin :
              //   this.state.tempColumnCount * thumbnailWidthPlusMargin}
            />
          {/* </Segment> */}
        </Grid.Column>
      </Grid>
    );
  }
}

EditGrid.contextTypes = {
  store: PropTypes.object
};

export default EditGrid;
