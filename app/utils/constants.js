// const { app } = require('electron').remote;
// throws error as it would be packed into main.js where this is can not be required

export const MOVIEPRINT_COLORS = [
  '#FF5006',
  '#FFb709',
  '#FF9365',
  '#FFa883',
  '#FFd3c1',
];

// start initialStateJSON
export const VISIBILITY_FILTER = 'SHOW_VISIBLE';
export const SHOW_MOVIELIST = false;
export const SHOW_SETTINGS = false;
export const SHOW_MOVIE_PRINT_VIEW = true;

export const DEFAULT_THUMB_COUNT_MAX = 400;
export const DEFAULT_THUMB_COUNT = 16;
export const DEFAULT_COLUMN_COUNT = 4;
export const DEFAULT_THUMBNAIL_SCALE = 0.25;
export const DEFAULT_MOVIEPRINT_WIDTH = 4096;
export const DEFAULT_MARGIN_RATIO = 0.02;
export const DEFAULT_MARGIN_SLIDER_FACTOR = 200.0;
export const DEFAULT_BORDER_RADIUS_RATIO = 0.04;
export const DEFAULT_HEADER_HEIGHT_RATIO = 0.25;
export const DEFAULT_SHOW_HEADER = false;
export const DEFAULT_ROUNDED_CORNERS = true;
export const DEFAULT_THUMB_INFO = 'hideInfo';
export const DEFAULT_THUMB_INFO_RATIO = 0.075;
// export const DEFAULT_OUTPUT_PATH = app.getPath('desktop'); // throws error see above
export const DEFAULT_OUTPUT_FORMAT = 'png';
export const DEFAULT_SAVE_OPTION_OVERWRITE = false;
export const DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL = false;
export const DEFAULT_VIDEO_PLAYER_HEIGHT = 360;
export const DEFAULT_VIDEO_PLAYER_WIDTH = 640;
export const DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT = 64;
export const DEFAULT_BORDER_MARGIN = 24;
export const DEFAULT_SHOW_PAPER_PREVIEW = true;
export const DEFAULT_PAPER_ASPECTRATIOINV = 1.41;
// end initialStateJSON

export const MENU_HEADER_HEIGHT = 35;
export const MENU_FOOTER_HEIGHT = 35;

export const ZOOM_SCALE = 2;
export const SHOW_PAPER_ADJUSTMENT_SCALE = 0.9;

export const DEFAULT_MOVIE_WIDTH = 1920;
export const DEFAULT_MOVIE_HEIGHT = 1080;
export const DEFAULT_MOVIE_ASPECTRATIO = 1.778;


export const MINIMUM_WIDTH_TO_SHRINK_HOVER = 160; // if smaller then scale hover to 0.7
export const MINIMUM_WIDTH_TO_SHOW_HOVER = 100; // if smaller then do not show hover elements over thumb
export const MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE = 2; // heightOfInOutPointButtons

export const CHANGE_THUMB_STEP = [1, 10, 100];
