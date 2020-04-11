import log from 'electron-log';
import * as faceapi from 'face-api.js';

import { limitRange, roundNumber, mapRange } from './utils';
import { FILTER_METHOD, SORT_METHOD } from './constants';

// sort detectionArray by ...
export const sortArray = (
  detectionArray,
  sortMethod = SORT_METHOD.FACESIZE,
  reverseSortOrder = false,
  optionalSortProperties = undefined,
) => {
  let sortedArray = [];
  const sortOrderMultiplier = reverseSortOrder ? -1 : 1;
  switch (sortMethod) {
    case SORT_METHOD.FRAMENUMBER:
      sortedArray = detectionArray
        .slice()
        .sort((a, b) => (a.frameNumber > b.frameNumber ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));
      // .map(item => item.frameNumber);
      break;
    case SORT_METHOD.FACESIZE:
      sortedArray = detectionArray
        .slice()
        .filter(item => item.faceCount !== 0) // filter out frames with no faces
        .sort((a, b) => (a.largestSize < b.largestSize ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));
      // .map(item => item.frameNumber);
      break;
    case SORT_METHOD.FACECOUNT:
      sortedArray = detectionArray
        .slice()
        .filter(item => item.faceCount !== 0) // filter out frames with no faces
        .sort((a, b) => (a.faceCount < b.faceCount ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));
      // .map(item => item.frameNumber);
      break;
    case SORT_METHOD.FACECONFIDENCE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArray(detectionArrayFiltered);

      // sort
      flattenedArray.sort((a, b) => (a.score < b.score ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));

      // only keep first occurrence of frameNumber
      sortedArray = flattenedArray.filter(
        (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
      );
      // sortedArray =
      break;
    }
    case SORT_METHOD.FACEOCCURRENCE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArrayWithOccurrences(detectionArrayFiltered);
      // console.log(flattenedArray.map(item => ({ faceGroupNumber: item.faceGroupNumber, size: item.size, occurrence: item.occurrence })));

      // sort by count, size and then score
      flattenedArray.sort((a, b) => {
        // Sort by count number
        if (a.occurrence < b.occurrence) return sortOrderMultiplier * 1;
        if (a.occurrence > b.occurrence) return sortOrderMultiplier * -1;

        // If the count number is the same between both items, sort by size
        if (a.size < b.size) return sortOrderMultiplier * 1;
        if (a.size > b.size) return sortOrderMultiplier * -1;

        // If the count number is the same between both items, sort by size
        if (a.score < b.score) return sortOrderMultiplier * 1;
        if (a.score > b.score) return sortOrderMultiplier * -1;
        return -1;
      });

      // only keep first occurrence of frameNumber
      sortedArray = flattenedArray.filter(
        (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
      );
      break;
    }
    case SORT_METHOD.DISTTOORIGIN: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const { faceIdOfOrigin } = optionalSortProperties;

      if (detectionArrayFiltered.length > 0 && faceIdOfOrigin !== undefined) {
        console.log(faceIdOfOrigin);

        if (faceIdOfOrigin !== undefined) {
          const flattenedArray = getFlattenedArrayWithOccurrences(detectionArrayFiltered);
          console.log(flattenedArray);

          // filter array to only include faceIdOfOrigin
          flattenedArray.filter(item => item.faceGroupNumber === faceIdOfOrigin);

          // sort by distToOrigin
          flattenedArray.sort((a, b) => {
            // Sort by distToOrigin
            if (a.distToOrigin > b.distToOrigin) return sortOrderMultiplier * 1;
            if (a.distToOrigin < b.distToOrigin) return sortOrderMultiplier * -1;
            return -1;
          });

          // only keep first occurrence of frameNumber
          sortedArray = flattenedArray.filter(
            (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
          );
        }
      }
      break;
    }
    default:
  }
  console.log(sortedArray);
  return sortedArray;
};

// filter detectionArray by ...
export const filterArray = (detectionArray, filterMethod = FILTER_METHOD.FACESIZE) => {
  let filteredAndSortedArray = [];
  switch (filterMethod) {
    case FILTER_METHOD.GENDER: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArrayWithOccurrences(detectionArrayFiltered);

      // get only origins
      filteredAndSortedArray = flattenedArray.filter(item => item.gender === 0);
      // only keep first occurrence of faceGroupNumber
      // filteredAndSortedArray = flattenedArray.filter(
      //   (item, index, self) => index === self.findIndex(t => t.faceGroupNumber === item.faceGroupNumber),
      // );

      // sort by count, size and then score
      filteredAndSortedArray.sort((a, b) => {
        // Sort by occurrence
        if (a.occurrence < b.occurrence) return 1;
        if (a.occurrence > b.occurrence) return -1;

        // If the count number is the same between both items, sort by size
        if (a.size < b.size) return 1;
        if (a.size > b.size) return -1;

        // If the count number is the same between both items, sort by size
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return -1;
      });
      break;
    }
    case FILTER_METHOD.UNIQUE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArrayWithOccurrences(detectionArrayFiltered);

      // get only origins
      filteredAndSortedArray = flattenedArray.filter(item => item.distToOrigin === 0);
      // only keep first occurrence of faceGroupNumber
      // filteredAndSortedArray = flattenedArray.filter(
      //   (item, index, self) => index === self.findIndex(t => t.faceGroupNumber === item.faceGroupNumber),
      // );

      // sort by count, size and then score
      filteredAndSortedArray.sort((a, b) => {
        // Sort by occurrence
        if (a.occurrence < b.occurrence) return 1;
        if (a.occurrence > b.occurrence) return -1;

        // If the count number is the same between both items, sort by size
        if (a.size < b.size) return 1;
        if (a.size > b.size) return -1;

        // If the count number is the same between both items, sort by size
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return -1;
      });
      break;
    }
    default:
  }
  console.log(filteredAndSortedArray);
  return filteredAndSortedArray;
};

