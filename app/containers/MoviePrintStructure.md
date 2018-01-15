Structure
---------
* App
	* Settings
		* Output folder
		* Overwrite
	* Undo/Redo
	* Help
	* Credits
* MovieLoader
	* FilePath
	* MovieLoaded
	* Framerate
	* Movie
		* Framerate
		* Length
		* PixelRatio
		* ImageRatio
		* Size
* MovieGrabber
	* GrabProgress
* DropZone
* ThumbGrid
	* Thumb order
	* Thumb
		* Size
		* Frame number
		* Order number
		* Manipulated
		* ToBeGrabbed
		* Manipulation overlays
		* MovieStill
			* Filter
			* Crop
* MovieList
	* MovieListItem
		* Filename/Path
		* hasBeenPrinted
		* printingFailed
* Output
	* Settings
		* Rows
		* Columns
		* Margin
		* Display Header
		* Display Frames/Timecode
		* Save as individual frames
		* Output format
		* Output size
* Test


Representational
----------------
* `ThumbGrid`
	* thumbs: `Array` of `Thumb`
	* `onThumbClick(id: number)`
* `Thumb`
	* `text: string` is the text to show
	* `manipulated: boolean` is whether it was manipulated
	* `onclick()` is a callback to invoke when a Thumb was clicked.
* `App` is the root component that renders everything

Container
---------
* `VisibleThumbGrid` filters the Thumbs to the current visibility filter and renders a `ThumbGrid`
