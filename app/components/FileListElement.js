// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Icon, Popup, Dropdown, Label, Input } from 'semantic-ui-react';
import { truncate, truncatePath, frameCountToTimeCode, formatBytes } from '../utils/utils';
import styles from './FileList.css';
import transparent from '../img/Thumb_TRANSPARENT.png';
import {
  SHEET_TYPE,
  SHEET_TYPE_OPTIONS,
} from '../utils/constants';


const FileListElement = ({
  fileId, frameCount, fps, width, height, name, path,
  size, objectUrl, onFileListElementClick, currentFileId, sheetsObject, onSetSheetClick, currentSheetId,
  onDuplicateSheetClick, onDeleteSheetClick, onRemoveMovieListItem, onChangeSheetTypeClick
}) => {
  const sheetsArray = Object.getOwnPropertyNames(sheetsObject);

  function getSheetIcon(type) {
    switch (type) {
      case SHEET_TYPE.INTERVAL:
        return 'grid layout';
      case SHEET_TYPE.SCENES:
        return 'barcode';
      default:
        return 'exclamation';
    }
  }

  function onRemoveMovieListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onRemoveMovieListItem(fileId);
  }

  function onSheetClickWithStop(e, fileId, sheetId, type) {
    e.stopPropagation();
    onSetSheetClick(fileId, sheetId, type);
  }

  function onChangeSheetTypeClickWithStop(e, fileId, sheetId, type) {
    e.stopPropagation();
    onChangeSheetTypeClick(fileId, sheetId, type);
  }

  function onDuplicateSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDuplicateSheetClick(fileId, sheetId);
  }

  function onDeleteSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDeleteSheetClick(fileId, sheetId);
  }

  function onFileListElementClickWithStop(e, fileId) {
    e.stopPropagation();
    onFileListElementClick(fileId);
  }

  return (
    <li
      data-tid={`fileListItem_${fileId}`}
      onClick={e => onFileListElementClickWithStop(e, fileId)}
      className={`${styles.FileListItem} ${(currentFileId === fileId) ? styles.Highlight : ''}`}
    >
      <Dropdown
        data-tid='movieListItemOptionsDropdown'
        item
        direction="left"
        icon="ellipsis vertical"
        className={`${styles.overflow} ${styles.overflowHidden}`}
      >
        <Dropdown.Menu>
          <Dropdown.Item
            data-tid='removeMovieListItemOption'
            icon="delete"
            text="Remove from list"
            onClick={e => onRemoveMovieListItemClickWithStop(e, fileId)}
          />
        </Dropdown.Menu>
      </Dropdown>
      <div
        className={`${styles.croppedThumb}`}
        style={{
          backgroundColor: '#1e1e1e',
          backgroundImage: `url(${objectUrl})`
          // backgroundImage: `url(data:image/jpeg;base64,${base64})`
        }}
        alt={`${name}`}
      />
      <div
        className={`${styles.Title}`}
        title={name}
      >
        {truncate(name, 48)}
      </div>
      <div
        className={`${styles.Path}`}
        title={path.slice(0, path.lastIndexOf('/'))}
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
            onClick={e => onSheetClickWithStop(e, fileId, sheetId, sheetsObject[sheetId].type)}
            className={`${styles.SheetListItem} ${(currentSheetId === sheetId) ? styles.SheetHighlight : ''}`}
          >
            {/* {(currentSheetId === sheetId) &&
              <Label
                size='mini'
                horizontal
                className={`${styles.SheetLabel}`}
              >
              Selected sheet
            </Label>} */}
            <span className={`${styles.SheetName}`}>
                <Icon name={getSheetIcon(sheetsObject[sheetId].type)} inverted />
                &nbsp;{sheetsObject[sheetId].name}
            </span>
            {/* <Input
              transparent
              fluid
              placeholder={sheetsObject[sheetId].name}
              onChange={(e, data) => {
                // e.preventDefault();
                // data.onChange.e.preventDefault();
                console.log(data);
                return undefined;
              }}
              onKeyPress={(e) => {
                // e.preventDefault();
                // data.onChange.e.preventDefault();
                console.log(e.key);
                return undefined;
              }}
              className={`${styles.SheetNameInput}`}
            /> */}
            <Dropdown
              data-tid='sheetItemOptionsDropdown'
              item
              direction="left"
              icon="ellipsis vertical"
              className={`${styles.overflow} ${styles.overflowHidden}`}
            >
              <Dropdown.Menu>
                  {/* <Dropdown.Item
                    data-tid='renameSheetItemOption'
                    icon="edit"
                    text="Rename"
                    onClick={e => onRenameSheetClickWithStop(e, fileId, sheetId)}
                  /> */}
                <Dropdown.Item
                  data-tid='changeTypeSheetItemOption'
                  icon="grid layout"
                  text="Switch type to interval"
                  onClick={e => onChangeSheetTypeClickWithStop(e, fileId, sheetId, SHEET_TYPE.INTERVAL)}
                />
                <Dropdown.Item
                  data-tid='changeTypeSheetItemOption'
                  icon="barcode"
                  text="Switch type to scenes"
                  onClick={e => onChangeSheetTypeClickWithStop(e, fileId, sheetId, SHEET_TYPE.SCENES)}
                />
                <Dropdown.Item
                  data-tid='duplicateSheetItemOption'
                  icon="copy"
                  text="Duplicate"
                  onClick={e => onDuplicateSheetClickWithStop(e, fileId, sheetId)}
                />
                <Dropdown.Item
                  data-tid='deleteSheetItemOption'
                  icon="delete"
                  text="Delete"
                  onClick={e => onDeleteSheetClickWithStop(e, fileId, sheetId)}
                />
              </Dropdown.Menu>
            </Dropdown>
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
