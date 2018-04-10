// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Radio, Dropdown, Container, Statistic, Divider, Checkbox, Grid, List, Label } from 'semantic-ui-react';
import { addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount } from '../actions';
import styles from './Settings.css';

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

const thumbnailScale = (file = { width: 1920, height: 1080 }) => {
  return [
    { value: 1, text: `${file.width}×${file.height} – 1/1` },
    { value: 0.5, text: `${file.width * 0.5}×${file.height * 0.5} – 1/2` },
    { value: 0.25, text: `${file.width * 0.25}×${file.height * 0.25} – 1/4` },
    { value: 0.125, text: `${file.width * 0.125}×${file.height * 0.125} – 1/8` },
    // { value: 0.0625, text: '1/16' },
  ];
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

    this.onChangeReCapture = this.onChangeReCapture.bind(this);
    this.onChangeShowHeader = this.onChangeShowHeader.bind(this);
    this.onChangeRoundedCorners = this.onChangeRoundedCorners.bind(this);
    this.onChangeShowHiddenThumbs = this.onChangeShowHiddenThumbs.bind(this);
    this.onChangeThumbInfo = this.onChangeThumbInfo.bind(this);
    this.onChangeOutputFormat = this.onChangeOutputFormat.bind(this);
    this.onChangeOverwrite = this.onChangeOverwrite.bind(this);
    this.onChangeThumbnailScale = this.onChangeThumbnailScale.bind(this);
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

  onChangeShowHiddenThumbs = (e, { checked }) => {
    this.props.onShowHiddenThumbsClick(checked);
  }

  onChangeThumbInfo = (e, { value }) => {
    this.props.onThumbInfoClick(value);
  }

  onChangeOutputFormat = (e, { value }) => {
    this.props.onOutputFormatClick(value);
  }

  onChangeOverwrite = (e, { checked }) => {
    this.props.onOverwriteClick(checked);
  }

  onChangeThumbnailScale = (e, { value }) => {
    this.props.onThumbnailScaleClick(value);
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
          { this.props.reCapture &&
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
          }
          <Grid.Row>
            <Grid.Column width={4}>
              Count
            </Grid.Column>
            <Grid.Column width={12}>
              <Checkbox
                // toggle
                label={
                  <label className={styles.label}>
                    Change thumb count
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
                max={20}
                defaultValue={this.props.settings.defaultMarginRatio * this.props.settings.defaultMarginSliderFactor}
                marks={{
                  0: '0',
                  20: '20',
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
                <List.Item>
                  <Checkbox
                    label={
                      <label className={styles.label}>
                        Show hidden thumbs
                      </label>
                    }
                    checked={this.props.visibilitySettings.visibilityFilter === 'SHOW_ALL'}
                    onChange={this.onChangeShowHiddenThumbs}
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
                // search
                options={outputFormatOptions}
                defaultValue={this.props.settings.defaultOutputFormat}
                onChange={this.onChangeOutputFormat}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Thumb size
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                placeholder="Select..."
                selection
                // search
                options={thumbnailScale(this.props.file)}
                defaultValue={this.props.settings.defaultThumbnailScale}
                onChange={this.onChangeThumbnailScale}
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
                  <Checkbox
                    label={
                      <label className={styles.label}>
                        Overwrite existing
                      </label>
                    }
                    checked={this.props.settings.defaultSaveOptionOverwrite}
                    onChange={this.onChangeOverwrite}
                  />
                </List.Item>
                {/* <List.Item>
                  <Checkbox label={
                    <label className={styles.label}>
                      Save individual frames
                    </label>
                    }
                  />
                </List.Item> */}
              </List>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}

SettingsList.contextTypes = {
  store: PropTypes.object
};

export default SettingsList;
