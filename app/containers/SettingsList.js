// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Radio, Dropdown, Container, Statistic, Divider, Checkbox, Grid, List, Message, Popup } from 'semantic-ui-react';
import { addDefaultThumbs, setDefaultThumbCount, setDefaultColumnCount } from '../actions';
import styles from './Settings.css';
import stylesPop from '../components/Popup.css';
import { MENU_HEADER_HEIGHT, MENU_FOOTER_HEIGHT, DEFAULT_THUMB_COUNT,
  DEFAULT_COLUMN_COUNT, DEFAULT_MOVIE_WIDTH, DEFAULT_MOVIE_HEIGHT } from '../utils/constants';
import { getScaleValueObject } from '../utils/utils';

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

const thumbnailScale = (file = { width: 1920, height: 1080 }, scaleValueObject) => {
  // console.log(scaleValueObject.newMoviePrintWidth);
  return [
    { value: 1, text: `${file.width}×${file.height} – 1/1 - ${scaleValueObject.newMoviePrintWidth}` },
    { value: 0.5, text: `${file.width * 0.5}×${file.height * 0.5} – 1/2` },
    { value: 0.25, text: `${file.width * 0.25}×${file.height * 0.25} – 1/4` },
    { value: 0.125, text: `${file.width * 0.125}×${file.height * 0.125} – 1/8` },
    // { value: 0.0625, text: '1/16' },
  ];
};

