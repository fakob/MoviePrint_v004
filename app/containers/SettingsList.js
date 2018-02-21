// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
// import imageDB from '../utils/db';
import { Button, Form, Segment, Container, Statistic, Divider, Checkbox } from 'semantic-ui-react';
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

class SettingsList extends Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   checkBoxChecked: false,
    // };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (e, { checked }) => {
    // this.setState({
    //   checkBoxChecked: checked
    // });
    this.props.onReCaptureClick(checked);
  }

  render() {
    return (
      <Container>
        <Segment raised>
          <Segment.Group>
            <Segment>
              <Checkbox
                toggle
                label="Re-capture frames"
                // checked={this.state.checkBoxChecked}
                checked={this.props.reCapture}
                onChange={this.handleChange}
              />
            </Segment>
            <Segment>
              <Statistic horizontal>
                <Statistic.Value>{this.props.columnCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
              </Statistic>
              <Slider
                className={styles.slider}
                min={1}
                max={20}
                defaultValue={this.props.columnCountTemp}
                marks={{
                  1: '1',
                  20: '20',
                }}
                handle={handle}
                onChange={this.props.onChangeColumn}
                // onAfterChange={this.props.onAfterChangeColumn}
              />
            </Segment>
            {this.props.reCapture === true &&
              <Segment>
                <Statistic horizontal>
                  <Statistic.Value>{this.props.rowCountTemp}</Statistic.Value>
                  <Statistic.Label>{(this.props.rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
                </Statistic>
                <Slider
                  className={styles.slider}
                  min={1}
                  max={20}
                  defaultValue={this.props.rowCountTemp}
                  marks={{
                    1: '1',
                    20: '20',
                  }}
                  handle={handle}
                  onChange={this.props.onChangeRow}
                  // onAfterChange={this.props.onAfterChangeRow}
                />
              </Segment>
            }
            <Segment padded>
              <Button
                fluid
                color="pink"
                onClick={this.props.onApplyClick}
              >
                  Apply
              </Button>
              <Divider
                horizontal
              >
                Or
              </Divider>
              <Button
                compact
                size="mini"
                onClick={this.props.onCancelClick}
              >
                Cancel
              </Button>
            </Segment>
          </Segment.Group>
        </Segment>
      </Container>
    );
  }
}



const mapStateToProps = (state) => {
  return {
    // thumbs: getVisibleThumbs(
    //   tempThumbs,
    //   state.visibilitySettings.visibilityFilter
    // ),
    // thumbImages: (typeof state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId] === 'undefined')
    //   ? undefined : state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    // files: state.undoGroup.present.files,
    // file: state.undoGroup.present.files.find((file) =>
    //   file.id === state.undoGroup.present.settings.currentFileId),
    // settings: state.undoGroup.present.settings,
    // visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
  };
};

SettingsList.contextTypes = {
  store: PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsList);
