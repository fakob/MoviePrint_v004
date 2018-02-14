// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
// import imageDB from '../utils/db';
import { Button, Grid, Segment, Container, Statistic, Divider } from 'semantic-ui-react';
import { addDefaultThumbs, setDefaultRowCount, setDefaultColumnCount } from '../actions';
import styles from '../components/Settings.css';

// const createSliderWithTooltip = Slider.createSliderWithTooltip;
// const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;

// let isManipulatingSlider = false;

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

const SettingsList = ({
  columnCountTemp, rowCountTemp, columnCount, rowCount, onChangeColumn,
  onChangeRow, onAfterChange, onApplyClick, onCancelClick
}) => {
  return (
    <Container>
      <Segment raised>
        <Segment.Group>
          <Segment>
            <Statistic horizontal>
              <Statistic.Value>{columnCountTemp}</Statistic.Value>
              <Statistic.Label>{(columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
            </Statistic>
            <Slider
              className={styles.slider}
              min={1}
              max={20}
              defaultValue={columnCountTemp}
              marks={{
                1: '1',
                20: '20',
              }}
              handle={handle}
              onChange={onChangeColumn}
              // onAfterChange={onAfterChangeColumn}
            />
          </Segment>
          <Segment>
            <Statistic horizontal>
              <Statistic.Value>{rowCountTemp}</Statistic.Value>
              <Statistic.Label>{(rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
            </Statistic>
            <Slider
              className={styles.slider}
              min={1}
              max={20}
              defaultValue={rowCountTemp}
              marks={{
                1: '1',
                20: '20',
              }}
              handle={handle}
              onChange={onChangeRow}
              // onAfterChange={onAfterChangeRow}
            />
          </Segment>
        </Segment.Group>
        <Segment padded>
          <Button
            fluid
            color="pink"
            onClick={onApplyClick}
          >
            Apply
          </Button>
          <Divider horizontal>Or</Divider>
          <Button
            compact
            size="mini"
            onClick={onCancelClick}
          >
            Cancel
          </Button>
        </Segment>
      </Segment>
    </Container>
  );
};

SettingsList.contextTypes = {
  store: PropTypes.object
};

export default SettingsList;