const outputSize = (file = {
  width: DEFAULT_MOVIE_WIDTH,
  height: DEFAULT_MOVIE_HEIGHT,
}, columnCountTemp, thumbCountTemp, settings, visibilitySettings) => {
  const newScaleValueObject = getScaleValueObject(
    file,
    settings,
    columnCountTemp, thumbCountTemp,
    4096, undefined,
    visibilitySettings.showMoviePrintView,
    1
  );
  const moviePrintSize = [
    { width: 16384, height: Math.round(16384 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 8192, height: Math.round(8192 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 4096, height: Math.round(4096 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 3072, height: Math.round(3072 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 2048, height: Math.round(2048 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 1024, height: Math.round(1024 * newScaleValueObject.moviePrintAspectRatioInv) },
  ];
  return [
    { value: moviePrintSize[5].width, text: `${moviePrintSize[5].width}px (×${moviePrintSize[5].height}px)` },
    { value: moviePrintSize[4].width, text: `${moviePrintSize[4].width}px (×${moviePrintSize[4].height}px)` },
    { value: moviePrintSize[3].width, text: `${moviePrintSize[3].width}px (×${moviePrintSize[3].height}px)` },
    { value: moviePrintSize[2].width, text: `${moviePrintSize[2].width}px (×${moviePrintSize[2].height}px)` },
    { value: moviePrintSize[1].width, text: `${moviePrintSize[1].width}px (×${moviePrintSize[1].height}px)` },
    { value: moviePrintSize[0].width, text: `${moviePrintSize[0].width}px (×${moviePrintSize[0].height}px)` },
  ];
};

const paperLayouts = [
  { value: 0.71, text: 'A0-A5 (Landscape)' },
  { value: 1.41, text: 'A0-A5 (Portrait)' },
  { value: 0.77, text: 'Letter (Landscape)' },
  { value: 1.29, text: 'Letter (Portrait)' },
  { value: 0.61, text: 'Legal (Landscape)' },
  { value: 1.65, text: 'Legal (Portrait)' },
  { value: 0.65, text: 'Tabloid (Landscape)' },
  { value: 1.55, text: 'Tabloid (Portrait)' },
];

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

    this.onChangePaperAspectRatio = this.onChangePaperAspectRatio.bind(this);
    this.onChangeShowPaperPreview = this.onChangeShowPaperPreview.bind(this);
    this.onChangeReCapture = this.onChangeReCapture.bind(this);
    this.onChangeShowHeader = this.onChangeShowHeader.bind(this);
    this.onChangeRoundedCorners = this.onChangeRoundedCorners.bind(this);
    this.onChangeShowHiddenThumbs = this.onChangeShowHiddenThumbs.bind(this);
    this.onChangeThumbInfo = this.onChangeThumbInfo.bind(this);
    this.onChangeOutputFormat = this.onChangeOutputFormat.bind(this);
    this.onChangeOverwrite = this.onChangeOverwrite.bind(this);
    this.onChangeIncludeIndividual = this.onChangeIncludeIndividual.bind(this);
    this.onChangeThumbnailScale = this.onChangeThumbnailScale.bind(this);
    this.onChangeMoviePrintWidth = this.onChangeMoviePrintWidth.bind(this);
  }

  onChangeShowPaperPreview = (e, { checked }) => {
    this.props.onShowPaperPreviewClick(checked);
  }

  onChangePaperAspectRatio = (e, { value }) => {
    this.props.onPaperAspectRatioClick(value);
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

  onChangeIncludeIndividual = (e, { checked }) => {
    this.props.onIncludeIndividualClick(checked);
  }

  onChangeThumbnailScale = (e, { value }) => {
    this.props.onThumbnailScaleClick(value);
  }

  onChangeMoviePrintWidth = (e, { value }) => {
    this.props.onMoviePrintWidthClick(value);
  }

  render() {
    return (
      <Container
        style={{
          marginBottom: `${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px`,
        }}
      >
        <Grid padded inverted>
          <Grid.Row>
            <Grid.Column width={16}>
              <Statistic inverted size="tiny">
                <Statistic.Value>{this.props.columnCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
              </Statistic>
              <Statistic inverted size="tiny">
                <Statistic.Value>×</Statistic.Value>
              </Statistic>
              <Statistic inverted size="tiny">
                <Statistic.Value>{this.props.rowCountTemp}</Statistic.Value>
                <Statistic.Label>{(this.props.rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
              </Statistic>
              <Statistic inverted size="tiny">
                <Statistic.Value>{(this.props.columnCountTemp * this.props.rowCountTemp ===
                  this.props.thumbCountTemp) ? '=' : '≈'}
                </Statistic.Value>
              </Statistic>
              <Statistic inverted size="tiny" color={(this.props.reCapture) ? 'orange' : undefined}>
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
          { (this.props.thumbCount !== this.props.thumbCountTemp) &&
            <Grid.Row>
              <Grid.Column width={4} />
              <Grid.Column width={12}>
                <Message
                  color="orange"
                  size="mini"
                >
                  Applying a new grid will overwrite your previously selected thumbs. Don&apos;t worry, this can be undone.
                </Message>
              </Grid.Column>
            </Grid.Row>
          }
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={12}>
              <Popup
                trigger={
                  <Button
                    fluid
                    color="orange"
                    disabled={(this.props.thumbCount === this.props.thumbCountTemp)}
                    onClick={this.props.onApplyClick}
                  >
                      Apply
                  </Button>
                }
                className={stylesPop.popup}
                content="Apply new grid for MoviePrint"
                keepInViewPort={false}
              />
            </Grid.Column>
          </Grid.Row>
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={4}>
              Preview
            </Grid.Column>
            <Grid.Column width={12}>
              <Checkbox
                label={
                  <label className={styles.label}>
                    Show paper preview
                  </label>
                }
                checked={this.props.settings.defaultShowPaperPreview}
                onChange={this.onChangeShowPaperPreview}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Layout
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                placeholder="Select..."
                selection
                // search
                disabled={!this.props.settings.defaultShowPaperPreview}
                options={paperLayouts}
                defaultValue={this.props.settings.defaultPaperAspectRatioInv}
                onChange={this.onChangePaperAspectRatio}
              />
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
                        Show header
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
                        Rounded corners
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
                  >
                    Change...
                  </Button>
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Output size
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                placeholder="Select..."
                selection
                // search
                options={outputSize(this.props.file, this.props.columnCountTemp, this.props.thumbCountTemp, this.props.settings, this.props.visibilitySettings)}
                defaultValue={this.props.settings.defaultMoviePrintWidth}
                onChange={this.onChangeMoviePrintWidth}
              />
            </Grid.Column>
          </Grid.Row>
          {/* <Grid.Row>
            <Grid.Column width={4}>
              Thumb size
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                placeholder="Select..."
                selection
                // search
                options={thumbnailScale(this.props.file, this.props.scaleValueObject)}
                defaultValue={this.props.settings.defaultThumbnailScale}
                onChange={this.onChangeThumbnailScale}
              />
            </Grid.Column>
          </Grid.Row> */}
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
                <List.Item>
                  <Checkbox
                    label={
                      <label className={styles.label}>
                        Include individual frames
                      </label>
                    }
                    checked={this.props.settings.defaultSaveOptionIncludeIndividual}
                    onChange={this.onChangeIncludeIndividual}
                  />
                </List.Item>
              </List>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            &nbsp;
          </Grid.Row>
          <Grid.Row>
            &nbsp;
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
