// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Form, Segment, Container, Statistic, Divider, Checkbox, Grid, List } from 'semantic-ui-react';
import { addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount } from '../actions';
import styles from '../components/Settings.css';

const SliderWithTooltip = createSliderWithTooltip(Slider);

const handle = (props) => {
  const {
    value, dragging, index, ...restProps
  } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible
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
        <Grid padded inverted>
          <Grid.Row>
            <Grid.Column width={4}>
              Frames
            </Grid.Column>
            <Grid.Column width={12}>
              <Checkbox
                toggle
                label="Re-capture frames"
                // checked={this.state.checkBoxChecked}
                checked={this.props.reCapture}
                onChange={this.handleChange}
                // style={{
                //   color: '#eeeeee',
                //   fontFamily: 'Roboto Condensed',
                // }}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={16}>
              <Statistic inverted size="small">
                <Statistic.Value>{this.props.columnCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
              </Statistic>
              <Statistic inverted size="small">
                <Statistic.Value>×</Statistic.Value>
              </Statistic>
              <Statistic inverted size="small">
                <Statistic.Value>{this.props.rowCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
              </Statistic>
              <Statistic inverted size="small">
                <Statistic.Value>{(this.props.reCapture) ? '=' : '≈'}</Statistic.Value>
              </Statistic>
              <Statistic inverted size="small" color={(this.props.reCapture) ? 'orange' : 'white'}>
                <Statistic.Value>{this.props.thumbCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.reCapture) ? 'Count' : 'Count'}</Statistic.Label>
              </Statistic>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Columns
            </Grid.Column>
            <Grid.Column width={12}>
              <SliderWithTooltip
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
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Rows
            </Grid.Column>
            <Grid.Column width={12}>
              <SliderWithTooltip
                disabled={!this.props.reCapture}
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
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Margin
            </Grid.Column>
            <Grid.Column width={12}>
              <SliderWithTooltip
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
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Options
            </Grid.Column>
            <Grid.Column width={12}>
              <List>
                <List.Item>
                  <Checkbox label="Show Header" />
                </List.Item>
                <List.Item>
                  <Checkbox label="Rounded Corners" />
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={12}>
              <Button
                fluid
                color="pink"
                onClick={this.props.onApplyClick}
              >
                  Apply
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
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
