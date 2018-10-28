const settings = (state = {}, action) => {
  switch (action.type) {
    case 'CLEAR_CURRENT_FILEID':
      return { ...state, currentFileId: undefined };
    case 'SET_EMAIL_ADDRESS':
      return { ...state, emailAddress: action.emailAddress };
    case 'SET_CURRENT_FILEID':
      return { ...state, currentFileId: action.fileId };
    case 'SET_DEFAULT_THUMB_COUNT':
      return { ...state, defaultThumbCount: action.defaultThumbCount };
    case 'SET_DEFAULT_COLUMN_COUNT':
      return { ...state, defaultColumnCount: action.defaultColumnCount };
    case 'SET_DEFAULT_THUMBNAIL_SCALE':
      return { ...state, defaultThumbnailScale: action.defaultThumbnailScale };
    case 'SET_DEFAULT_MOVIEPRINT_WIDTH':
      return { ...state, defaultMoviePrintWidth: action.defaultMoviePrintWidth };
    case 'SET_DEFAULT_MARGIN':
      return { ...state, defaultMarginRatio: action.defaultMarginRatio };
    case 'SET_DEFAULT_SHOW_HEADER':
      return { ...state, defaultShowHeader: action.defaultShowHeader };
    case 'SET_DEFAULT_PATH_IN_HEADER':
      return { ...state, defaultShowPathInHeader: action.defaultShowPathInHeader };
    case 'SET_DEFAULT_DETAILS_IN_HEADER':
      return { ...state, defaultShowDetailsInHeader: action.defaultShowDetailsInHeader };
    case 'SET_DEFAULT_TIMELINE_IN_HEADER':
      return { ...state, defaultShowTimelineInHeader: action.defaultShowTimelineInHeader };
    case 'SET_DEFAULT_ROUNDED_CORNERS':
      return { ...state, defaultRoundedCorners: action.defaultRoundedCorners };
    case 'SET_DEFAULT_THUMB_INFO':
      return { ...state, defaultThumbInfo: action.defaultThumbInfo };
    case 'SET_DEFAULT_OUTPUT_PATH':
      return { ...state, defaultOutputPath: action.defaultOutputPath };
    case 'SET_DEFAULT_OUTPUT_FORMAT':
      return { ...state, defaultOutputFormat: action.defaultOutputFormat };
    case 'SET_DEFAULT_SAVE_OPTION_OVERWRITE':
      return { ...state, defaultSaveOptionOverwrite: action.defaultSaveOptionOverwrite };
    case 'SET_DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL':
      return {
        ...state,
        defaultSaveOptionIncludeIndividual: action.defaultSaveOptionIncludeIndividual
      };
    case 'SET_DEFAULT_SHOW_PAPER_PREVIEW':
      return { ...state, defaultShowPaperPreview: action.defaultShowPaperPreview };
    case 'SET_DEFAULT_PAPER_ASPECT_RATIO_INV':
      return { ...state, defaultPaperAspectRatioInv: action.defaultPaperAspectRatioInv };
    case 'SET_DEFAULT_DETECT_INOUTPOINT':
      return { ...state, defaultDetectInOutPoint: action.defaultDetectInOutPoint };
    case 'SET_DEFAULT_SCENE_DETECTION_THRESHOLD':
      return { ...state, defaultSceneDetectionThreshold: action.defaultSceneDetectionThreshold };
    case 'SET_DEFAULT_SCENE_DETECTION_ROW_COUNT':
      return { ...state, defaultSceneDetectionRowCount: action.defaultSceneDetectionRowCount };
    default:
      return state;
  }
};

export default settings;