export const getFlattenedArrayWithOccurrences = detectionArray => {
  const arrayOfOccurrences = getArrayOfOccurrences(detectionArray);
  const flattenedArray = getFlattenedArray(detectionArray);
  flattenedArray.forEach(item => {
    // convert object to array and find occurrence and add to item
    const { count } = Object.values(arrayOfOccurrences).find(item2 => item2.faceGroupNumber === item.faceGroupNumber);
    item.occurrence = count;
  });
  return flattenedArray;
};

export const getFlattenedArray = detectionArray => {
  const flattenedArray = [];
  detectionArray.map(item => {
    const { facesArray, ...rest } = item;
    if (facesArray !== undefined) {
      facesArray.map(face => {
        flattenedArray.push({ ...face, ...rest });
        return undefined;
      });
    }
    return undefined;
  });
  return flattenedArray;
};

export const getArrayOfOccurrences = detectionArray => {
  // flatten the detectionArray
  const flattenedArray = getFlattenedArray(detectionArray);
  const arrayOfOccurrences = flattenedArray.reduce((acc, curr) => {
    if (acc[curr.faceGroupNumber] === undefined) {
      acc[curr.faceGroupNumber] = { count: 1, faceGroupNumber: curr.faceGroupNumber };
    } else {
      acc[curr.faceGroupNumber].count += 1;
    }
    return acc;
  }, {});
  // console.log(arrayOfOccurrences);
  // console.log(typeof arrayOfOccurrences);

  return arrayOfOccurrences;
};

export const determineAndInsertFaceGroupNumber = (detectionArray, defaultFaceUniquenessThreshold) => {
  // this function determines unique faces and adds the faceGroupNumber into the detectionArray
  // initialise the faceGroupNumber
  let faceGroupNumber = 0;
  const uniqueFaceArray = [];
  detectionArray.forEach(frame => {
    if (frame.faceCount !== 0) {
      frame.facesArray.forEach(face => {
        const currentFaceDescriptor = Object.values(face.faceDescriptor);
        const uniqueFaceArrayLength = uniqueFaceArray.length;
        if (uniqueFaceArrayLength === 0) {
          uniqueFaceArray.push(currentFaceDescriptor); // convert array
          face.faceGroupNumber = faceGroupNumber;
          face.distToOrigin = 0;
        } else {
          // compare descriptor value with all values in the array
          for (let i = 0; i < uniqueFaceArrayLength; i += 1) {
            const dist = faceapi.euclideanDistance(currentFaceDescriptor, uniqueFaceArray[i]);
            // console.log(dist);
            // check how close the faces are
            if (dist < defaultFaceUniquenessThreshold) {
              // faces are similar or equal
              // console.log(
              //   dist === 0
              //   ? `this and face ${i} are identical: ${dist}`
              //   : `this and face ${i} are probably the same: ${dist}`,
              // );
              faceGroupNumber = i;
              face.faceGroupNumber = faceGroupNumber;
              face.distToOrigin = roundNumber(dist);
              break;
            } else if (i === uniqueFaceArrayLength - 1) {
              // face is unique
              // if no match was found add the current descriptor to the array marking a new unique face
              // console.log(`this face is unique: ${dist}`);
              uniqueFaceArray.push(currentFaceDescriptor); // convert array
              faceGroupNumber = uniqueFaceArrayLength;
              face.faceGroupNumber = faceGroupNumber;
              face.distToOrigin = 0;
            }
          }
        }
        return undefined;
      });
    }
    return undefined;
  });
};

