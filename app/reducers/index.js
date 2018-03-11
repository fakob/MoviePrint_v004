import { combineReducers } from 'redux';
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo';
import thumbsByFileId from './thumbs';
import files from './files';
import settings from './settings';
import thumbsObjUrls from './thumbsObjUrls';
import visibilitySettings from './visibilitySettings';

const rootReducer = combineReducers({
  visibilitySettings,
  thumbsObjUrls,
  undoGroup: undoable(combineReducers({
    settings,
    thumbsByFileId,
    files
  }), {
    filter: excludeAction([
      // 'UPDATE_OBJECTURL_FROM_THUMBLIST', // excluding did not work
      // 'UPDATE_OBJECTURLS_FROM_THUMBLIST',
      // 'UPDATE_OBJECTURL_FROM_POSTERFRAME',
      // 'UPDATE_OBJECTURLS_FROM_POSTERFRAME'
    ]),
    groupBy: groupByActionTypes([
      'UPDATE_FRAMENUMBER_OF_THUMB',
      'UPDATE_OBJECTURL_FROM_THUMBLIST',
      'UPDATE_OBJECTURL_FROM_POSTERFRAME',
      'SET_DEFAULT_MARGIN',
      'SET_DEFAULT_SHOW_HEADER',
      'SET_DEFAULT_ROUNDED_CORNERS',
    ]),
    limit: 50
  })
});

export default rootReducer;
