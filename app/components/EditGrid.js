import React from 'react';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button } from 'semantic-ui-react';
import styles from './Header.css';
import UndoRedo from '../containers/UndoRedo';
import ThumbGridPlaceholder from '../components/ThumbGridPlaceholder';
// import '../../node_modules/rc-slider/assets/index.css';
import save from './../img/Thumb_SAVE.png';
import hidden from './../img/Thumb_HIDDEN.png';
import visible from './../img/Thumb_VISIBLE.png';

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

const EditGrid = ({ currentFileId, file, settings, visibilitySettings, thumbnailWidthPlusMargin,
  onShowThumbsClick, onPrintClick, onRowChange, onColumnChange,
  onStartSliding, onRowSliding, onColumnSliding, onAfterChange, hideEditGrid }) => {

  const onChangeRow = (value) => {
    if (!isManipulatingSlider) {
      isManipulatingSlider = true;
      onStartSliding();
    } else {
      onRowSliding(value);
    }
  };

  const onAfterChangeRow = (value) => {
    isManipulatingSlider = false;
    // onRowChange(value);
    onAfterChange();
  };

  const onChangeColumn = (value) => {
    if (!isManipulatingSlider) {
      isManipulatingSlider = true;
      onStartSliding();
    } else {
      onColumnSliding(value);
    }
  };

  const onAfterChangeColumn = (value) => {
    isManipulatingSlider = false;
    // onColumnChange(value);
    // onAfterChange();
  };

  const onApplyClick = () => {
    // onColumnChange(value);
    // onRowChange(value);
  };

  const onCancelClick = () => {
    hideEditGrid();
  };

  return (
    <div>
      <div>
        <Slider
          className={styles.slider}
          min={1}
          max={20}
          defaultValue={settings.defaultRowCount}
          marks={{
            1: '1',
            20: '20',
          }}
          handle={handle}
          onChange={onChangeRow}
          onAfterChange={onAfterChangeRow}
        />
        <Slider
          className={styles.slider}
          min={1}
          max={20}
          defaultValue={settings.defaultColumnCount}
          marks={{
            1: '1',
            20: '20',
          }}
          handle={handle}
          onChange={onChangeColumn}
          onAfterChange={onAfterChangeColumn}
        />
      </div>
      <Button
        fluid
        color="pink"
        onClick={onApplyClick}
      >
        Apply
      </Button>
      <Button
        compact
        size="mini"
        onClick={onCancelClick}
      >
        Cancel
      </Button>
      <ThumbGridPlaceholder
        thumbsAmount={(settings.defaultRowCount * settings.defaultColumnCount)}
        // thumbsAmount={(this.state.thumbsAmount === undefined) ?
        //   settings.defaultRowCount *
        //   settings.defaultColumnCount :
        //   this.state.thumbsAmount}
        file={{
          path: '',
          name: 'placeholder name',
          width: 1920,
          height: 1080
        }}
        axis={'xy'}
        columnCount={settings.defaultColumnCount}
        columnWidth={(settings.defaultColumnCount === undefined) ?
          settings.defaultColumnCount * thumbnailWidthPlusMargin :
          settings.defaultColumnCount * thumbnailWidthPlusMargin}
        // columnWidth={(this.state.tempColumnCount === undefined) ?
        //   settings.defaultColumnCount * thumbnailWidthPlusMargin :
        //   this.state.tempColumnCount * thumbnailWidthPlusMargin}
      />
    </div>
  );
};

export default EditGrid;