export const getOccurrencesOfFace = (detectionArray, frameNumber, defaultFaceUniquenessThreshold) => {
  // returns an array of foundFrames where this face occurrs
  // initialise the foundFrames
  const foundFrames = [];

  const frameOfFace = detectionArray.find(frame => frame.frameNumber === frameNumber);
  console.log(frameOfFace);
  if (frameOfFace === undefined || frameOfFace.facesArray === undefined || frameOfFace.facesArray.length === 0) {
    return []; // return an empty array as there where no occurrences
  }

  // use first face in array to search for
  // later it would be nice if one can specify which face on an array to search for
  const faceIdOfOrigin = frameOfFace.facesArray[0].faceId;
  const faceDescriptorOfFace = Object.values(frameOfFace.facesArray[0].faceDescriptor);

  detectionArray.forEach(frame => {
    if (frame.faceCount !== 0) {
      const foundFaces = [];
      frame.facesArray.forEach(face => {
        const currentFaceDescriptor = Object.values(face.faceDescriptor);
        // compare descriptor value with faceDescriptorOfFace
        const dist = faceapi.euclideanDistance(currentFaceDescriptor, faceDescriptorOfFace);
        console.log(dist);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < defaultFaceUniquenessThreshold) {
          console.log(dist === 0 ? `this face is identical: ${dist}` : `this face is probably the same: ${dist}`);
          foundFaces.push({ ...face, distToOrigin: dist, faceDescriptor: undefined });
        } else if (foundFaces.length > 0) {
          // only add other faces if one face is similar
          console.log(`this face is different: ${dist}`);
          foundFaces.push({ ...face, faceDescriptor: undefined });
        }
        return undefined;
      });
      if (foundFaces.length > 0) {
        foundFrames.push({ ...frame, facesArray: foundFaces });
      }
    }
    return undefined;
  });
  return {
    faceIdOfOrigin,
    foundFrames,
  };
};

export const insertOccurrence = detectionArray => {
  // this function determines occurrences and adds them to the detectionArray
  // insert occurrence into detectionArray
  const arrayOfOccurrences = getArrayOfOccurrences(detectionArray);
  console.log(arrayOfOccurrences);
  detectionArray.forEach(frame => {
    if (frame.facesArray !== undefined) {
      frame.facesArray.forEach(face => {
        // convert object to array and find occurrence and add to item
        const { count } = Object.values(arrayOfOccurrences).find(item => item.faceGroupNumber === face.faceGroupNumber);
        /* eslint no-param-reassign: ["error", { "props": false }] */
        face.occurrence = count;
      });
    }
  });
};

export const getIntervalArray = (
  amount,
  start,
  stop,
  maxValue,
  limitToMaxValue = false, // in some cases it can be allowed to go over
) => {
  // amount should not be more than the maxValue
  // stop - start should be at least amount
  let newStart = start;
  let newStop = stop;
  const range = stop - start;

  let newAmount = Math.min(amount, maxValue - 1);
  if (range < newAmount) {
    if (limitToMaxValue) {
      newAmount = range + 1;
    } else {
      newStop = start + newAmount;
      if (newStop > maxValue - 1) {
        newStart = Math.max(0, maxValue - 1 - newAmount);
        newStop = newStart + newAmount;
      }
    }
  }
  // log.debug(`${amount} : ${newAmount} : ${start} : ${newStart} : ${stop} : ${newStop} : `);

  const startWithBoundaries = limitRange(newStart, 0, maxValue - 1);
  const stopWithBoundaries = limitRange(newStop, 0, maxValue - 1);
  const frameNumberArray = Array.from(Array(newAmount).keys()).map(x =>
    mapRange(x, 0, newAmount - 1, startWithBoundaries, stopWithBoundaries, true),
  );
  return frameNumberArray;
};

export const sortThumbsArray = (thumbsArray, sortOrderArray) => {
  // extract frameNumbers
  const frameNumberArrayFromFaceDetection = sortOrderArray.map(item => item.frameNumber);
  console.log(frameNumberArrayFromFaceDetection);
  console.log(thumbsArray);

  // let filteredArray = thumbsArray;
  // if (hideOthers) {
  //   // filter thumbsArray by frameNumberArrayFromFaceDetection
  //   filteredArray = thumbsArray.filter(item => frameNumberArrayFromFaceDetection.includes(item.frameNumber));
  // }

  const thumbsArrayAfterSorting = thumbsArray.slice().sort((a, b) => {
    return (
      frameNumberArrayFromFaceDetection.indexOf(a.frameNumber) -
      frameNumberArrayFromFaceDetection.indexOf(b.frameNumber)
    );
  });
  console.log(thumbsArrayAfterSorting);
  return thumbsArrayAfterSorting;
};

export const deleteFaceDescriptorFromFaceScanArray = faceScanArray => {
  // note!!! this is a mutating function
  faceScanArray.map(frame => {
    // loop through all frames
    if (frame.facesArray !== undefined) {
      frame.facesArray.map(face => {
        // loop through all faces
        delete face.faceDescriptor;
        return undefined;
      });
    }
    return undefined;
  });
  return faceScanArray;
};

// export const getFrameNumberArrayOfOccurrences = (detectionArray, faceGroupNumber) => {
//   // flatten the detectionArray
//   const flattenedArray = getFlattenedArray(detectionArray);
//   const frameNumberArray = [];
//   flattenedArray.map(face => {
//     if (face.faceGroupNumber === faceGroupNumber) {
//       frameNumberArray.push(face.frameNumber);
//     }
//     return undefined;
//   });
//   console.log(flattenedArray);
//   console.log(frameNumberArray);
//
//   return frameNumberArray;
// };
