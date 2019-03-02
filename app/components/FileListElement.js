// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Icon, Popup, Dropdown, Label, Input } from 'semantic-ui-react';
import { truncate, truncatePath, frameCountToTimeCode, formatBytes } from '../utils/utils';
import styles from './FileList.css';
import transparent from '../img/Thumb_TRANSPARENT.png';

const FileListElement = ({
  id, frameCount, fps, width, height, name, path,
  size, objectUrl, onClick, currentFileId, sheetsObject, onSheetClick, currentSheetId,
  onDuplicateSheetClick, onDeleteSheetClick, onRemoveMovieListItem
}) => {
  const sheetsArray = Object.getOwnPropertyNames(sheetsObject);

  function onRemoveMovieListItemClickWithStop(e, fileId) {
    e.stopPropagation();
    onRemoveMovieListItem(fileId);
  }

  function onSheetClickWithStop(e, sheetId) {
    e.stopPropagation();
    onSheetClick(sheetId);
  }

  function onDuplicateSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDuplicateSheetClick(fileId, sheetId);
  }

  function onDeleteSheetClickWithStop(e, fileId, sheetId) {
    e.stopPropagation();
    onDeleteSheetClick(fileId, sheetId);
  }

  return (
    <li
      data-tid={`fileListItem_${id}`}
      onClick={onClick}
      className={`${styles.FileListItem} ${(currentFileId === id) ? styles.Highlight : ''}`}
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
            onClick={e => onRemoveMovieListItemClickWithStop(e, id)}
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
        {(currentFileId === id) && sheetsArray.map((sheetId, index) => (
          <li
            key={sheetId}
            index={index}
            data-tid={`sheetListItem_${id}`}
            onClick={e => onSheetClickWithStop(e, sheetId)}
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
                <Icon name='grid layout' inverted />
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
                    onClick={e => onRenameSheetClickWithStop(e, id, sheetId)}
                  /> */}
                <Dropdown.Item
                  data-tid='duplicateSheetItemOption'
                  icon="copy"
                  text="Duplicate"
                  onClick={e => onDuplicateSheetClickWithStop(e, id, sheetId)}
                />
                <Dropdown.Item
                  data-tid='deleteSheetItemOption'
                  icon="delete"
                  text="Delete"
                  onClick={e => onDeleteSheetClickWithStop(e, id, sheetId)}
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
  id: PropTypes.string.isRequired,
  frameCount: PropTypes.number,
  fps: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  objectUrl: PropTypes.string,
  currentFileId: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};

export default FileListElement;
