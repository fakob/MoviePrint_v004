import React from 'react';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import { connect } from 'react-redux';
import styles from '../components/Header.css';

import undo from './../img/Thumb_UNDO.png';
import redo from './../img/Thumb_REDO.png';

let UndoRedo = ({ canUndo, canRedo, onUndo, onRedo }) => (
  <div>
    {/* <button onClick={onUndo} disabled={!canUndo}>
      Undo
    </button>
    <button onClick={onRedo} disabled={!canRedo}>
      Redo
    </button> */}
    <img
      src={undo}
      className={[styles.headerItem, styles.undo].join(' ')}
      alt=""
      onClick={onUndo}
      disabled={!canUndo}
    />
    <img
      src={redo}
      className={[styles.headerItem, styles.redo].join(' ')}
      alt=""
      onClick={onRedo}
      disabled={!canRedo}
    />
  </div>
);

const mapStateToProps = (state) => {
  return {
    canUndo: state.undoGroup.past.length > 0,
    canRedo: state.undoGroup.future.length > 0
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onUndo: () => dispatch(UndoActionCreators.undo()),
    onRedo: () => dispatch(UndoActionCreators.redo())
  };
};

UndoRedo = connect(
  mapStateToProps,
  mapDispatchToProps
)(UndoRedo);

export default UndoRedo;
