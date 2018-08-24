# File structure
##### Main thread
* main.prod.js
* main.dev.js
	* menu.js


##### Renderer thread
* index.js
	* containers/Root.js
		* containers/App.js
			* components/ErrorBoundary.js
			* components/HeaderComponent.js
			* containers/FileList.js
				* components/FileListElement.js
			* components/VideoPlayer.js
			* components/ThumbEmpty.js
			* containers/VisibleThumbGrid.js
				* components/ThumbGrid.js
					* components/ThumbGridHeader.js
					* components/Thumb.js
			* containers/SettingsList.js
			* components/Footer.js
			* components/* Scrub.js


##### Worker thread (renders the MoviePrint for saving as image)
* worker.js
	* containers/WorkerRoot.js
		* containers/WorkerApp.js
		   * --> containers/VisibleThumbGrid.js


##### Worker openCV thread (handles all opencv interaction, like grabbing frames)
* worker_opencv.js


# Action processes
##### on drop
* dispatch setMovieList
	* dispatch CLEAR_CURRENT_FILEID
	* dispatch CLEAR_MOVIE_LIST
	* dispatch LOAD_MOVIE_LIST_FROM_DROP
* then load returned file list into filesToLoad Array
* in componentDidUpdate
	* ipc send-get-file-details to opencvWorkerWindow
* ipc receive-get-file-details
	* dispatch updateFileDetails
	* ipc send-get-poster-frame to opencvWorkerWindow
* ipc receive-get-poster-frame
	* dispatch updateFileDetailUseRatio
	* dispatch updateThumbImage
	* ipc send-get-in-and-outpoint to opencvWorkerWindow
* ipc receive-get-in-and-outpoint
	* dispatch updateInOutPoint
	* dispatch setCurrentFileId if first
	* dispatch clearThumbs
	* dispatch addDefaultThumbs
		* dispatch addThumbs
			* check DB if thumb is already grabbed
			* ipc send-get-thumbs to opencvWorkerWindow for every single thumb
				* dispatch ADD_THUMBS
* ipc receive-get-thumbs for every single thumb
	* dispatch updateThumbImage
* remove this file from filesToLoad Array
* --> in componentDidUpdate

# IndexedDB structure
##### frameList (all captured frames)
* frameId
* fileId
* frameNumber
* isPosterFrame
* data (blob)

##### fileScanList (data from all scanned files)
* fileId
* meanArray

# Redux structure
##### visibilitySettings
* visibilityFilter
* showMovielist
* showSettings
* showMoviePrintView

##### thumbsObjUrls
* fileId
  * frameId
    * objectUrl

##### settings (in undoGroup)
* many different settings

##### thumbsByFileId (in undoGroup)
* fileId
  * thumbs Array
    * frameId
    * thumbId
    * frameNumber
    * fileId
    * index
    * hidden

##### files Array (in undoGroup)
  * id
  * lastModified
  * lastModifiedDate
  * name
  * path
  * size
  * type
  * webkitRelativePath
  * posterFrameId
  * columnCount
  * frameCount
  * width
  * height
  * fps
  * fourCC
  * useRatio
  * fadeInPoint
  * fadeOutPoint
  * objectUrl (from posterframe)


# React components structure
(work in progress)
##### VisibleThumbGrid.js
* `SortedVisibleThumbGrid`
	* `SortableThumbGrid`
		* `ThumbgridHeader`
		* map through `SortableThumb`
