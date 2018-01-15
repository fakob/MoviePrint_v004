// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import imageDB from '../utils/db';
import { Button, Input, Icon, Step, Dropdown } from 'semantic-ui-react';
import AddThumb from '../containers/AddThumb';
import UndoRedo from '../containers/UndoRedo';
import { addDefaultThumbs, setDefaultRowCount, setDefaultColumnCount } from '../actions';

const mpPresets = [
  {
    text: '5 x 3',
    value: 15
  },
  {
    text: '5 x 5',
    value: 25
  },
];

class SettingsList extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    // store.dispatch(updateObjectUrlsFromPosterFrame());
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  changeRowCount(amount) {
    const { store } = this.context;
    const state = store.getState();
    store.dispatch(
      setDefaultRowCount(
        amount
      )
    );
    if (state.undoGroup.present.settings.currentFileId !== undefined) {
      store.dispatch(
        addDefaultThumbs(
          state.undoGroup.present.files
          .find(x => x.id === state.undoGroup.present.settings.currentFileId),
          amount *
          state.undoGroup.present.settings.defaultColumnCount
        )
      );
    }
  }

  changeColumnCount(amount) {
    const { store } = this.context;
    const state = store.getState();
    store.dispatch(
      setDefaultColumnCount(
        amount
      )
    );
    if (state.undoGroup.present.settings.currentFileId !== undefined) {
      store.dispatch(
        addDefaultThumbs(
          state.undoGroup.present.files
          .find(x => x.id === state.undoGroup.present.settings.currentFileId),
          state.undoGroup.present.settings.defaultRowCount *
          amount
        )
      );
    }
  }

  render() {
    const { store } = this.context;
    const state = store.getState();

    return (
      <div>
        <AddThumb />
        <UndoRedo />
        <Button
          content="10"
          icon='plus'
          labelPosition='left'
        />
        <Input
          action={{ content: 'Row count', onClick: () => {
            (this.changeRowCount(parseInt(this.inputtextrow.inputRef.value)));
          } }}
          ref={input => this.inputtextrow = input}
          placeholder={state.undoGroup.present.settings.defaultRowCount}
          onKeyPress={(e) => {
            (e.key === 'Enter' ? this.changeRowCount(parseInt(e.target.value)) : null);
          }}
        />
        <Input
          action={{ content: 'Column count', onClick: () => {
            (this.changeColumnCount(parseInt(this.inputtextcolumn.inputRef.value)));
          } }}
          ref={input => this.inputtextcolumn = input}
          placeholder={state.undoGroup.present.settings.defaultColumnCount}
          onKeyPress={(e) => {
            (e.key === 'Enter' ? this.changeColumnCount(parseInt(e.target.value)) : null);
          }}
        />
        <Step.Group size='mini'>
          <Step>
            <Step.Content>
              {/* <Step.Title>Shipping</Step.Title> */}
              {/* <Step.Description>MoviePrint presets</Step.Description> */}
              <Dropdown placeholder='MoviePrint presets' fluid selection options={mpPresets} />
            </Step.Content>
          </Step>
          <Step completed>
            <Icon name='truck' />
            <Step.Content>
              <Step.Title>Shipping</Step.Title>
              <Step.Description>Choose your shipping options</Step.Description>
            </Step.Content>
          </Step>
          <Step active>
            <Icon name='dollar' />
            <Step.Content>
              <Step.Title>Billing</Step.Title>
              <Step.Description>Enter billing information</Step.Description>
            </Step.Content>
          </Step>
          <Step>
            <Icon name='dollar' />
            <Step.Content>
              {/* <Step.Title>Billing</Step.Title> */}
              <Step.Description>Count of thumbs</Step.Description>
              <Input
                action={{ content: 'Amount', onClick: () => { (this.changeThumbCount(parseInt(this.inputtext.inputRef.value))); } }}
                ref={input => this.inputtext = input}
                placeholder="Amount..."
                onKeyPress={(e) => { (e.key === 'Enter' ? this.changeThumbCount(parseInt(e.target.value)) : null); }}
              />
            </Step.Content>
          </Step>
        </Step.Group>
      </div>
    );
  }
}

SettingsList.contextTypes = {
  store: PropTypes.object
};

export default SettingsList;
