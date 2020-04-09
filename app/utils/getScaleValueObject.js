import log from 'electron-log';
import {
  DEFAULT_COLUMN_COUNT,
  DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN,
  DEFAULT_MOVIE_HEIGHT,
  DEFAULT_MOVIE_WIDTH,
  DEFAULT_THUMB_COUNT,
  MARGIN_ADJUSTMENT_SCALE,
  PAPER_ADJUSTMENT_SCALE,
  SHEET_FIT,
  VIDEOPLAYER_THUMB_MARGIN,
  VIEW,
} from './constants';
import { getScenesInRows, getPixelPerFrameRatio } from './utils';

const getScaleValueObject = (
  file,
  settings,
  visibilitySettings,
  columnCount = DEFAULT_COLUMN_COUNT,
  thumbCount = DEFAULT_THUMB_COUNT,
  containerWidth,
  containerHeight = 99999, // very high value so it is not taken into account when not set
  zoomScale,
  showPaperPreview = false,
  forPrinting = false,
  sceneArray = [],
  secondsPerRow = 120.0,
) => {
  const {
    defaultBorderMargin,
    defaultBorderRadiusRatio,
    defaultHeaderHeightRatio,
    defaultMarginRatio,
    defaultMoviePrintWidth,
    defaultPaperAspectRatioInv,
    defaultRoundedCorners,
    defaultScrubContainerMaxHeightRatio,
    defaultScrubWindowMargin,
    defaultScrubWindowWidthRatio,
    defaultShowDetailsInHeader,
    defaultShowHeader,
    defaultShowPathInHeader,
    defaultShowTimelineInHeader,
    defaultThumbnailScale,
    defaultTimelineViewMinDisplaySceneLengthInFrames,
    defaultTimelineViewWidthScale,
    defaultVideoPlayerControllerHeight,
  } = settings;
  const { defaultView } = visibilitySettings;

  const movieWidth = file !== undefined && file.width !== undefined ? file.width : DEFAULT_MOVIE_WIDTH;
  const movieHeight = file !== undefined && file.height !== undefined ? file.height : DEFAULT_MOVIE_HEIGHT;
  const movieAspectRatioInv = (movieHeight * 1.0) / movieWidth;
  const rowCount = Math.ceil(thumbCount / columnCount);
  const showPlayerView = defaultView === VIEW.PLAYERVIEW;
  const containerAspectRatioInv = (containerHeight * 1.0) / containerWidth;

  // headerHeight gets increased depending on how much information is shown inside
  const headerHeightMultiplier =
    1 + (defaultShowPathInHeader + defaultShowDetailsInHeader + defaultShowTimelineInHeader) / 3.0;
  const headerHeight = defaultShowHeader
    ? movieHeight * defaultHeaderHeightRatio * headerHeightMultiplier * defaultThumbnailScale
    : 0;
  const logoHeight = movieHeight * defaultHeaderHeightRatio * defaultThumbnailScale;

  const thumbWidth = movieWidth * defaultThumbnailScale;
  const thumbMargin = movieWidth * defaultMarginRatio * defaultThumbnailScale;
  const borderRadius = defaultRoundedCorners ? movieWidth * defaultBorderRadiusRatio * defaultThumbnailScale : 0;
  const thumbnailWidthPlusMargin = thumbWidth + thumbMargin * 2;
  const thumbnailHeightPlusMargin = thumbWidth * movieAspectRatioInv + thumbMargin * 2;
  const originalMoviePrintWidth = columnCount * thumbnailWidthPlusMargin + thumbMargin;
  const originalMoviePrintWidthForPrinting = columnCount * thumbnailWidthPlusMargin - thumbMargin;
  const originalMoviePrintHeightBody = rowCount * thumbnailHeightPlusMargin;
  const originalMoviePrintHeight = headerHeight + thumbMargin * 2 + originalMoviePrintHeightBody;
  const moviePrintAspectRatioInv = (originalMoviePrintHeight * 1.0) / originalMoviePrintWidth;

  // for playerView
  const videoHeight = (containerHeight * 2) / 3 - defaultVideoPlayerControllerHeight;
  const videoWidth = videoHeight / movieAspectRatioInv;
  let videoPlayerHeight = videoHeight + defaultVideoPlayerControllerHeight;
  let videoPlayerWidth = videoWidth;
  if (videoWidth > containerWidth) {
    videoPlayerWidth = containerWidth - defaultBorderMargin * 2;
    videoPlayerHeight = videoPlayerWidth * movieAspectRatioInv + defaultVideoPlayerControllerHeight;
  }
  const thumbnailHeightForThumbView = videoPlayerHeight / 2 - defaultBorderMargin * 3;
  const thumbnailWidthForThumbView = thumbnailHeightForThumbView / movieAspectRatioInv;
  const borderRadiusForThumbView = thumbnailWidthForThumbView * defaultBorderRadiusRatio;
  const thumbMarginForThumbView = VIDEOPLAYER_THUMB_MARGIN;
  // const thumbMarginForThumbView = Math.max(2, thumbnailWidthForThumbView * defaultMarginRatio);
  const thumbnailWidthPlusMarginForThumbView = thumbnailWidthForThumbView + thumbMarginForThumbView * 2;
  const moviePrintWidthForThumbView =
    thumbCount * thumbnailWidthPlusMarginForThumbView + thumbnailWidthForThumbView / 2; // only one row
  // for playerView

  // for scrubView
  const scrubContainerHeight = Math.min(
    Math.floor(containerHeight * defaultScrubContainerMaxHeightRatio),
    containerWidth * defaultScrubWindowWidthRatio * movieAspectRatioInv,
  );
  const scrubContainerWidth = containerWidth;
  const scrubInnerContainerWidth = Math.min(
    (scrubContainerHeight / movieAspectRatioInv + defaultScrubWindowMargin * 2) * 2,
    scrubContainerWidth,
  );
  const scrubMovieHeight = scrubContainerHeight;
  const scrubMovieWidth = Math.min(
    Math.floor(scrubInnerContainerWidth * defaultScrubWindowWidthRatio),
    scrubContainerHeight / movieAspectRatioInv,
  );
  const scrubInOutMovieWidth = Math.floor(
    (scrubInnerContainerWidth - scrubMovieWidth) / 2 - defaultScrubWindowMargin * 2,
  );
  const scrubInOutMovieHeight = Math.floor(scrubInOutMovieWidth * movieAspectRatioInv);
  // for scrubView

  // calculate paperpreview size for gridview
  let paperMoviePrintWidth = originalMoviePrintWidth;
  let paperMoviePrintHeight = originalMoviePrintHeight;
  let paperAdjustmentScale = 1;
  if (showPaperPreview) {
    paperAdjustmentScale = PAPER_ADJUSTMENT_SCALE;
    if (defaultPaperAspectRatioInv < moviePrintAspectRatioInv) {
      paperMoviePrintWidth = paperMoviePrintHeight / defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintWidth ${paperMoviePrintWidth}`);
    } else {
      paperMoviePrintHeight = paperMoviePrintWidth * defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintHeight ${paperMoviePrintHeight}`);
    }
  }
  // calculate paperpreview size for gridview

  // calculate scaleValue for gridview
  const scaleValueForPrinting = containerWidth / originalMoviePrintWidthForPrinting; // scaleValue for gridView printing
  const scaleValueWidth = containerWidth / (showPaperPreview ? paperMoviePrintWidth : originalMoviePrintWidth);
  const scaleValueHeight = containerHeight / (showPaperPreview ? paperMoviePrintHeight : originalMoviePrintHeight);
  // default is SHEET_FIT.BOTH which is used when showSettings and forPrinting
  const scaleValue = Math.min(scaleValueWidth, scaleValueHeight) * zoomScale * paperAdjustmentScale;
  paperMoviePrintWidth *= scaleValue;
  paperMoviePrintHeight *= scaleValue;
  // calculate scaleValue for gridview

  // calculate new values for gridview
  const newMoviePrintWidth = showPlayerView
    ? moviePrintWidthForThumbView
    : originalMoviePrintWidth * scaleValue + DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN;
  const newMoviePrintHeight = showPlayerView ? originalMoviePrintHeight : newMoviePrintWidth * moviePrintAspectRatioInv;
  const newMoviePrintWidthForPrinting = originalMoviePrintWidthForPrinting * scaleValueForPrinting;
  const newThumbMargin = showPlayerView ? thumbMarginForThumbView : thumbMargin * scaleValue;
  const newThumbWidth = showPlayerView ? thumbnailWidthForThumbView : thumbWidth * scaleValue;
  const newBorderRadius = showPlayerView ? borderRadiusForThumbView : borderRadius * scaleValue;
  const newHeaderHeight = showPlayerView ? headerHeight : headerHeight * scaleValue;
  const newLogoHeight = showPlayerView ? logoHeight : logoHeight * scaleValue;
  // calculate new values for gridview

  // timeline view
  // * set original size
  // * calculate aspect ratio
  // * calculate new width and height depending on container or paper

  // convert 0-50-100 to 0.1-1-10
  const scale =
    defaultTimelineViewWidthScale <= 50
      ? defaultTimelineViewWidthScale / 55.5555 + 0.1
      : (defaultTimelineViewWidthScale - 50) / 5.55555 + 1.0;

  const scenesInRows = getScenesInRows(sceneArray, secondsPerRow);
  const timelineViewRowCount = scenesInRows.length;

  const originalTimelineMoviePrintHeight = defaultMoviePrintWidth; // use default width as height;
  const originalTimelineMoviePrintWidth = originalTimelineMoviePrintHeight * scale;
  const timelineMoviePrintAspectRatioInv = (originalTimelineMoviePrintHeight * 1.0) / originalTimelineMoviePrintWidth;

  const adjustmentScale = showPaperPreview ? PAPER_ADJUSTMENT_SCALE * MARGIN_ADJUSTMENT_SCALE : MARGIN_ADJUSTMENT_SCALE; // used to create a small margin around
  let previewMoviePrintTimelineHeight;
  let previewMoviePrintTimelineWidth;

  // if container ratio is smaller then calculate new width and then height from it
  // if container ratio is larger then calculate new height and then width from it
  const containerOrPaperAspectRatioInv = showPaperPreview ? defaultPaperAspectRatioInv : containerAspectRatioInv;
  if (containerOrPaperAspectRatioInv < timelineMoviePrintAspectRatioInv) {
    // use containerWidth if paper/container ratio is smaller than container ratio else calculate width from container height and paper/container ratio
    const containerOrPaperWidth =
      containerOrPaperAspectRatioInv > containerAspectRatioInv
        ? containerHeight / containerOrPaperAspectRatioInv
        : containerWidth;
    previewMoviePrintTimelineHeight = containerOrPaperWidth * containerOrPaperAspectRatioInv * adjustmentScale;
    previewMoviePrintTimelineWidth =
      ((containerOrPaperWidth * containerOrPaperAspectRatioInv) / timelineMoviePrintAspectRatioInv) * adjustmentScale;
    // log.debug(`calculate new previewMoviePrintTimelineWidth ${previewMoviePrintTimelineWidth}/${((containerOrPaperWidth * containerOrPaperAspectRatioInv) / timelineMoviePrintAspectRatioInv)}
    //   ${previewMoviePrintTimelineHeight}/${containerOrPaperWidth * containerOrPaperAspectRatioInv}`);
  } else {
    // use containerHeight if paper/container ratio is larger than container ratio else calculate height from container width and paper/container ratio
    const containerOrPaperHeight =
      containerOrPaperAspectRatioInv < containerAspectRatioInv
        ? containerWidth * containerOrPaperAspectRatioInv
        : containerHeight;
    previewMoviePrintTimelineWidth = (containerOrPaperHeight / containerOrPaperAspectRatioInv) * adjustmentScale;
    previewMoviePrintTimelineHeight =
      (containerOrPaperHeight / containerOrPaperAspectRatioInv) * timelineMoviePrintAspectRatioInv * adjustmentScale;
    // log.debug(`calculate new previewMoviePrintTimelineHeight ${previewMoviePrintTimelineHeight}/${(containerOrPaperHeight / containerOrPaperAspectRatioInv) * timelineMoviePrintAspectRatioInv}
    // ${previewMoviePrintTimelineWidth}/${containerOrPaperHeight / containerOrPaperAspectRatioInv}`);
  }

  // get values depending on if printing or not
  const newMoviePrintTimelineWidth = forPrinting ? originalTimelineMoviePrintWidth : previewMoviePrintTimelineWidth;
  const newMoviePrintTimelineHeight = forPrinting ? originalTimelineMoviePrintHeight : previewMoviePrintTimelineHeight;

  // the value 50.0 compensates for the low value range of defaultMarginRatio as it is also used for the thumbview
  const thumbMarginTimeline = forPrinting
    ? (originalTimelineMoviePrintHeight / 1024) * defaultMarginRatio * 50.0
    : defaultMarginRatio * 50.0;

  // calculate rest
  const newMoviePrintTimelineRowHeight = Math.floor(
    (newMoviePrintTimelineHeight - thumbMarginTimeline * timelineViewRowCount * 2) / timelineViewRowCount,
  );
  // console.log(scenesInRows);
  const newMoviePrintTimelinePixelPerFrameRatio = getPixelPerFrameRatio(
    scenesInRows,
    thumbMarginTimeline,
    newMoviePrintTimelineWidth,
    defaultTimelineViewMinDisplaySceneLengthInFrames,
  );

  // console.log(newMoviePrintTimelinePixelPerFrameRatio);
  // timeline view

  const scaleValueObject = {
    containerWidth,
    containerHeight,
    containerAspectRatioInv,
    aspectRatioInv: movieAspectRatioInv,
    newMoviePrintWidth,
    newMoviePrintHeight,
    moviePrintAspectRatioInv,
    newThumbMargin,
    newThumbWidth,
    newBorderRadius,
    newHeaderHeight,
    newLogoHeight,
    videoPlayerHeight,
    videoPlayerWidth,
    scrubMovieWidth,
    scrubMovieHeight,
    scrubInOutMovieWidth,
    scrubInOutMovieHeight,
    scrubContainerHeight,
    scrubContainerWidth,
    scrubInnerContainerWidth,
    newMoviePrintWidthForPrinting,
    newMoviePrintTimelineWidth,
    newMoviePrintTimelineHeight,
    newMoviePrintTimelineRowHeight,
    newMoviePrintTimelinePixelPerFrameRatio,
    timelineMoviePrintAspectRatioInv,
    thumbMarginTimeline,
    scenesInRows,
    paperMoviePrintWidth,
    paperMoviePrintHeight,
  };
  // log.debug(scaleValueObject);
  return scaleValueObject;
};

export default getScaleValueObject;
