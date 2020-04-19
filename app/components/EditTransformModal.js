import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Divider, Grid, Form, Header } from 'semantic-ui-react';
import {
  CROP_OPTIONS,
  ROTATION_OPTIONS,
  TRANSFORMOBJECT_INIT,
  ASPECT_RATIO_OPTIONS,
  EDIT_TRANSFORM_CANVAS_WIDTH,
  EDIT_TRANSFORM_CANVAS_HEIGHT,
} from '../utils/constants';
import { getCropWidthAndHeight } from '../utils/utils';
import styles from '../containers/App.css';

const EditTransformModal = ({
  fileId,
  objectUrl,
  onClose,
  onChangeTransform,
  showTransformModal,
  transformObject = TRANSFORMOBJECT_INIT, // initialise if undefined
  originalWidth = EDIT_TRANSFORM_CANVAS_WIDTH,
  originalHeight = EDIT_TRANSFORM_CANVAS_HEIGHT,
  width = EDIT_TRANSFORM_CANVAS_WIDTH,
  height = EDIT_TRANSFORM_CANVAS_HEIGHT,
}) => {
  console.log('EditTransformModal is mounted');
  console.log(transformObject);
  const [transformObjectState, setTransformObjectState] = useState(transformObject);
  const [cropDropdownValue, setCropDropdownValue] = useState(undefined);
  const canvasRef = useRef();

  const canvasWidth = EDIT_TRANSFORM_CANVAS_WIDTH;
  const canvasHeight = EDIT_TRANSFORM_CANVAS_HEIGHT;
  const originalAspectRatioInv = (originalHeight * 1.0) / originalWidth;

  function getRadians(rotationFlag) {
    let degrees = 0;
    switch (rotationFlag) {
      case 0:
        degrees = 90;
        break;
      case 1:
        degrees = 180;
        break;
      case 2:
        degrees = 270;
        break;
      default:
    }
    return (degrees * Math.PI) / 180;
  }

  // ctx.setTransform(1,0,0,1,0,0); // which is much quicker than save and restore

  useEffect(() => {
    console.log(transformObjectState);

    const { cropTop, cropLeft, rotationFlag } = transformObjectState;
    // console.log(canvasRef)
    // console.log(objectUrl)
    if (canvasRef.current !== undefined && canvasRef.current !== null) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, EDIT_TRANSFORM_CANVAS_WIDTH, EDIT_TRANSFORM_CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, EDIT_TRANSFORM_CANVAS_WIDTH, EDIT_TRANSFORM_CANVAS_HEIGHT);

      // load image from data url
      const imageObj = new Image();
      imageObj.src = objectUrl;

      // draw original image
      const posterImageToCanvasScaleFactor =
        originalAspectRatioInv <= 1 ? canvasWidth / imageObj.width : canvasHeight / imageObj.height;
      const scaledWidth = imageObj.width * posterImageToCanvasScaleFactor;
      const scaledHeight = imageObj.height * posterImageToCanvasScaleFactor;
      const centeredXPos = (EDIT_TRANSFORM_CANVAS_WIDTH - scaledWidth) / 2.0;
      const centeredYPos = (EDIT_TRANSFORM_CANVAS_HEIGHT - scaledHeight) / 2.0;
      ctx.globalAlpha = 0.8;
      ctx.setTransform(1, 0, 0, 1, EDIT_TRANSFORM_CANVAS_WIDTH / 2, EDIT_TRANSFORM_CANVAS_HEIGHT / 2); // sets scale and origin
      ctx.rotate(getRadians(rotationFlag));
      ctx.drawImage(
        imageObj,
        0,
        0,
        imageObj.width,
        imageObj.height,
        centeredXPos - EDIT_TRANSFORM_CANVAS_WIDTH / 2,
        centeredYPos - EDIT_TRANSFORM_CANVAS_HEIGHT / 2,
        scaledWidth,
        scaledHeight,
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0); // sets scale and origin

      // draw cropped image
      const imageToCanvasScaleFactor =
        originalAspectRatioInv <= 1 ? canvasWidth / originalWidth : canvasHeight / originalHeight;
      let { cropWidth, cropHeight } = getCropWidthAndHeight(transformObjectState, originalWidth, originalHeight);
      let displayCropLeft = cropLeft * imageToCanvasScaleFactor;
      let displayCropTop = cropTop * imageToCanvasScaleFactor;
      let displayCropWidth = cropWidth * imageToCanvasScaleFactor;
      let displayCropHeight = cropHeight * imageToCanvasScaleFactor;
      let cropCenteredXPos = centeredXPos + displayCropLeft;
      let cropCenteredYPos = centeredYPos + displayCropTop;

      // if 90 or 270 degrees
      if (rotationFlag === 0 || rotationFlag === 2) {
        const { cropWidth: newCropWidth, cropHeight: newCropHeight } = getCropWidthAndHeight(
          transformObjectState,
          originalHeight, // switched width and height
          originalWidth,
        );
        cropWidth = newCropWidth;
        cropHeight = newCropHeight;
        displayCropLeft = cropLeft * imageToCanvasScaleFactor;
        displayCropTop = cropTop * imageToCanvasScaleFactor;
        displayCropWidth = cropWidth * imageToCanvasScaleFactor;
        displayCropHeight = cropHeight * imageToCanvasScaleFactor;
        cropCenteredXPos = centeredYPos + displayCropLeft;
        cropCenteredYPos = centeredXPos + displayCropTop;
      }

      ctx.globalAlpha = 1.0;
      // console.log(transformObjectState);
      // console.log(
      //   `${originalWidth}|${imageObj.width}|${EDIT_TRANSFORM_CANVAS_WIDTH}|${posterImageToCanvasScaleFactor}|${scaledWidth}|${centeredXPos}||${cropLeft}|${displayCropLeft}|${cropCenteredXPos}`,
      // );
      ctx.beginPath();
      ctx.rect(cropCenteredXPos, cropCenteredYPos, displayCropWidth, displayCropHeight);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  });

  // useEffect(() => {
  //   // clean up function on open close model
  //   return function cleanup() {
  //     setTransformObjectState(transformObject);
  //   };
  // },[showTransformModal]);

  // const {
  //   defaultFaceUniquenessThreshold = FACE_UNIQUENESS_THRESHOLD,
  //   defaultFaceSizeThreshold = FACE_SIZE_THRESHOLD,
  //   defaultThumbInfo,
  //   defaultShowHeader,
  //   defaultShowImages,
  //   defaultShowFaceRect,
  // } = settings;
  // const { moviePrintAspectRatioInv, containerAspectRatioInv } = scaleValueObject;

  const handleCropDropdownChange = (e, { value }) => {
    const { rotationFlag } = transformObjectState;

    console.log(value)
    setCropDropdownValue(value);

    let newOriginalWidth = originalWidth;
    let newOriginalHeight = originalHeight;
    let newAspectRatio = originalAspectRatioInv;
    // if 90 or 270 degrees swap width and height and calculate new aspectRatioInv
    if (rotationFlag === 0 || rotationFlag === 2) {
      [newOriginalWidth, newOriginalHeight] = [newOriginalHeight, newOriginalWidth];
      newAspectRatio = (newOriginalHeight * 1.0) / newOriginalWidth;
    }

    if (value === null) {
      setTransformObjectState({
        ...transformObjectState,
        cropTop: 0,
        cropBottom: 0,
        cropLeft: 0,
        cropRight: 0,
      });
    } else if (value <= newAspectRatio) {
      const newHeight = value * newOriginalWidth;
      const cropTopAndBottom = (newOriginalHeight - newHeight) / 2;
      setTransformObjectState({
        ...transformObjectState,
        cropTop: parseInt(cropTopAndBottom, 10),
        cropBottom: parseInt(cropTopAndBottom, 10),
        cropLeft: 0,
        cropRight: 0,
      });
    } else {
      const newWidth = newOriginalHeight / value;
      const cropLeftAndRight = (newOriginalWidth - newWidth) / 2;
      setTransformObjectState({
        ...transformObjectState,
        cropLeft: parseInt(cropLeftAndRight, 10),
        cropRight: parseInt(cropLeftAndRight, 10),
        cropTop: 0,
        cropBottom: 0,
      });
    }
  };

  const handleCropInputChange = (e, { name, value }) => {
    console.log(name);
    console.log(value);
    setTransformObjectState({
      ...transformObjectState,
      [name]: parseInt(value, 10),
    });
  };

  const handleRotationChange = (e, { name, value }) => {
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
        size="medium"
        closeIcon
        as={Form}
        onSubmit={() => onChangeTransform(fileId, transformObjectState)}
      >
        <Modal.Header>Set rotation and cropping</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <Grid>
              <Grid.Row>
                <Grid.Column width={4}>
                  <Header as="h5">Aspect ratio</Header>
                  <Form.Select
                    name="rotationFlag"
                    // label="Rotation"
                    options={ASPECT_RATIO_OPTIONS}
                    // placeholder="Select"
                    // onChange={handleCropInputChange}
                    // defaultValue={transformObject.rotationFlag}
                  />
                  <Header as="h3">Rotation</Header>
                  <Form.Select
                    name="rotationFlag"
                    // label="Rotation"
                    options={ROTATION_OPTIONS}
                    // placeholder="Select"
                    onChange={handleRotationChange}
                    defaultValue={transformObjectState.rotationFlag}
                  />
                  <Header as="h3">Crop</Header>
                  <Form.Select
                    name="cropDropdown"
                    label="Crop presets"
                    options={CROP_OPTIONS}
                    placeholder="Select"
                    onChange={handleCropDropdownChange}
                    value={cropDropdownValue}
                  />
                  <Form.Group widths="equal">
                    <Form.Input
                      name="cropTop"
                      label="From top"
                      placeholder="top"
                      required
                      type="number"
                      min="0"
                      width={4}
                      value={transformObjectState.cropTop}
                      onChange={handleCropInputChange}
                    />
                    <Form.Input
                      name="cropBottom"
                      label="From bottom"
                      placeholder="bottom"
                      required
                      type="number"
                      min="0"
                      width={4}
                      value={transformObjectState.cropBottom}
                      onChange={handleCropInputChange}
                    />
                  </Form.Group>
                  <Form.Group widths="equal">
                    <Form.Input
                      name="cropLeft"
                      label="From left"
                      placeholder="left"
                      required
                      type="number"
                      width={4}
                      value={transformObjectState.cropLeft}
                      onChange={handleCropInputChange}
                    />
                    <Form.Input
                      name="cropRight"
                      label="From right"
                      placeholder="right"
                      required
                      type="number"
                      min="0"
                      width={4}
                      value={transformObjectState.cropRight}
                      onChange={handleCropInputChange}
                    />
                  </Form.Group>
                </Grid.Column>
                <Grid.Column width={12}>
                  <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
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
