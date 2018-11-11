import log from 'electron-log';
import {
  DEFAULT_THUMB_COUNT, DEFAULT_COLUMN_COUNT, DEFAULT_MOVIE_WIDTH, DEFAULT_MOVIE_HEIGHT,
  SHOW_PAPER_ADJUSTMENT_SCALE, DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN, VIEW, SHEET_FIT
} from './constants';

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
) => {
  const movieWidth = (file !== undefined && file.width !== undefined ? file.width : DEFAULT_MOVIE_WIDTH);
  const movieHeight = (file !== undefined && file.height !== undefined ? file.height : DEFAULT_MOVIE_HEIGHT);
  const movieAspectRatioInv = (movieHeight * 1.0) / movieWidth;
  const rowCount = Math.ceil(thumbCount / columnCount);
  const showPlayerView = visibilitySettings.defaultView === VIEW.PLAYERVIEW;
  const sheetFit = visibilitySettings.defaultSheetFit;
  const showSettings = visibilitySettings.showSettings;

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
  const moviePrintWidth = columnCount * thumbnailWidthPlusMargin + thumbMargin;
  const moviePrintWidthForPrinting = columnCount * thumbnailWidthPlusMargin - thumbMargin;
  const moviePrintHeightBody = rowCount * thumbnailHeightPlusMargin;
  const moviePrintHeight = headerHeight + (thumbMargin * 2) + moviePrintHeightBody;
  const moviePrintAspectRatioInv = (moviePrintHeight * 1.0) / moviePrintWidth;

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

  let paperMoviePrintWidth = moviePrintWidth;
  let paperMoviePrintHeight = moviePrintHeight;
  let showPaperAdjustmentScale = 1;
  if (showPaperPreview) {
    showPaperAdjustmentScale = SHOW_PAPER_ADJUSTMENT_SCALE;
    if (settings.defaultPaperAspectRatioInv < moviePrintAspectRatioInv) {
      paperMoviePrintWidth = paperMoviePrintHeight / settings.defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintWidth ${paperMoviePrintWidth}`);
    } else {
      paperMoviePrintHeight = paperMoviePrintWidth * settings.defaultPaperAspectRatioInv;
      // log.debug(`calculate new paperMoviePrintHeight ${paperMoviePrintHeight}`);
    }
  }

  const scaleValueWidth = containerWidth / (showPaperPreview ? paperMoviePrintWidth : moviePrintWidth);
  const scaleValueHeight = containerHeight / (showPaperPreview ? paperMoviePrintHeight : moviePrintHeight);

  // default is SHEET_FIT.BOTH which is used when showSettings and forPrinting
  let scaleValue = Math.min(scaleValueWidth, scaleValueHeight) * zoomScale * showPaperAdjustmentScale;
  if (!forPrinting && !showSettings && sheetFit === SHEET_FIT.WIDTH) {
    scaleValue = scaleValueWidth * zoomScale * showPaperAdjustmentScale;
  } else if (!forPrinting && !showSettings && sheetFit === SHEET_FIT.HEIGHT) {
    scaleValue = scaleValueHeight * zoomScale * showPaperAdjustmentScale;
  }
  const scaleValueForPrinting = containerWidth / moviePrintWidthForPrinting;

  const newMoviePrintWidth =
    showPlayerView ? moviePrintWidthForThumbView : moviePrintWidth * scaleValue + DEFAULT_MIN_MOVIEPRINTWIDTH_MARGIN;
  const newMoviePrintHeight = showPlayerView ? moviePrintHeight : (newMoviePrintWidth * moviePrintAspectRatioInv);
  const newMoviePrintWidthForPrinting = moviePrintWidthForPrinting * scaleValueForPrinting;
  const newThumbMargin = showPlayerView ? thumbMarginForThumbView : thumbMargin * scaleValue;
  const newThumbWidth = showPlayerView ? thumbnailWidthForThumbView : thumbWidth * scaleValue;
  const newBorderRadius = showPlayerView ? borderRadiusForThumbView : borderRadius * scaleValue;
  const newHeaderHeight = showPlayerView ? headerHeight : headerHeight * scaleValue;
  const newLogoHeight = showPlayerView ? logoHeight : logoHeight * scaleValue;
  const newScaleValue = showPlayerView ? settings.defaultThumbnailScale : settings.defaultThumbnailScale * scaleValue;

  const scaleValueObject = {
    containerWidth,
    containerHeight,
    aspectRatioInv: movieAspectRatioInv,
    newMoviePrintWidth,
    newMoviePrintHeight,
    moviePrintAspectRatioInv,
    newThumbMargin,
    newThumbWidth,
    newBorderRadius,
    newHeaderHeight,
    newLogoHeight,
    newScaleValue,
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
  };
  // log.debug(scaleValueObject);
  return scaleValueObject;
};

export default getScaleValueObject;
