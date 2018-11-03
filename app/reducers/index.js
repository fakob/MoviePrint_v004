import { combineReducers } from 'redux';
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo';
import thumbsByFileId from './thumbs';
import files from './files';
import settings from './settings';
import scenesByFileId from './scenesByFileId';
import thumbsObjUrls from './thumbsObjUrls';
import visibilitySettings from './visibilitySettings';

const rootReducer = combineReducers({
  visibilitySettings,
  thumbsObjUrls,
  undoGroup: undoable(combineReducers({
    settings,
    scenesByFileId,
    thumbsByFileId,
    files
  }), {
    filter: excludeAction([
      // 'UPDATE_OBJECTURL_FROM_THUMBLIST', // excluding did not work
      // 'UPDATE_OBJECTURLS_FROM_THUMBLIST',
      // 'UPDATE_OBJECTURL_FROM_POSTERFRAME',
      // 'UPDATE_OBJECTURLS_FROM_POSTERFRAME'
      // 'UPDATE_MOVIE_LIST_ITEM_USERATIO'
    ]),
    groupBy: groupByActionTypes([
      'UPDATE_MOVIE_LIST_ITEM_USERATIO',
      'UPDATE_FRAMENUMBER_OF_THUMB',
      'UPDATE_OBJECTURL_FROM_THUMBLIST',
      'UPDATE_OBJECTURL_FROM_POSTERFRAME',
      'UPDATE_COLUMNCOUNT_OF_MOVIE_LIST_ITEM',
      'SET_DEFAULT_MARGIN',
      'SET_DEFAULT_SHOW_HEADER',
      'SET_DEFAULT_ROUNDED_CORNERS',
    ]),
    limit: 50
  })
});

export default rootReducer;
