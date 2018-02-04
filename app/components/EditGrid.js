import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button } from 'semantic-ui-react';
import styles from './Header.css';
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
    // this.unsubscribe();
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
      <div>
        <div>
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
        </div>
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
        <ThumbGridPlaceholder
          thumbsAmount={(this.state.columnCount * this.state.rowCount)}
          // thumbsAmount={(this.state.thumbsAmount === undefined) ?
          //   settings.defaultRowCount *
          //   settings.defaultColumnCount :
          //   this.state.thumbsAmount}
          width={this.props.file.width}
          height={this.props.file.height}
          axis={'xy'}
          columnCount={this.state.columnCount}
          columnWidth={this.state.columnCount * this.props.thumbnailWidthPlusMargin}
          // columnWidth={(this.state.tempColumnCount === undefined) ?
          //   settings.defaultColumnCount * thumbnailWidthPlusMargin :
          //   this.state.tempColumnCount * thumbnailWidthPlusMargin}
        />
      </div>
    );
  }
}

EditGrid.contextTypes = {
  store: PropTypes.object
};

export default EditGrid;
