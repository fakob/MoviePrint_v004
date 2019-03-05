// @flow

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slider, { Handle, createSliderWithTooltip } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Radio, Dropdown, Container, Statistic, Divider, Checkbox, Grid, List, Message, Popup } from 'semantic-ui-react';
import styles from './Settings.css';
import stylesPop from '../components/Popup.css';
import { frameCountToMinutes } from '../utils/utils';
import {
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  DEFAULT_MOVIE_WIDTH,
  DEFAULT_MOVIE_HEIGHT,
  PAPER_LAYOUT_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  CACHED_FRAMES_SIZE_OPTIONS,
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
}, columnCountTemp, thumbCountTemp, settings, visibilitySettings, sceneArray, secondsPerRowTemp, isGridView) => {
  const newScaleValueObject = getScaleValueObject(
    file,
    settings,
    visibilitySettings,
    columnCountTemp,
    thumbCountTemp,
    4096,
    undefined,
    1,
    undefined,
    undefined,
    sceneArray,
    secondsPerRowTemp,
  );
  const sizeLimit = 32767; // due to browser limitations https://html2canvas.hertzen.com/faq
  let moviePrintSize;
  if (isGridView) {
    moviePrintSize = [
    { width: 16384, height: Math.round(16384 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 8192, height: Math.round(8192 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 4096, height: Math.round(4096 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 3072, height: Math.round(3072 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 2048, height: Math.round(2048 * newScaleValueObject.moviePrintAspectRatioInv) },
    { width: 1024, height: Math.round(1024 * newScaleValueObject.moviePrintAspectRatioInv) },
    ];
  } else {
    moviePrintSize = [
    { height: 16384, width: Math.round(16384 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    { height: 8192, width: Math.round(8192 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    { height: 4096, width: Math.round(4096 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    { height: 3072, width: Math.round(3072 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    { height: 2048, width: Math.round(2048 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    { height: 1024, width: Math.round(1024 / newScaleValueObject.timelineMoviePrintAspectRatioInv) },
    ];
  }
  return [
    { value: isGridView ? moviePrintSize[5].width : moviePrintSize[5].height, text: `${moviePrintSize[5].width}px (×${moviePrintSize[5].height}px)`, disabled: ((moviePrintSize[5].width + moviePrintSize[5].height) > sizeLimit), 'data-tid': `${moviePrintSize[5].width}-widthOption` },
    { value: isGridView ? moviePrintSize[4].width : moviePrintSize[4].height, text: `${moviePrintSize[4].width}px (×${moviePrintSize[4].height}px)`, disabled: ((moviePrintSize[4].width + moviePrintSize[4].height) > sizeLimit), 'data-tid': `${moviePrintSize[4].width}-widthOption` },
    { value: isGridView ? moviePrintSize[3].width : moviePrintSize[3].height, text: `${moviePrintSize[3].width}px (×${moviePrintSize[3].height}px)`, disabled: ((moviePrintSize[3].width + moviePrintSize[3].height) > sizeLimit), 'data-tid': `${moviePrintSize[3].width}-widthOption` },
    { value: isGridView ? moviePrintSize[2].width : moviePrintSize[2].height, text: `${moviePrintSize[2].width}px (×${moviePrintSize[2].height}px)`, disabled: ((moviePrintSize[2].width + moviePrintSize[2].height) > sizeLimit), 'data-tid': `${moviePrintSize[2].width}-widthOption` },
    { value: isGridView ? moviePrintSize[1].width : moviePrintSize[1].height, text: `${moviePrintSize[1].width}px (×${moviePrintSize[1].height}px)`, disabled: ((moviePrintSize[1].width + moviePrintSize[1].height) > sizeLimit), 'data-tid': `${moviePrintSize[1].width}-widthOption` },
    { value: isGridView ? moviePrintSize[0].width : moviePrintSize[0].height, text: `${moviePrintSize[0].width}px (×${moviePrintSize[0].height}px)`, disabled: ((moviePrintSize[0].width + moviePrintSize[0].height) > sizeLimit), 'data-tid': `${moviePrintSize[0].width}-widthOption` },
  ];
};

class SettingsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changeSceneCount: false,
    };

    this.onChangeSceneCount = this.onChangeSceneCount.bind(this);
    this.onChangePaperAspectRatio = this.onChangePaperAspectRatio.bind(this);
    this.onChangeShowPaperPreview = this.onChangeShowPaperPreview.bind(this);
    this.onChangeOutputPathFromMovie = this.onChangeOutputPathFromMovie.bind(this);
    this.onChangeTimelineViewFlow = this.onChangeTimelineViewFlow.bind(this);
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
    this.onChangeCachedFramesSize = this.onChangeCachedFramesSize.bind(this);
    this.onChangeOverwrite = this.onChangeOverwrite.bind(this);
    this.onChangeIncludeIndividual = this.onChangeIncludeIndividual.bind(this);
    this.onChangeThumbnailScale = this.onChangeThumbnailScale.bind(this);
    this.onChangeMoviePrintWidth = this.onChangeMoviePrintWidth.bind(this);
  }

  onChangeSceneCount = (e, { checked }) => {
    this.setState({changeSceneCount: checked});
  }

  onChangeTimelineViewFlow = (e, { checked }) => {
    this.props.onTimelineViewFlowClick(checked);
  }

  onChangeShowPaperPreview = (e, { checked }) => {
    this.props.onShowPaperPreviewClick(checked);
  }

  onChangeOutputPathFromMovie = (e, { checked }) => {
    this.props.onOutputPathFromMovieClick(checked);
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

  onChangeCachedFramesSize = (e, { value }) => {
    this.props.onCachedFramesSizeClick(value);
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
    const {
      columnCountTemp,
      file,
      fileScanRunning,
      isGridView,
      onApplyNewGridClick,
      onChangeColumn,
      onChangeColumnAndApply,
      onChangeMargin,
      onChangeMinDisplaySceneLength,
      onChangeOutputPathClick,
      onChangeRow,
      onChangeSceneDetectionThreshold,
      onChangeTimelineViewWidthScale,
      onToggleDetectionChart,
      reCapture,
      recaptureAllFrames,
      rowCountTemp,
      sceneArray,
      secondsPerRowTemp,
      settings,
      showChart,
      thumbCount,
      thumbCountTemp,
      visibilitySettings,
    } = this.props;
    const fileFps = file !== undefined ? file.fps : 25;
    const minutes = file !== undefined ? frameCountToMinutes(file.frameCount, fileFps) : undefined;
    const minutesRounded = Math.round(minutes);
    const cutsPerMinuteRounded = Math.round((thumbCountTemp - 1) / minutes);
    return (
      <Container
        style={{
          marginBottom: `${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px`,
        }}
      >
        <Grid padded inverted>
          { !isGridView &&
            <Grid.Row>
              <Grid.Column width={16}>
                <Statistic inverted size="tiny">
                  <Statistic.Value>{thumbCountTemp}</Statistic.Value>
                  <Statistic.Label>{(thumbCountTemp === 1) ? 'Shot' : 'Shots'}</Statistic.Label>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>/</Statistic.Value>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>~{minutesRounded}</Statistic.Value>
                  <Statistic.Label>{(minutesRounded === 1) ? 'Minute' : 'Minutes'}</Statistic.Label>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>≈</Statistic.Value>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>{cutsPerMinuteRounded}</Statistic.Value>
                  <Statistic.Label>cut/min</Statistic.Label>
                </Statistic>
              </Grid.Column>
            </Grid.Row>
          }
          { isGridView &&
            <Grid.Row>
              <Grid.Column width={16}>
                <Statistic inverted size="tiny">
                  <Statistic.Value>{columnCountTemp}</Statistic.Value>
                  <Statistic.Label>{(columnCountTemp === 1) ? 'Column' : 'Columns'}</Statistic.Label>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>×</Statistic.Value>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>{rowCountTemp}</Statistic.Value>
                  <Statistic.Label>{(rowCountTemp === 1) ? 'Row' : 'Rows'}</Statistic.Label>
                </Statistic>
                <Statistic inverted size="tiny">
                  <Statistic.Value>{(columnCountTemp * rowCountTemp ===
                    thumbCountTemp) ? '=' : '≈'}
                  </Statistic.Value>
                </Statistic>
                <Statistic inverted size="tiny" color={(reCapture) ? 'orange' : undefined}>
                  <Statistic.Value>{thumbCountTemp}</Statistic.Value>
                  <Statistic.Label>{(reCapture) ? 'Count' : 'Count'}</Statistic.Label>
                </Statistic>
              </Grid.Column>
            </Grid.Row>
          }
          { isGridView &&
            <Grid.Row>
              <Grid.Column width={4}>
                Columns
              </Grid.Column>
              <Grid.Column width={12}>
                <SliderWithTooltip
                  data-tid='columnCountSlider'
                  className={styles.slider}
                  min={1}
                  max={20}
                  defaultValue={columnCountTemp}
                  value={columnCountTemp}
                  marks={{
                    1: '1',
                    20: '20',
                  }}
                  handle={handle}
                  onChange={(reCapture && isGridView) ? onChangeColumn :
                    onChangeColumnAndApply}
                />
              </Grid.Column>
            </Grid.Row>
          }
          { isGridView &&
            reCapture &&
            <Grid.Row>
              <Grid.Column width={4}>
                Rows
              </Grid.Column>
              <Grid.Column width={12}>
                <SliderWithTooltip
                  data-tid='rowCountSlider'
                  disabled={!reCapture}
                  className={styles.slider}
                  min={1}
                  max={20}
                  defaultValue={rowCountTemp}
                  value={rowCountTemp}
                  {...(reCapture ? {} : { value: rowCountTemp })}
                  marks={{
                    1: '1',
                    20: '20',
                  }}
                  handle={handle}
                  onChange={onChangeRow}
                />
              </Grid.Column>
            </Grid.Row>
          }
          { !isGridView &&
            <Fragment>
              <Grid.Row>
                <Grid.Column width={4}>
                  Minutes per row
                </Grid.Column>
                <Grid.Column width={12}>
                  <SliderWithTooltip
                    data-tid='minutesPerRowSlider'
                    className={styles.slider}
                    min={10}
                    max={1800}
                    defaultValue={secondsPerRowTemp}
                    value={secondsPerRowTemp}
                    marks={{
                      10: '0.1',
                      60: '1',
                      300: '5',
                      600: '10',
                      1200: '20',
                      1800: '30',
                    }}
                    handle={handle}
                    onChange={this.props.onChangeTimelineViewSecondsPerRow}
                  />
                </Grid.Column>
              </Grid.Row>
              {/* <Grid.Row>
                <Grid.Column width={4}>
                  Flow
                </Grid.Column>
                <Grid.Column width={12}>
                  <Checkbox
                    // data-tid='showPaperPreviewCheckbox'
                    label={
                      <label className={styles.label}>
                        Flow
                      </label>
                    }
                    checked={settings.defaultTimelineViewFlow}
                    onChange={this.onChangeTimelineViewFlow}
                  />
                </Grid.Column>
              </Grid.Row> */}
              <Grid.Row>
                <Grid.Column width={4}>
                  Count
                </Grid.Column>
                <Grid.Column width={12}>
                  <Checkbox
                    data-tid='changeSceneCountCheckbox'
                    label={
                      <label className={styles.label}>
                        Change scene count
                      </label>
                    }
                    checked={this.state.changeSceneCount}
                    onChange={this.onChangeSceneCount}
                  />
                </Grid.Column>
              </Grid.Row>
              {this.state.changeSceneCount && <Fragment>
                <Grid.Row>
                  <Grid.Column width={4}>
                    Shot detection threshold
                  </Grid.Column>
                  <Grid.Column width={12}>
                    <SliderWithTooltip
                      // data-tid='sceneDetectionThresholdSlider'
                      className={styles.slider}
                      min={5}
                      max={40}
                      defaultValue={settings.defaultSceneDetectionThreshold}
                      marks={{
                        5: '5',
                        20: '20',
                        40: '40',
                      }}
                      handle={handle}
                      onChange={onChangeSceneDetectionThreshold}
                    />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={4}>

                  </Grid.Column>
                  <Grid.Column width={12}>
                    <Popup
                      trigger={
                        <Button
                          data-tid='runSceneDetectionBtn'
                          fluid
                          color="orange"
                          loading={fileScanRunning}
                          disabled={fileScanRunning}
                          onClick={() => this.props.runSceneDetection(file.id, file.path, file.useRatio, settings.defaultSceneDetectionThreshold)}
                        >
                          Apply
                        </Button>
                      }
                      className={stylesPop.popup}
                      content="Run shot detection with new threshold"
                      keepInViewPort={false}
                    />
                  </Grid.Column>
                </Grid.Row>
              </Fragment>}
            </Fragment>
          }
          { isGridView &&
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
                  checked={reCapture}
                  onChange={this.onChangeReCapture}
                />
              </Grid.Column>
            </Grid.Row>
          }
          { isGridView &&
            (thumbCount !== thumbCountTemp) &&
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
          { isGridView &&
            <Grid.Row>
              <Grid.Column width={4} />
              <Grid.Column width={12}>
                <Popup
                  trigger={
                    <Button
                      data-tid='applyNewGridBtn'
                      fluid
                      color="orange"
                      disabled={(thumbCount === thumbCountTemp)}
                      onClick={onApplyNewGridClick}
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
          }
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
                checked={settings.defaultShowPaperPreview}
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
                disabled={!settings.defaultShowPaperPreview}
                options={PAPER_LAYOUT_OPTIONS}
                defaultValue={settings.defaultPaperAspectRatioInv}
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
                defaultValue={settings.defaultMarginRatio * settings.defaultMarginSliderFactor}
                marks={{
                  0: '0',
                  20: '20',
                }}
                handle={handle}
                onChange={onChangeMargin}
              />
            </Grid.Column>
          </Grid.Row>
          { !isGridView &&
            <Grid.Row>
              <Grid.Column width={4}>
                Scene width ratio
              </Grid.Column>
              <Grid.Column width={12}>
                <SliderWithTooltip
                  data-tid='sceneWidthRatioSlider'
                  className={styles.slider}
                  min={0}
                  max={100}
                  defaultValue={settings.defaultTimelineViewWidthScale}
                  marks={{
                    0: '-10',
                    50: '0',
                    100: '+10',
                  }}
                  handle={handle}
                  onChange={onChangeTimelineViewWidthScale}
                />
              </Grid.Column>
            </Grid.Row>
          }
          { !isGridView &&
            <Grid.Row>
              <Grid.Column width={4}>
                Min scene width
              </Grid.Column>
              <Grid.Column width={12}>
                <SliderWithTooltip
                  data-tid='minSceneWidthSlider'
                  className={styles.slider}
                  min={0}
                  max={10}
                  defaultValue={Math.round(settings.defaultTimelineViewMinDisplaySceneLengthInFrames / (fileFps * 1.0))}
                  marks={{
                    0: '0',
                    10: '10',
                  }}
                  handle={handle}
                  onChange={onChangeMinDisplaySceneLength}
                />
              </Grid.Column>
            </Grid.Row>
          }
          <Grid.Row>
            <Grid.Column width={4}>
              Options
            </Grid.Column>
            <Grid.Column width={12}>
              <List>
                { isGridView &&
                  <Fragment>
                    <List.Item>
                      <Checkbox
                        data-tid='showHeaderCheckbox'
                        label={
                          <label className={styles.label}>
                            Show header
                          </label>
                        }
                        checked={settings.defaultShowHeader}
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
                        disabled={!settings.defaultShowHeader}
                        checked={settings.defaultShowPathInHeader}
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
                        disabled={!settings.defaultShowHeader}
                        checked={settings.defaultShowDetailsInHeader}
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
                        disabled={!settings.defaultShowHeader}
                        checked={settings.defaultShowTimelineInHeader}
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
                        checked={settings.defaultRoundedCorners}
                        onChange={this.onChangeRoundedCorners}
                      />
                    </List.Item>
                  </Fragment>
                }
                <List.Item>
                  <Checkbox
                    data-tid='showHiddenThumbsCheckbox'
                    label={
                      <label className={styles.label}>
                        Show hidden thumbs
                      </label>
                    }
                    checked={visibilitySettings.visibilityFilter === 'SHOW_ALL'}
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
                    checked={settings.defaultThumbInfo === 'frames'}
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
                    checked={settings.defaultThumbInfo === 'timecode'}
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
                    checked={settings.defaultThumbInfo === 'hideInfo'}
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
                      wordWrap: 'break-word',
                      opacity: settings.defaultOutputPathFromMovie ? '0.5' : '1.0'
                    }}
                  >
                    {settings.defaultOutputPath}
                  </div>
                </List.Item>
                <List.Item>
                  <Button
                    data-tid='changeOutputPathBtn'
                    onClick={onChangeOutputPathClick}
                    disabled={settings.defaultOutputPathFromMovie}
                  >
                    Change...
                  </Button>
                </List.Item>
                <List.Item>
                  <Checkbox
                    data-tid='showPaperPreviewCheckbox'
                    label={
                      <label className={styles.label}>
                        Same as movie file
                      </label>
                    }
                    style={{
                      marginTop: '8px',
                    }}
                    checked={settings.defaultOutputPathFromMovie}
                    onChange={this.onChangeOutputPathFromMovie}
                  />
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
                options={outputSize(file, columnCountTemp, thumbCountTemp, settings, visibilitySettings, sceneArray, secondsPerRowTemp, isGridView)}
                defaultValue={settings.defaultMoviePrintWidth}
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
                defaultValue={settings.defaultOutputFormat}
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
                    checked={settings.defaultSaveOptionOverwrite}
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
                    checked={settings.defaultSaveOptionIncludeIndividual}
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
              Detection chart
            </Grid.Column>
            <Grid.Column width={12}>
              <Popup
                trigger={
                  <Button
                    data-tid='showDetectionChartBtn'
                    // fluid
                    onClick={onToggleDetectionChart}
                  >
                    {showChart ? 'Hide detection chart' : 'Show detection chart'}
                  </Button>
                }
                className={stylesPop.popup}
                content="Show detection chart with mean and difference values per frame"
                keepInViewPort={false}
              />
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
                checked={settings.defaultDetectInOutPoint}
                onChange={this.onChangeDetectInOutPoint}
              />
            </Grid.Column>
          </Grid.Row>
          <Divider inverted />
          <Grid.Row>
            <Grid.Column width={4}>
              Max size cached frames
            </Grid.Column>
            <Grid.Column width={12}>
            <Dropdown
              data-tid='changeCachedFramesSizeDropdown'
              placeholder="Select..."
              selection
              options={CACHED_FRAMES_SIZE_OPTIONS}
              defaultValue={settings.defaultCachedFramesSize || 0}
              onChange={this.onChangeCachedFramesSize}
            />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={12}>
              <Popup
                trigger={
                  <Button
                    data-tid='updateFrameCacheBtn'
                    onClick={recaptureAllFrames}
                  >
                    Update frame cache
                  </Button>
                }
                className={stylesPop.popup}
                content="Recapture all frames and store it in the frame cache (uses max size)"
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
