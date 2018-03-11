// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Radio, Dropdown, Container, Statistic, Divider, Checkbox, Grid, List, Label } from 'semantic-ui-react';
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

const outputFormatOptions = [
  { value: 'png', text: 'PNG' },
  { value: 'jpg', text: 'JPG' },
];

class SettingsList extends Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   thumbInfo: 'frames',
    // };

    this.onChangeThumbInfo = this.onChangeThumbInfo.bind(this);
    this.onChangeReCapture = this.onChangeReCapture.bind(this);
    this.onChangeShowHeader = this.onChangeShowHeader.bind(this);
    this.onChangeRoundedCorners = this.onChangeRoundedCorners.bind(this);
    this.onChangeThumbInfo = this.onChangeThumbInfo.bind(this);
  }

  onChangeReCapture = (e, { checked }) => {
    this.props.onReCaptureClick(checked);
  }

  onChangeShowHeader = (e, { checked }) => {
    this.props.onShowHeaderClick(checked);
  }

  onChangeRoundedCorners = (e, { checked }) => {
    this.props.onRoundedCornersClick(checked);
  }

  onChangeThumbInfo = (e, { value }) => {
    this.props.onThumbInfoClick(value);
  }

  render() {
    return (
      <Container>
        <Grid padded inverted>
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
                <Statistic.Value>{(this.props.columnCountTemp * this.props.rowCountTemp ===
                  this.props.thumbCountTemp) ? '=' : '≈'}
                </Statistic.Value>
              </Statistic>
              <Statistic inverted size="small" color={(this.props.reCapture) ? 'orange' : undefined}>
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
                onChange={this.props.reCapture ? this.props.onChangeColumn :
                  this.props.onChangeColumnAndApply}
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
                {...(this.props.reCapture ? {} : { value: this.props.rowCountTemp })}
                marks={{
                  1: '1',
                  20: '20',
                }}
                handle={handle}
                onChange={this.props.onChangeRow}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Frames
            </Grid.Column>
            <Grid.Column width={12}>
              <Checkbox
                // toggle
                label={
                  <label className={styles.label}>
                    Re-capture frames
                  </label>
                }
                // checked={this.state.checkBoxChecked}
                checked={this.props.reCapture}
                onChange={this.onChangeReCapture}
                // style={{
                //   color: '#eeeeee',
                //   fontFamily: 'Roboto Condensed',
                // }}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={12}>
              <Button
                fluid
                color="orange"
                disabled={!this.props.reCapture}
                onClick={this.props.onApplyClick}
              >
                  Apply
              </Button>
            </Grid.Column>
          </Grid.Row>
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={4}>
              Margin
            </Grid.Column>
            <Grid.Column width={12}>
              <SliderWithTooltip
                className={styles.slider}
                min={0}
                max={40}
                defaultValue={this.props.settings.defaultMargin}
                marks={{
                  0: '0',
                  40: '40',
                }}
                handle={handle}
                onChange={this.props.onChangeMargin}
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
                  <Checkbox
                    label={
                      <label className={styles.label}>
                        Show Header
                      </label>
                    }
                    checked={this.props.settings.defaultShowHeader}
                    onChange={this.onChangeShowHeader}
                  />
                </List.Item>
                <List.Item>
                  <Checkbox
                    label={
                      <label className={styles.label}>
                        Rounded Corners
                      </label>
                    }
                    checked={this.props.settings.defaultRoundedCorners}
                    onChange={this.onChangeRoundedCorners}
                  />
                </List.Item>
                <Divider inverted />
                <List.Item>
                  <Radio
                    label={
                      <label className={styles.label}>
                        Show frames
                      </label>
                      }
                    name="radioGroup"
                    value="frames"
                    checked={this.props.settings.defaultThumbInfo === 'frames'}
                    onChange={this.onChangeThumbInfo}
                  />
                </List.Item>
                <List.Item>
                  <Radio
                    label={
                      <label className={styles.label}>
                        Show timecode
                      </label>
                      }
                    name="radioGroup"
                    value="timecode"
                    checked={this.props.settings.defaultThumbInfo === 'timecode'}
                    onChange={this.onChangeThumbInfo}
                  />
                </List.Item>
                <List.Item>
                  <Radio
                    label={
                      <label className={styles.label}>
                        Hide info
                      </label>
                      }
                    name="radioGroup"
                    value="hideInfo"
                    checked={this.props.settings.defaultThumbInfo === 'hideInfo'}
                    onChange={this.onChangeThumbInfo}
                  />
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={4}>
              Output path
            </Grid.Column>
            <Grid.Column width={12}>
              <List>
                <List.Item>
                  <div
                    style={{
                      wordWrap: 'break-word'
                    }}
                  >
                    {this.props.settings.defaultOutputPath}
                  </div>
                </List.Item>
                <List.Item>
                  <Button
                    onClick={this.props.onChangeOutputPathClick}
                    // onKeyPress={this.onChangeOutputPathPress}
                  >
                    Change...
                  </Button>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Output format
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                placeholder="Select..."
                selection
                search
                options={outputFormatOptions}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Save options
            </Grid.Column>
            <Grid.Column width={12}>
              <List>
                <List.Item>
                  <Checkbox label={
                    <label className={styles.label}>
                      Overwrite existing
                    </label>
                    }
                  />
                </List.Item>
                <List.Item>
                  <Checkbox label={
                    <label className={styles.label}>
                      Save individual frames
                    </label>
                    }
                  />
                </List.Item>
              </List>
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
