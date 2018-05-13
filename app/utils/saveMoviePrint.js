import pathR from 'path';
import html2canvas from 'html2canvas';
import { getFilePathObject, getMimeType, saveBlob } from './utils';
import saveThumb from './saveThumb';

const saveMoviePrint = (
  elementId, exportPath, file, scale, outputFormat, overwrite,
  saveIndividualThumbs = false, thumbs
) => {
  console.log(file);
  const node = document.getElementById(elementId);

  const newFilePathObject = getFilePathObject(file.name, '-MoviePrint', outputFormat, exportPath, overwrite);
  const newFilePathAndName = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.base
  );

  const qualityArgument = 0.8; // only applicable for jpg

  // console.log(newFilePathAndName);
  // console.log(node);

  html2canvas(node, {
    backgroundColor: null,
    allowTaint: true,
    scale,
  }).then((canvas) => {
    canvas.toBlob((blob) => {
      saveBlob(blob, newFilePathAndName);
    }, getMimeType(outputFormat), qualityArgument);
  });

  const newFilePathAndNameWithoutExtension = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.name
  );

  if (saveIndividualThumbs) {
    thumbs.map(thumb => {
      saveThumb(
        newFilePathObject.name, thumb.frameNumber, thumb.frameId,
        newFilePathAndNameWithoutExtension, overwrite
      );
    });
  }
};

export default saveMoviePrint;
