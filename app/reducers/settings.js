const settings = (state = {}, action) => {
  switch (action.type) {
    case 'CLEAR_CURRENT_FILEID':
      return { ...state, currentFileId: undefined };
    case 'SET_CURRENT_FILEID':
      return { ...state, currentFileId: action.fileId };
    case 'SET_DEFAULT_THUMB_COUNT':
      return { ...state, defaultThumbCount: action.defaultThumbCount };
    case 'SET_DEFAULT_COLUMN_COUNT':
      return { ...state, defaultColumnCount: action.defaultColumnCount };
    case 'SET_DEFAULT_THUMBNAIL_SCALE':
      return { ...state, defaultThumbnailScale: action.defaultThumbnailScale };
    case 'SET_DEFAULT_MARGIN':
      return { ...state, defaultMargin: action.defaultMargin };
    case 'SET_DEFAULT_SHOW_HEADER':
      return { ...state, defaultShowHeader: action.defaultShowHeader };
    case 'SET_DEFAULT_ROUNDED_CORNERS':
      return { ...state, defaultRoundedCorners: action.defaultRoundedCorners };
    case 'SET_DEFAULT_THUMB_INFO':
      return { ...state, defaultThumbInfo: action.defaultThumbInfo };
    case 'SET_DEFAULT_OUTPUT_SCALE':
      return { ...state, defaultOutputScaleCompensator: action.defaultOutputScaleCompensator };
    case 'SET_DEFAULT_OUTPUT_PATH':
      return { ...state, defaultOutputPath: action.defaultOutputPath };
    case 'SET_DEFAULT_OUTPUT_FORMAT':
      return { ...state, defaultOutputFormat: action.defaultOutputFormat };
    case 'SET_DEFAULT_SAVE_OPTION_OVERWRITE':
      return { ...state, defaultSaveOptionOverwrite: action.defaultSaveOptionOverwrite };
    case 'SET_DEFAULT_SAVE_OPTION_SAVE_INDIVIDUAL':
      return { ...state, defaultSaveOptionSaveIndividual: action.defaultSaveOptionSaveIndividual };
    default:
      return state;
  }
};

export default settings;
