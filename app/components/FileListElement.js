// @flow
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Image, Input, Icon, Popup, Dropdown, Label } from 'semantic-ui-react';
import { truncate, truncatePath, frameCountToTimeCode, formatBytes, sanitizeString } from '../utils/utils';
import styles from './FileList.css';
import stylesPop from './Popup.css';
import {
  EXPORT_FORMAT_OPTIONS,
  SHEET_TYPE,
  SHEET_VIEW,
} from '../utils/constants';


const FileListElement = ({
  currentFileId,
  currentSheetId,
  fileId,
  fps,
  frameCount,
  fileScanStatus,
  fileMissingStatus,
  height,
  name,
  objectUrl,
  onAddIntervalSheetClick,
  onChangeSheetViewClick,
  onSubmitMoviePrintNameClick,
  onDeleteSheetClick,
  onDuplicateSheetClick,
  onExportSheetClick,
  onFileListElementClick,
  onScanMovieListItemClick,
  onReplaceMovieListItemClick,
  onEditTransformListItemClick,
  onRemoveMovieListItem,
  onSetSheetClick,
  path,
  sheetsObject,
  size,
  width,
}) => {

  const inputRef = useRef(null);
  const [input, setInput] = useState({
    isRenaming: false, // initial state
    isHovering: false, // initial state
    })
  const sheetsArray = Object.getOwnPropertyNames(sheetsObject);

  const onSubmitMoviePrintName = (e, sheetId) => {
    // console.log(e.currentTarget.value);
    if (e.key === 'Enter' || e.key === undefined) {
      const value = sanitizeString(e.target.value);
      // console.log(value);
      e.stopPropagation();
      onSubmitMoviePrintNameClick(fileId, sheetId, value);
      setInput({
        ...input,
        [e.currentTarget.name]: value,
        'isRenaming': false, // reset isRenaming
        'isHovering': false, // reset isHovering
      })
    }
  }

  useEffect(() => {
    if (input.isRenaming) {
      inputRef.current.select();
    }
  }, [input.isRenaming]);

  const onStartRenameClickWithStop = (e, sheetId) => {
    e.stopPropagation();
    let valueToSet;
    if (input.isRenaming === sheetId) {
      valueToSet = false;
    } else {
      valueToSet = sheetId;
    }
    setInput({
      ...input,
      'isRenaming': valueToSet,
    })
  }

  const onMouseEnterElement = (e, sheetId) => {
    e.stopPropagation();
    // let valueToSet;
    // if (input.isHovering === sheetId) {
    //   valueToSet = false;
    // } else {
    //   valueToSet = sheetId;
    // }
    setInput({
      ...input,
      'isHovering': sheetId,
    })
  }

  const onMouseLeaveElement = (e, sheetId) => {
    e.stopPropagation();
    // let valueToSet;
    // if (input.isHovering === sheetId) {
    //   valueToSet = false;
    // } else {
    //   valueToSet = sheetId;
    // }
    setInput({
      ...input,
      'isHovering': false,
    })
  }

  function getSheetIcon(sheetView) {
    switch (sheetView) {
      case SHEET_VIEW.GRIDVIEW:
        return 'grid layout';
      case SHEET_VIEW.TIMELINEVIEW:
        return 'barcode';
      default:
        return 'exclamation';
    }
  }

  function onRemoveMovieListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onRemoveMovieListItem(fileId);
  }

  function onSheetClickWithStop(e, fileId, sheetId, sheetView) {
    e.stopPropagation();
    onSetSheetClick(fileId, sheetId, sheetView);
  }

  function onChangeSheetViewClickWithStop(e, fileId, sheetId, sheetView) {
    e.stopPropagation();
    onChangeSheetViewClick(fileId, sheetId, sheetView);
  }

  function onDuplicateSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDuplicateSheetClick(fileId, sheetId);
  }

  function onExportSheetClickWithStop(e, fileId, sheetId, exportType) {
    e.stopPropagation();
    onExportSheetClick(fileId, sheetId, exportType, fps);
  }

  function onDeleteSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDeleteSheetClick(fileId, sheetId);
  }

  function onFileListElementClickWithStop(e, fileId) {
    e.stopPropagation();
    onFileListElementClick(fileId);
  }

  function onScanMovieListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onScanMovieListItemClick(fileId);
  }

  function onAddIntervalSheetClickWithStop(e, fileId) {
    e.stopPropagation();
    onAddIntervalSheetClick(fileId);
  }

  function onEditTransformListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onEditTransformListItemClick(fileId);
  }

  function onReplaceMovieListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onReplaceMovieListItemClick(fileId);
  }

  return (
    <li
      data-tid={`fileListItem_${fileId}`}
      onClick={e => (fileMissingStatus === true) ? null : onFileListElementClickWithStop(e, fileId)}
      className={`${styles.FileListItem} ${(currentFileId === fileId) ? styles.Highlight : ''} ${(fileMissingStatus === true) ? styles.Missing : ''}`}
    >
      {(fileMissingStatus === true) &&
        <div
          className={`${styles.fileMissingContainer}`}
        >
          <div
            className={`${styles.fileMissing}`}
          >
            Movie is missing
          </div>
          <Popup
            trigger={
              <Button
                data-tid='findfileBtn'
                size='mini'
                inverted
                className={`${styles.fileMissingButton}`}
                onClick={e => onReplaceMovieListItemClickWithStop(e, fileId)}
              >
                Locate movie
              </Button>
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position='bottom center'
            className={stylesPop.popup}
            content="Locate the missing movie"
          />
          <Popup
            trigger={
              <Button
                data-tid='removeFileBtn'
                size='mini'
                inverted
                className={`${styles.fileMissingButton}`}
                onClick={e => onRemoveMovieListItemClickWithStop(e, fileId)}
              >
                Remove
              </Button>
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position='bottom center'
            className={stylesPop.popup}
            content="Remove movie from list"
          />
        </div>
      }
      <Dropdown
        data-tid='movieListItemOptionsDropdown'
        item
        direction="left"
        icon="ellipsis vertical"
        className={`${styles.overflow} ${styles.overflowHidden}`}
      >
        <Dropdown.Menu>
          {fileMissingStatus !== true &&
              <Dropdown.Item
              data-tid='addShotDetectionMovieListItemOption'
              icon="add"
              text="Add MoviePrint (shot detection based)"
              onClick={e => onScanMovieListItemClickWithStop(e, fileId)}
            />
          }
          {fileMissingStatus !== true &&
            <Dropdown.Item
              data-tid='addIntervalMovieListItemOption'
              icon="add"
              text="Add MoviePrint (interval based)"
              onClick={e => onAddIntervalSheetClickWithStop(e, fileId)}
            />
          }
          {fileMissingStatus !== true &&
            <Dropdown.Item
              data-tid='changeCroppingListItemOption'
              icon="crop"
              text="Edit cropping"
              onClick={e => onEditTransformListItemClickWithStop(e, fileId)}
            />
          }
          <Dropdown.Item
            data-tid='replaceMovieListItemOption'
            icon="exchange"
            text="Replace movie"
            onClick={e => onReplaceMovieListItemClickWithStop(e, fileId)}
          />
          <Dropdown.Item
            data-tid='removeMovieListItemOption'
            icon="delete"
            text="Remove from list"
            onClick={e => onRemoveMovieListItemClickWithStop(e, fileId)}
          />
        </Dropdown.Menu>
      </Dropdown>
      <Image
         as='div'
         floated='left'
         className={`${styles.croppedThumb}`}
         style={{
           backgroundColor: '#1e1e1e',
           backgroundImage: `url(${objectUrl})`
         }}
       >
         {fileScanStatus && <Label
           as='a'
           color='orange'
           size='mini'
           circular
           alt='Movie has been scanned'
           className={`${styles.ThumbLabel}`}
         >
          S
        </Label>}
      </Image>
      <div
        className={`${styles.Title}`}
        title={`${(fileMissingStatus === true) ? 'MISSING: ' : ''}${name}`}
      >
        {truncate(name, 48)}
      </div>
      <div
        className={`${styles.Path}`}
        title={`${(fileMissingStatus === true) ? 'MISSING: ' : ''}${path.slice(0, path.lastIndexOf('/'))}`}
      >
        {truncatePath(path.slice(0, path.lastIndexOf('/')), 40)}
      </div>
      <div className={`${styles.Detail}`}>
        <div className={`${styles.DetailLeft}`}>
          {frameCountToTimeCode(frameCount, fps)}
        </div>
        <div className={`${styles.DetailRight}`}>
          {formatBytes(size, 1)}
        </div>
        <div className={`${styles.DetailCenter}`}>
          {width} x {height}
        </div>
      </div>
      <ul
        className={`${styles.SheetList}`}
      >
        {sheetsArray.map((sheetId, index) => (
          <li
            key={sheetId}
            index={index}
            data-tid={`sheetListItem_${fileId}`}
            onClick={e => onSheetClickWithStop(e, fileId, sheetId, sheetsObject[sheetId].sheetView)}
            className={`${styles.SheetListItem} ${(currentSheetId === sheetId) ? styles.SheetHighlight : ''}`}
            title={`${sheetsObject[sheetId].type} based`}
          >
            {/* {(currentSheetId === sheetId) &&
              <Label
                size='mini'
                horizontal
                className={`${styles.SheetLabel}`}
              >
              Selected sheet
            </Label>} */}
            {input.isRenaming !== sheetId &&
              <React.Fragment>
                <span
                  className={`${styles.SheetName}`}
                  title={sheetsObject[sheetId].name}
                >
                    <Icon
                      onMouseEnter={e => onMouseEnterElement(e,sheetId)}
                      onMouseLeave={e => onMouseLeaveElement(e)}
                      name={input.isHovering !== sheetId ? getSheetIcon(sheetsObject[sheetId].sheetView) : 'edit'}
                      inverted
                      onClick={e => onStartRenameClickWithStop(e, sheetId)}
                      role='button'
                    />
                    &nbsp;{sheetsObject[sheetId].name}
                </span>
                <Label
                  size='mini'
                  horizontal
                  className={`${styles.SheetLabel} ${(sheetsObject[sheetId].type === SHEET_TYPE.SCENES) ? styles.shotBased : ''}`}
                >
                  {`${sheetsObject[sheetId].type} based`}
                </Label>
              </React.Fragment>
            }
            {input.isRenaming === sheetId &&
              <span
                className={`${styles.SheetNameInputContainer}`}
              >
                <Icon
                  name='edit'
                  inverted
                  // size='small'
                />
                <Input
                  data-tid='moviePrintNameInput'
                  name='moviePrintNameInput'
                  focus
                  ref={inputRef}
                  className={`${styles.SheetNameInput}`}
                  transparent
                  placeholder='Name this MoviePrint'
                  defaultValue={sheetsObject[sheetId].name}
                  onBlur={e => onSubmitMoviePrintName(e, sheetId)}
                  onKeyUp={e => onSubmitMoviePrintName(e, sheetId)}
                />
              </span>
            }
            {fileMissingStatus !== true &&
              <Dropdown
                data-tid='sheetItemOptionsDropdown'
                item
                direction="left"
                icon="ellipsis vertical"
                className={`${styles.overflow} ${styles.overflowHidden}`}
              >
                <Dropdown.Menu>
                  <Dropdown.Item
                    data-tid='renameSheetItemOption'
                    icon="edit"
                    text="Rename"
                    onClick={e => onStartRenameClickWithStop(e, sheetId)}
                  />
                  {sheetsObject[sheetId].sheetView === SHEET_VIEW.TIMELINEVIEW && <Dropdown.Item
                    data-tid='changeViewSheetToGridViewItemOption'
                    icon="grid layout"
                    text="Switch to grid view"
                    onClick={e => onChangeSheetViewClickWithStop(e, fileId, sheetId, SHEET_VIEW.GRIDVIEW)}
                  />}
                  {sheetsObject[sheetId].sheetView === SHEET_VIEW.GRIDVIEW && <Dropdown.Item
                    data-tid='changeViewSheetToTimelineViewItemOption'
                    icon="barcode"
                    text="Switch to timeline view"
                    onClick={e => onChangeSheetViewClickWithStop(e, fileId, sheetId, SHEET_VIEW.TIMELINEVIEW)}
                  />}
                  <Dropdown.Item
                    data-tid='duplicateSheetItemOption'
                    icon="copy"
                    text="Duplicate"
                    onClick={e => onDuplicateSheetClickWithStop(e, fileId, sheetId)}
                  />
                  <Dropdown.Item
                    data-tid='exportSheetItemOption'
                    icon="download"
                    text="Export JSON"
                    onClick={e => onExportSheetClickWithStop(e, fileId, sheetId, EXPORT_FORMAT_OPTIONS.JSON)}
                  />
                  {sheetsObject[sheetId].type === SHEET_TYPE.SCENES && <Dropdown.Item
                    data-tid='exportSheetItemOption'
                    icon="download"
                    text="Export EDL"
                    onClick={e => onExportSheetClickWithStop(e, fileId, sheetId, EXPORT_FORMAT_OPTIONS.EDL)}
                  />}
                  <Dropdown.Item
                    data-tid='deleteSheetItemOption'
                    icon="delete"
                    text="Delete"
                    onClick={e => onDeleteSheetClickWithStop(e, fileId, sheetId)}
                  />
                </Dropdown.Menu>
              </Dropdown>
            }
          </li>
        ))}
      </ul>
    </li>
  )
};

FileListElement.propTypes = {
  fileId: PropTypes.string.isRequired,
  frameCount: PropTypes.number,
  fps: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  objectUrl: PropTypes.string,
  currentFileId: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  onFileListElementClick: PropTypes.func.isRequired
};

export default FileListElement;
