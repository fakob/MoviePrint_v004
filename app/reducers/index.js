import { combineReducers } from 'redux';
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo';
import sheetsByFileId from './sheetsByFileId';
import files from './files';
import settings from './settings';
import visibilitySettings from './visibilitySettings';

const rootReducer = combineReducers({
  visibilitySettings,
  undoGroup: undoable(combineReducers({
    settings,
    sheetsByFileId,
    files
  }), {
    filter: excludeAction([
      // 'UPDATE_MOVIE_LIST_ITEM_USERATIO'
    ]),
    groupBy: groupByActionTypes([
      'UPDATE_MOVIE_LIST_ITEM_USERATIO',
      'UPDATE_FRAMENUMBER_OF_THUMB',
      'UPDATE_OBJECTURL_FROM_THUMBLIST',
      'UPDATE_SHEET_COLUMNCOUNT',
      'SET_DEFAULT_MARGIN',
      'SET_DEFAULT_SHOW_HEADER',
      'SET_DEFAULT_ROUNDED_CORNERS',
    ]),
    limit: 50
  })
});

export default rootReducer;
