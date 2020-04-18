import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Divider, Grid, Form, Header } from 'semantic-ui-react';
import {
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
  const canvasRef = useRef();

  const canvasWidth = EDIT_TRANSFORM_CANVAS_WIDTH;
  const canvasHeight = EDIT_TRANSFORM_CANVAS_HEIGHT;

  function drawImageCenter(ctx, image, x, y, cx, cy, scale, rotation){
    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    ctx.rotate(rotation);
    ctx.drawImage(image, -cx, -cy);
  }

  function getRadians(rotationFlag){
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
    const originalAspectRatioInv = (originalHeight * 1.0) / originalWidth;
    const { cropTop, cropBottom, cropLeft, cropRight, rotationFlag } = transformObjectState;
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
      const imageToPosterImageScaleFactor =
        originalAspectRatioInv <= 1 ? imageObj.width / originalWidth : imageObj.height / originalHeight;
      const scaledWidth = imageObj.width * posterImageToCanvasScaleFactor;
      const scaledHeight = imageObj.height * posterImageToCanvasScaleFactor;
      const centeredXPos = (EDIT_TRANSFORM_CANVAS_WIDTH - scaledWidth) / 2.0;
      const centeredYPos = (EDIT_TRANSFORM_CANVAS_HEIGHT - scaledHeight) / 2.0;
      ctx.globalAlpha = 0.4;
      // ctx.setTransform(1, 0, 0, 1, EDIT_TRANSFORM_CANVAS_WIDTH / 2, EDIT_TRANSFORM_CANVAS_HEIGHT / 2); // sets scale and origin
      // ctx.rotate(getRadians(rotationFlag));
      // ctx.drawImage(
      //   imageObj,
      //   0,
      //   0,
      //   imageObj.width,
      //   imageObj.height,
      //   centeredXPos - EDIT_TRANSFORM_CANVAS_WIDTH / 2,
      //   centeredYPos - EDIT_TRANSFORM_CANVAS_HEIGHT / 2,
      //   scaledWidth,
      //   scaledHeight,
      // );
      // ctx.setTransform(1, 0, 0, 1, 0, 0); // sets scale and origin

      // draw cropped image
      const { cropWidth, cropHeight } = getCropWidthAndHeight(transformObjectState, originalWidth, originalHeight);
      let displayCropLeft = cropLeft * imageToPosterImageScaleFactor;
      let displayCropTop = cropTop * imageToPosterImageScaleFactor;
      let displayCropWidth = cropWidth * imageToPosterImageScaleFactor;
      let displayCropHeight = cropHeight * imageToPosterImageScaleFactor;

      let cropScaledWidth = displayCropWidth * posterImageToCanvasScaleFactor;
      let cropScaledHeight = displayCropHeight * posterImageToCanvasScaleFactor;
      let cropCenteredXPos = centeredXPos + displayCropLeft * posterImageToCanvasScaleFactor;
      let cropCenteredYPos = centeredYPos + displayCropTop * posterImageToCanvasScaleFactor;
      ctx.globalAlpha = 1.0;
      console.log(transformObjectState);
      console.log(
        `${originalWidth}|${imageObj.width}|${EDIT_TRANSFORM_CANVAS_WIDTH}|${posterImageToCanvasScaleFactor}|${scaledWidth}|${centeredXPos}||${cropLeft}|${displayCropLeft}|${cropCenteredXPos}`,
      );
      ctx.drawImage(
        imageObj,
        displayCropLeft,
        displayCropTop,
        displayCropWidth,
        displayCropHeight,
        cropCenteredXPos,
        cropCenteredYPos,
        cropScaledWidth,
        cropScaledHeight,
      );
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
        size="large"
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
                  <Header as="h5">Rotation</Header>
                  <Form.Select
                    name="rotationFlag"
                    // label="Rotation"
                    options={ROTATION_OPTIONS}
                    // placeholder="Select"
                    onChange={handleRotationChange}
                    defaultValue={transformObject.rotationFlag}
                  />
                  <Header as="h5">Cropping in pixel</Header>
                  <Form.Input
                    name="cropTop"
                    label="From top"
                    placeholder="top"
                    required
                    type="number"
                    min="0"
                    // width={4}
                    defaultValue={transformObject.cropTop}
                    onChange={handleCropInputChange}
                  />
                  <Form.Input
                    name="cropLeft"
                    label="From left"
                    placeholder="left"
                    required
                    type="number"
                    // width={4}
                    defaultValue={transformObject.cropLeft}
                    onChange={handleCropInputChange}
                  />
                  <Form.Input
                    name="cropRight"
                    label="From right"
                    placeholder="right"
                    required
                    type="number"
                    min="0"
                    // width={4}
                    defaultValue={transformObject.cropRight}
                    onChange={handleCropInputChange}
                  />
                  <Form.Input
                    name="cropBottom"
                    label="From bottom"
                    placeholder="bottom"
                    required
                    type="number"
                    min="0"
                    // width={4}
                    defaultValue={transformObject.cropBottom}
                    onChange={handleCropInputChange}
                  />
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
