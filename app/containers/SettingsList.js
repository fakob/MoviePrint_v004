// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Radio, Dropdown, Container, Statistic, Divider, Checkbox, Grid, List, Message, Popup } from 'semantic-ui-react';
import styles from './Settings.css';
import stylesPop from '../components/Popup.css';
import {
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  DEFAULT_MOVIE_WIDTH,
  DEFAULT_MOVIE_HEIGHT,
  PAPER_LAYOUT_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  VIEW,
} from '../utils/constants';
import getScaleValueObject from '../utils/getScaleValueObject';

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

const outputSize = (file = {
  width: DEFAULT_MOVIE_WIDTH,
  height: DEFAULT_MOVIE_HEIGHT,
}, columnCountTemp, thumbCountTemp, settings, visibilitySettings) => {
  const newScaleValueObject = getScaleValueObject(
    file,
    settings,
    columnCountTemp, thumbCountTemp,
    4096, undefined,
    visibilitySettings.defaultView === VIEW.THUMBVIEW,
    1
  );
  const sizeLimit = 32767; // due to browser limitations https://html2canvas.hertzen.com/faq
  const moviePrintSize = [
    { width: 16384, height: Math.round(16384 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 8192, height: Math.round(8192 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 4096, height: Math.round(4096 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 3072, height: Math.round(3072 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 2048, height: Math.round(2048 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 1024, height: Math.round(1024 * newScaleValueObject.moviePrintAspectRatioInv) },
  ];
  return [
    { value: moviePrintSize[5].width, text: `${moviePrintSize[5].width}px (×${moviePrintSize[5].height}px)`, disabled: ((moviePrintSize[5].width + moviePrintSize[5].height) > sizeLimit), 'data-tid': `${moviePrintSize[5].width}-widthOption` },
    { value: moviePrintSize[4].width, text: `${moviePrintSize[4].width}px (×${moviePrintSize[4].height}px)`, disabled: ((moviePrintSize[4].width + moviePrintSize[4].height) > sizeLimit), 'data-tid': `${moviePrintSize[4].width}-widthOption` },
    { value: moviePrintSize[3].width, text: `${moviePrintSize[3].width}px (×${moviePrintSize[3].height}px)`, disabled: ((moviePrintSize[3].width + moviePrintSize[3].height) > sizeLimit), 'data-tid': `${moviePrintSize[3].width}-widthOption` },
    { value: moviePrintSize[2].width, text: `${moviePrintSize[2].width}px (×${moviePrintSize[2].height}px)`, disabled: ((moviePrintSize[2].width + moviePrintSize[2].height) > sizeLimit), 'data-tid': `${moviePrintSize[2].width}-widthOption` },
    { value: moviePrintSize[1].width, text: `${moviePrintSize[1].width}px (×${moviePrintSize[1].height}px)`, disabled: ((moviePrintSize[1].width + moviePrintSize[1].height) > sizeLimit), 'data-tid': `${moviePrintSize[1].width}-widthOption` },
    { value: moviePrintSize[0].width, text: `${moviePrintSize[0].width}px (×${moviePrintSize[0].height}px)`, disabled: ((moviePrintSize[0].width + moviePrintSize[0].height) > sizeLimit), 'data-tid': `${moviePrintSize[0].width}-widthOption` },
  ];
};

class SettingsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sceneDetectionThreshold: 20.0,
    };

    this.onChangePaperAspectRatio = this.onChangePaperAspectRatio.bind(this);
    this.onChangeShowPaperPreview = this.onChangeShowPaperPreview.bind(this);
    this.onChangeDetectInOutPoint = this.onChangeDetectInOutPoint.bind(this);
    this.onChangeReCapture = this.onChangeReCapture.bind(this);
    this.onChangeShowHeader = this.onChangeShowHeader.bind(this);
    this.onChangeShowPathInHeader = this.onChangeShowPathInHeader.bind(this);
    this.onChangeShowDetailsInHeader = this.onChangeShowDetailsInHeader.bind(this);
    this.onChangeShowTimelineInHeader = this.onChangeShowTimelineInHeader.bind(this);
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

  onChangeDetectInOutPoint = (e, { checked }) => {
    this.props.onDetectInOutPointClick(checked);
  }

  onChangeReCapture = (e, { checked }) => {
    this.props.onReCaptureClick(checked);
  }

  onChangeShowHeader = (e, { checked }) => {
    this.props.onShowHeaderClick(checked);
  }

  onChangeShowPathInHeader = (e, { checked }) => {
    this.props.onShowPathInHeaderClick(checked);
  }

  onChangeShowDetailsInHeader = (e, { checked }) => {
    this.props.onShowDetailsInHeaderClick(checked);
  }

  onChangeShowTimelineInHeader = (e, { checked }) => {
    this.props.onShowTimelineInHeaderClick(checked);
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
                // data-tid='columnCountSlider'
                className={styles.slider}
                min={1}
                max={20}
                defaultValue={this.props.columnCountTemp}
                value={this.props.columnCountTemp}
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
                  // data-tid='rowCountSlider'
                  disabled={!this.props.reCapture}
                  className={styles.slider}
                  min={1}
                  max={20}
                  defaultValue={this.props.rowCountTemp}
                  value={this.props.rowCountTemp}
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
                data-tid='changeThumbCountCheckbox'
                label={
                  <label className={styles.label}>
                    Change thumb count
                  </label>
                }
                checked={this.props.reCapture}
                onChange={this.onChangeReCapture}
              />
            </Grid.Column>
          </Grid.Row>
          { (this.props.thumbCount !== this.props.thumbCountTemp) &&
            <Grid.Row>
              <Grid.Column width={4} />
              <Grid.Column width={12}>
                <Message
                  data-tid='applyNewGridMessage'
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
                    data-tid='applyNewGridBtn'
                    fluid
                    color="orange"
                    disabled={(this.props.thumbCount === this.props.thumbCountTemp)}
                    onClick={this.props.onApplyNewGridClick}
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
                data-tid='showPaperPreviewCheckbox'
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
                data-tid='paperLayoutOptionsDropdown'
                placeholder="Select..."
                selection
                disabled={!this.props.settings.defaultShowPaperPreview}
                options={PAPER_LAYOUT_OPTIONS}
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
                // data-tid='marginSlider'
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
                    data-tid='showHeaderCheckbox'
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
                    data-tid='showFilePathCheckbox'
                    className={styles.subCheckbox}
                    label={
                      <label className={styles.label}>
                        Show file path
                      </label>
                    }
                    disabled={!this.props.settings.defaultShowHeader}
                    checked={this.props.settings.defaultShowPathInHeader}
                    onChange={this.onChangeShowPathInHeader}
                  />
                </List.Item>
                <List.Item>
                  <Checkbox
                    data-tid='showFileDetailsCheckbox'
                    className={styles.subCheckbox}
                    label={
                      <label className={styles.label}>
                        Show file details
                      </label>
                    }
                    disabled={!this.props.settings.defaultShowHeader}
                    checked={this.props.settings.defaultShowDetailsInHeader}
                    onChange={this.onChangeShowDetailsInHeader}
                  />
                </List.Item>
                <List.Item>
                  <Checkbox
                    data-tid='showTimelineCheckbox'
                    className={styles.subCheckbox}
                    label={
                      <label className={styles.label}>
                        Show timeline
                      </label>
                    }
                    disabled={!this.props.settings.defaultShowHeader}
                    checked={this.props.settings.defaultShowTimelineInHeader}
                    onChange={this.onChangeShowTimelineInHeader}
                  />
                </List.Item>
                <List.Item>
                  <Checkbox
                    data-tid='roundedCornersCheckbox'
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
                    data-tid='showHiddenThumbsCheckbox'
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
                    data-tid='showFramesRadioBtn'
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
                    data-tid='showTimecodeRadioBtn'
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
                    data-tid='hideInfoRadioBtn'
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
                    data-tid='changeOutputPathBtn'
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
                data-tid='changeMoviePrintWidthDropdown'
                placeholder="Select..."
                selection
                options={outputSize(this.props.file, this.props.columnCountTemp, this.props.thumbCountTemp, this.props.settings, this.props.visibilitySettings)}
                defaultValue={this.props.settings.defaultMoviePrintWidth}
                onChange={this.onChangeMoviePrintWidth}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Output format
            </Grid.Column>
            <Grid.Column width={12}>
              <Dropdown
                data-tid='changeOutputFormatDropdown'
                placeholder="Select..."
                selection
                options={OUTPUT_FORMAT_OPTIONS}
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
                    data-tid='overwriteExistingCheckbox'
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
                    data-tid='includeIndividualFramesCheckbox'
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
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={16}>
              Experimental
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Import options
            </Grid.Column>
            <Grid.Column width={12}>
              <Checkbox
                data-tid='automaticDetectionInOutPointCheckbox'
                label={
                  <label className={styles.label}>
                    Automatic detection of In and Outpoint
                  </label>
                }
                checked={this.props.settings.defaultDetectInOutPoint}
                onChange={this.onChangeDetectInOutPoint}
              />
            </Grid.Column>
          </Grid.Row>
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={4}>
              Scene detection
            </Grid.Column>
            <Grid.Column width={12}>
              <Popup
                trigger={
                  <Button
                    data-tid='runSceneDetectionBtn'
                    fluid
                    loading={this.props.fileScanRunning}
                    disabled={this.props.fileScanRunning}
                    onClick={() => this.props.runSceneDetection(this.props.file, this.state.sceneDetectionThreshold)}
                  >
                      Run scene detection
                  </Button>
                }
                className={stylesPop.popup}
                content="Run scene detection (running for the first time might take longer)"
                keepInViewPort={false}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Threshold
            </Grid.Column>
            <Grid.Column width={12}>
              <SliderWithTooltip
                // data-tid='sceneDetectionThresholdSlider'
                className={styles.slider}
                min={5}
                max={40}
                defaultValue={this.state.sceneDetectionThreshold}
                marks={{
                  5: '5',
                  20: '20',
                  40: '40',
                }}
                handle={handle}
                onChange={(value) => this.setState({ sceneDetectionThreshold: value })}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4}>
              Detection chart
            </Grid.Column>
            <Grid.Column width={12}>
              <Popup
                trigger={
                  <Button
                    data-tid='showDetectionChartBtn'
                    fluid
                    onClick={this.props.onToggleDetectionChart}
                  >
                    {this.props.showChart ? 'Hide detection chart' : 'Show detection chart'}
                  </Button>
                }
                className={stylesPop.popup}
                content="Show detection chart with mean and difference values per frame"
                keepInViewPort={false}
              />
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
