import React, { useState } from 'react';
import { Button, Modal, Divider, Grid, Form, Header } from 'semantic-ui-react';
import { ROTATION_OPTIONS, TRANSFORMOBJECT_INIT } from '../utils/constants';
// import { areOneOrMoreFiltersEnabled } from '../utils/utils';
import styles from '../containers/App.css';

const EditTransformModal = ({
  fileId,
  onClose,
  onChangeTransform,
  showTransformModal,
  transformObject = TRANSFORMOBJECT_INIT, // initialise if undefined
}) => {
  const [transformObjectState, setTransformObjectState] = useState(transformObject);

  // const {
  //   defaultFaceUniquenessThreshold = FACE_UNIQUENESS_THRESHOLD,
  //   defaultFaceSizeThreshold = FACE_SIZE_THRESHOLD,
  //   defaultThumbInfo,
  //   defaultShowHeader,
  //   defaultShowImages,
  //   defaultShowFaceRect,
  // } = settings;
  // const { moviePrintAspectRatioInv, containerAspectRatioInv } = scaleValueObject;

  const handleTransformChange = (e, { name, value }) => {
    console.log(name);
    console.log(value);
    if (value === 4) {
      setTransformObjectState({
        ...transformObjectState,
        [name]: null,
      });
    } else {
      setTransformObjectState({
        ...transformObjectState,
        [name]: parseInt(value, 10),
      });
    }
  };

  return (
    <div
      onKeyDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onFocus={e => e.stopPropagation()}
      onMouseOver={e => e.stopPropagation()}
    >
      <Modal
        open={showTransformModal}
        onClose={onClose}
        size="small"
        closeIcon
        as={Form}
        onSubmit={() => onChangeTransform(fileId, transformObjectState)}
      >
        <Modal.Header>Set rotation and cropping</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <Form.Group>
              <Header as="h5">Rotation</Header>
            </Form.Group>
            <Form.Group>
              <Form.Select
                name="rotationFlag"
                // label="Rotation"
                options={ROTATION_OPTIONS}
                // placeholder="Select"
                onChange={handleTransformChange}
                defaultValue={transformObject.rotationFlag}
              />
            </Form.Group>
            <Divider hidden />
            <Form.Group>
              <Header as="h5">Cropping in pixel</Header>
            </Form.Group>
            <Grid centered columns={3}>
              <Grid.Row>
                <Grid.Column>
                  <Form.Group>
                    <Form.Input
                      name="cropTop"
                      label="From top"
                      placeholder="top"
                      required
                      type="number"
                      min="0"
                      width={16}
                      defaultValue={transformObject.cropTop}
                      onChange={handleTransformChange}
                    />
                  </Form.Group>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row centered columns={1}>
                <Grid.Column width={5}>
                  <Form.Input
                    name="cropLeft"
                    label="From left"
                    placeholder="left"
                    required
                    type="number"
                    min="0"
                    width={16}
                    defaultValue={transformObject.cropLeft}
                    onChange={handleTransformChange}
                  />
                </Grid.Column>
                <Grid.Column width={6}></Grid.Column>
                <Grid.Column width={5}>
                  <Form.Input
                    name="cropRight"
                    label="From right"
                    placeholder="right"
                    required
                    type="number"
                    min="0"
                    width={16}
                    defaultValue={transformObject.cropRight}
                    onChange={handleTransformChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row centered columns={3}>
                <Grid.Column>
                  <Form.Group>
                    <Form.Input
                      name="cropBottom"
                      label="From bottom"
                      placeholder="bottom"
                      required
                      type="number"
                      min="0"
                      width={16}
                      defaultValue={transformObject.cropBottom}
                      onChange={handleTransformChange}
                    />
                  </Form.Group>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <span className={styles.smallInfo}>All thumbs of this movie will be updated. This can take a bit.</span>
          <Button type="submit" content="Update transform" />
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default EditTransformModal;
