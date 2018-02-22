import React from 'react';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import styles from './Header.css';
import UndoRedo from '../containers/UndoRedo';
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

const Header = ({ currentFileId, file, settings, visibilitySettings,
  onShowThumbsClick, onPrintClick, onRowChange, onColumnChange,
  onStartSliding, onRowSliding, onColumnSliding, onAfterChange }) => {

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
    onRowChange(value);
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
    onColumnChange(value);
    onAfterChange();
  };

  // prevent to render everything which is file specific
  let fileSpecificMenu = null;
  const tempFilter = visibilitySettings.visibilityFilter;
  if (currentFileId) {
    fileSpecificMenu = (
      <div>
        <div
          className={styles.subHeader}
        >
          Show thumbs
        </div>
        <div
          onClick={onShowThumbsClick}
          role="button"
        >
          <img
            src={(tempFilter === 'SHOW_VISIBLE') ? visible : hidden}
            className={[styles.headerItem, styles.save].join(' ')}
            alt=""
          />
        </div>
        <div
          className={styles.subHeader}
        >
          Make MoviePrint
        </div>
        <div
          onClick={onPrintClick}
          role="button"
        >
          <img
            src={save}
            className={[styles.headerItem, styles.save].join(' ')}
            alt=""
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div
        className={styles.subHeader}
      >
        Edit
      </div>
      <UndoRedo />
      <div
        style={{
          float: 'left',
        }}
      >
        <Slider
          className={styles.slider}
          min={1}
          max={20}
          defaultValue={Math.ceil(settings.defaultThumbCount/settings.defaultColumnCount)}
          marks={{
            1: '1',
            20: '20',
          }}
          handle={handle}
          onChange={onChangeRow}
          onAfterChange={onAfterChangeRow}
        />
      </div>
      <div
        style={{
          float: 'left',
        }}
      >
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
      {fileSpecificMenu}
    </div>
  );
};

export default Header;
