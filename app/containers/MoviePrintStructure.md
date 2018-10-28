# File structure

##### Main thread

- main.prod.js
- main.dev.js \* menu.js

##### Renderer thread

- index.js
  _ containers/Root.js
  _ containers/App.js
  _ components/ErrorBoundary.js
  _ components/HeaderComponent.js
  _ containers/FileList.js
  _ components/FileListElement.js
  _ components/VideoPlayer.js
  _ components/ThumbEmpty.js
  _ containers/VisibleThumbGrid.js
  _ components/ThumbGrid.js
  _ components/ThumbGridHeader.js
  _ components/Thumb.js
  _ containers/SettingsList.js
  _ components/Footer.js
  _ components/_ Scrub.js

##### Worker thread (renders the MoviePrint for saving as image)

- worker.js
  _ containers/WorkerRoot.js
  _ containers/WorkerApp.js \* --> containers/VisibleThumbGrid.js

##### Worker openCV thread (handles all opencv interaction, like grabbing frames)

- worker_opencv.js

# Action processes

##### on drop

- dispatch setMovieList
  _ dispatch CLEAR_CURRENT_FILEID
  _ dispatch CLEAR_MOVIE_LIST \* dispatch LOAD_MOVIE_LIST_FROM_DROP
- then load returned file list into filesToLoad Array
- in componentDidUpdate \* ipc send-get-file-details to opencvWorkerWindow
- ipc receive-get-file-details
  _ dispatch updateFileDetails
  _ ipc send-get-poster-frame to opencvWorkerWindow
- ipc receive-get-poster-frame
  _ dispatch updateFileDetailUseRatio
  _ dispatch updateThumbImage \* ipc send-get-in-and-outpoint to opencvWorkerWindow
- ipc receive-get-in-and-outpoint
  _ dispatch updateInOutPoint
  _ dispatch setCurrentFileId if first
  _ dispatch clearThumbs
  _ dispatch addDefaultThumbs
  _ dispatch addThumbs
  _ check DB if thumb is already grabbed
  _ ipc send-get-thumbs to opencvWorkerWindow for every single thumb
  _ dispatch ADD_THUMBS
- ipc receive-get-thumbs for every single thumb \* dispatch updateThumbImage
- remove this file from filesToLoad Array
- --> in componentDidUpdate

##### on saveAllMoviePrints

- set filesToPrint
  - set status to needsThumbs for files which do not have any thumbs loaded
  - set status to undefined for files which can not be printed
  - set status to readyForPrinting for files which already have thumbs
- in componentDidUpdate
  - getThumbsForFile if there is a file which needsThumbs \* --> dispatch addDefaultThumbs
    - ipc receive-get-thumbs
      - when last thumb while saveAllMoviePrints then set status to readyForPrinting
  - ipc action-save-MoviePrint if there is a file which is readyForPrinting
    - set status to printing
    - saveMoviePrint
      - ipc received-saved-file
        - set status to done

# IndexedDB structure

##### frameList (all captured frames)

- frameId
- fileId
- frameNumber
- isPosterFrame
- data (blob)

##### fileScanList (data from all scanned files)

- fileId
- meanArray
- meanColorArray

# Redux structure

##### visibilitySettings

- visibilityFilter
- showMovielist
- showSettings
- defaultView

##### scenesByFileId

- fileId
  - scene Array
    - sceneId
    - start
    - length
    - colorArray

##### thumbsObjUrls

- fileId
  - frameId
    - objectUrl

##### settings (in undoGroup)

- many different settings

##### thumbsByFileId (in undoGroup)

- fileId
  - mode
    - thumbs Array
      - frameId
      - thumbId
      - frameNumber
      - fileId
      - index
      - hidden

##### files Array (in undoGroup)

- id
- lastModified
- lastModifiedDate
- name
- path
- size
- type
- webkitRelativePath
- posterFrameId
- columnCount
- frameCount
- width
- height
- fps
- fourCC
- useRatio
- fadeInPoint
- fadeOutPoint
- objectUrl (from posterframe)

# React components structure

(work in progress)

##### VisibleThumbGrid.js

- `SortedVisibleThumbGrid`
  _ `SortableThumbGrid`
  _ `ThumbgridHeader` \* map through `SortableThumb`
