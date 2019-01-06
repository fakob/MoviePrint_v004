import log from 'electron-log';
import {
  DEFAULT_THUMB_COUNT, DEFAULT_COLUMN_COUNT, DEFAULT_MOVIE_WIDTH, DEFAULT_MOVIE_HEIGHT,
  PAPER_ADJUSTMENT_SCALE, DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN, VIEW, SHEET_FIT, MARGIN_ADJUSTMENT_SCALE
} from './constants';
import {
  getWidthOfLongestRow,
  getScenesInRows,
  getPixelPerFrameRatio,
} from './utils';

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
) => {
  const movieWidth = (file !== undefined && file.width !== undefined ? file.width : DEFAULT_MOVIE_WIDTH);
  const movieHeight = (file !== undefined && file.height !== undefined ? file.height : DEFAULT_MOVIE_HEIGHT);
  const movieAspectRatioInv = (movieHeight * 1.0) / movieWidth;
  const rowCount = Math.ceil(thumbCount / columnCount);
  const showPlayerView = visibilitySettings.defaultView === VIEW.PLAYERVIEW;
  const sheetFit = visibilitySettings.defaultSheetFit;
  const showSettings = visibilitySettings.showSettings;
  const containerAspectRatioInv = (containerHeight * 1.0) / containerWidth;

  // headerHeight gets increased depending on how much information is shown inside
  const headerHeightMultiplier = 1 + ((settings.defaultShowPathInHeader + settings.defaultShowDetailsInHeader + settings.defaultShowTimelineInHeader) / 3.0);
  const headerHeight = settings.defaultShowHeader ? movieHeight *
    settings.defaultHeaderHeightRatio * headerHeightMultiplier * settings.defaultThumbnailScale : 0;
  const logoHeight = movieHeight * settings.defaultHeaderHeightRatio * settings.defaultThumbnailScale;

  const thumbWidth = movieWidth * settings.defaultThumbnailScale;
  const thumbMargin = movieWidth * settings.defaultMarginRatio * settings.defaultThumbnailScale;
  const borderRadius = settings.defaultRoundedCorners ? movieWidth *
    settings.defaultBorderRadiusRatio * settings.defaultThumbnailScale : 0;
  const thumbnailWidthPlusMargin = thumbWidth + (thumbMargin * 2);
  const thumbnailHeightPlusMargin = (thumbWidth * movieAspectRatioInv) + (thumbMargin * 2);
  const originalMoviePrintWidth = columnCount * thumbnailWidthPlusMargin + thumbMargin;
  const originalMoviePrintWidthForPrinting = columnCount * thumbnailWidthPlusMargin - thumbMargin;
  const originalMoviePrintHeightBody = rowCount * thumbnailHeightPlusMargin;
  const originalMoviePrintHeight = headerHeight + (thumbMargin * 2) + originalMoviePrintHeightBody;
  const moviePrintAspectRatioInv = (originalMoviePrintHeight * 1.0) / originalMoviePrintWidth;

  // for playerView
  const videoHeight = ((containerHeight * 2) / 3) - settings.defaultVideoPlayerControllerHeight;
  const videoWidth = videoHeight / movieAspectRatioInv;
  let videoPlayerHeight = videoHeight + settings.defaultVideoPlayerControllerHeight;
  let videoPlayerWidth = videoWidth;
  if (videoWidth > containerWidth) {
    videoPlayerWidth = containerWidth - (settings.defaultBorderMargin * 2);
    videoPlayerHeight = (videoPlayerWidth * movieAspectRatioInv) +
      settings.defaultVideoPlayerControllerHeight;
  }
  const thumbnailHeightForThumbView =
    ((videoPlayerHeight / 2) - (settings.defaultBorderMargin * 3));
  const thumbnailWidthForThumbView = thumbnailHeightForThumbView / movieAspectRatioInv;
  const borderRadiusForThumbView = thumbnailWidthForThumbView * settings.defaultBorderRadiusRatio;
  const thumbMarginForThumbView = Math.max(2, thumbnailWidthForThumbView * settings.defaultMarginRatio);
  const thumbnailWidthPlusMarginForThumbView =
    thumbnailWidthForThumbView + (thumbMarginForThumbView * 2);
  const moviePrintWidthForThumbView =
    (thumbCount * thumbnailWidthPlusMarginForThumbView) + (thumbnailWidthForThumbView / 2); // only one row
    // for playerView

  // for scrubView
  const scrubContainerHeight = Math.min(
    Math.floor(containerHeight * settings.defaultScrubContainerMaxHeightRatio),
    containerWidth * settings.defaultScrubWindowWidthRatio * movieAspectRatioInv
  )
  const scrubContainerWidth = containerWidth;
  const scrubInnerContainerWidth = Math.min(
    (scrubContainerHeight / movieAspectRatioInv + settings.defaultScrubWindowMargin * 2) * 2,
    scrubContainerWidth
  );
  const scrubMovieHeight = scrubContainerHeight;
  const scrubMovieWidth = Math.min(
    Math.floor(scrubInnerContainerWidth * settings.defaultScrubWindowWidthRatio),
    scrubContainerHeight / movieAspectRatioInv
  );
  const scrubInOutMovieWidth = Math.floor((scrubInnerContainerWidth - scrubMovieWidth) / 2 - (settings.defaultScrubWindowMargin * 2));
  const scrubInOutMovieHeight = Math.floor(scrubInOutMovieWidth * movieAspectRatioInv);
  // for scrubView

  // calculate paperpreview size for gridview
  let paperMoviePrintWidth = originalMoviePrintWidth;
  let paperMoviePrintHeight = originalMoviePrintHeight;
  let paperAdjustmentScale = 1;
  if (showPaperPreview) {
    paperAdjustmentScale = PAPER_ADJUSTMENT_SCALE;
    if (settings.defaultPaperAspectRatioInv < moviePrintAspectRatioInv) {
      paperMoviePrintWidth = paperMoviePrintHeight / settings.defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintWidth ${paperMoviePrintWidth}`);
    } else {
      paperMoviePrintHeight = paperMoviePrintWidth * settings.defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintHeight ${paperMoviePrintHeight}`);
    }
  }
  // calculate paperpreview size for gridview

  // calculate scaleValue for gridview
  const scaleValueForPrinting = containerWidth / originalMoviePrintWidthForPrinting; // scaleValue for gridView printing
  const scaleValueWidth = containerWidth / (showPaperPreview ? paperMoviePrintWidth : originalMoviePrintWidth);
  const scaleValueHeight = containerHeight / (showPaperPreview ? paperMoviePrintHeight : originalMoviePrintHeight);
  // default is SHEET_FIT.BOTH which is used when showSettings and forPrinting
  let scaleValue = Math.min(scaleValueWidth, scaleValueHeight) * zoomScale * paperAdjustmentScale;
  if (!forPrinting && !showSettings && sheetFit === SHEET_FIT.WIDTH) {
    scaleValue = scaleValueWidth * zoomScale * paperAdjustmentScale;
  } else if (!forPrinting && !showSettings && sheetFit === SHEET_FIT.HEIGHT) {
    scaleValue = scaleValueHeight * zoomScale * paperAdjustmentScale;
  }
  paperMoviePrintWidth *= scaleValue;
  paperMoviePrintHeight *= scaleValue;
  // calculate scaleValue for gridview

  // calculate new values for gridview
  const newMoviePrintWidth =
    showPlayerView ? moviePrintWidthForThumbView : originalMoviePrintWidth * scaleValue + DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN;
  const newMoviePrintHeight = showPlayerView ? originalMoviePrintHeight : (newMoviePrintWidth * moviePrintAspectRatioInv);
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

  const minutesPerRow = settings.defaultTimelineViewMinutesPerRow;

  // convert 0-50-100 to 0.1-1-10
  const scale = settings.defaultTimelineViewWidthScale <= 50 ?
    (settings.defaultTimelineViewWidthScale / 55.5555) + 0.1 : ((settings.defaultTimelineViewWidthScale - 50) / 5.55555) + 1.0;

  const scenesInRows = getScenesInRows(
    sceneArray,
    minutesPerRow,
  );
  const timelineViewRowCount = scenesInRows.length;

  const originalTimelineMoviePrintHeight = settings.defaultMoviePrintWidth; // use default width as height;
  const originalTimelineMoviePrintWidth = originalTimelineMoviePrintHeight * scale;
  const timelineMoviePrintAspectRatioInv = originalTimelineMoviePrintHeight * 1.0 / originalTimelineMoviePrintWidth;

  const adjustmentScale = showPaperPreview ? PAPER_ADJUSTMENT_SCALE * MARGIN_ADJUSTMENT_SCALE : MARGIN_ADJUSTMENT_SCALE; // used to create a small margin around
  let previewMoviePrintTimelineHeight;
  let previewMoviePrintTimelineWidth;

  // if container ratio is smaller then calculate new width and then height from it
  // if container ratio is larger then calculate new height and then width from it
  const containerOrPaperAspectRatioInv = showPaperPreview ? settings.defaultPaperAspectRatioInv : containerAspectRatioInv;
  if (containerOrPaperAspectRatioInv < timelineMoviePrintAspectRatioInv) {
    // use containerWidth if paper/container ratio is smaller than container ratio else calculate width from container height and paper/container ratio
    const containerOrPaperWidth = containerOrPaperAspectRatioInv > containerAspectRatioInv ? containerHeight / containerOrPaperAspectRatioInv : containerWidth;
    previewMoviePrintTimelineHeight = containerOrPaperWidth * containerOrPaperAspectRatioInv * adjustmentScale;
    previewMoviePrintTimelineWidth = ((containerOrPaperWidth * containerOrPaperAspectRatioInv) / timelineMoviePrintAspectRatioInv) * adjustmentScale;
    // log.debug(`calculate new previewMoviePrintTimelineWidth ${previewMoviePrintTimelineWidth}/${((containerOrPaperWidth * containerOrPaperAspectRatioInv) / timelineMoviePrintAspectRatioInv)}
    //   ${previewMoviePrintTimelineHeight}/${containerOrPaperWidth * containerOrPaperAspectRatioInv}`);
  } else {
    // use containerHeight if paper/container ratio is larger than container ratio else calculate height from container width and paper/container ratio
    const containerOrPaperHeight = containerOrPaperAspectRatioInv < containerAspectRatioInv ? containerWidth * containerOrPaperAspectRatioInv : containerHeight;
    previewMoviePrintTimelineWidth = (containerOrPaperHeight / containerOrPaperAspectRatioInv) * adjustmentScale;
    previewMoviePrintTimelineHeight = (containerOrPaperHeight / containerOrPaperAspectRatioInv) * timelineMoviePrintAspectRatioInv * adjustmentScale;
    // log.debug(`calculate new previewMoviePrintTimelineHeight ${previewMoviePrintTimelineHeight}/${(containerOrPaperHeight / containerOrPaperAspectRatioInv) * timelineMoviePrintAspectRatioInv}
      // ${previewMoviePrintTimelineWidth}/${containerOrPaperHeight / containerOrPaperAspectRatioInv}`);
  }

  // get values depending on if printing or not
  const newMoviePrintTimelineWidth = forPrinting ? originalTimelineMoviePrintWidth : previewMoviePrintTimelineWidth;
  const newMoviePrintTimelineHeight = forPrinting ? originalTimelineMoviePrintHeight : previewMoviePrintTimelineHeight;
  // calculate thumbMargin relative to rough rowheight
  // const thumbMarginTimeline = (newMoviePrintTimelineHeight / timelineViewRowCount) * (thumbMargin / 200.0);
  const thumbMarginTimeline = forPrinting ? originalTimelineMoviePrintHeight / 1024 * thumbMargin * 0.1 : thumbMargin * 0.1;

  // const previewTimelineScaleValue = Math.min(
  //   newMoviePrintTimelineWidth * 1.0 / originalTimelineMoviePrintWidth,
  //   newMoviePrintTimelineHeight * 1.0 / originalTimelineMoviePrintHeight
  // );


  // calculate rest
  const newMoviePrintTimelineRowHeight = Math.floor((newMoviePrintTimelineHeight - thumbMarginTimeline * timelineViewRowCount * 2) / timelineViewRowCount);
  // console.log(scenesInRows);
  const newMoviePrintTimelinePixelPerFrameRatio = getPixelPerFrameRatio(
    scenesInRows,
    thumbMarginTimeline,
    newMoviePrintTimelineWidth,
    settings.defaultTimelineViewMinDisplaySceneLengthInFrames,
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
