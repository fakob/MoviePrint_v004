import log from 'electron-log';
import * as faceapi from 'face-api.js';

import { areOneOrMoreFiltersEnabled, limitRange, roundNumber, mapRange } from './utils';
import {
  FILTER_METHOD,
  SORT_METHOD,
  FILTER_METHOD_AGE,
  FILTER_METHOD_FACESIZE,
  FILTER_METHOD_FACEOCCURRENCE,
  FILTER_METHOD_FACECOUNT,
} from './constants';

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
    case SORT_METHOD.FACECOUNT:
      sortedArray = detectionArray
        .slice()
        .filter(item => item.faceCount !== 0) // filter out frames with no faces
        .sort((a, b) => (a.faceCount < b.faceCount ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));
      // .map(item => item.frameNumber);
      break;
    case SORT_METHOD.FACESIZE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArray(detectionArrayFiltered);
      const flattenedArrayFiltered = flattenedArray.filter(item => !item.faceIsHidden); // filter out faces which are hidden

      // sort
      flattenedArrayFiltered.sort((a, b) => (a.size < b.size ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));

      // only keep first faceOccurrence of frameNumber
      sortedArray = flattenedArrayFiltered.filter(
        (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
      );
      // sortedArray =
      break;
    }
    case SORT_METHOD.FACECONFIDENCE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArray(detectionArrayFiltered);
      const flattenedArrayFiltered = flattenedArray.filter(item => !item.faceIsHidden); // filter out faces which are hidden

      // sort
      flattenedArrayFiltered.sort((a, b) => (a.score < b.score ? sortOrderMultiplier * 1 : sortOrderMultiplier * -1));

      // only keep first faceOccurrence of frameNumber
      sortedArray = flattenedArrayFiltered.filter(
        (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
      );
      // sortedArray =
      break;
    }
    case SORT_METHOD.FACEOCCURRENCE: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const flattenedArray = getFlattenedArray(detectionArrayFiltered);
      const flattenedArrayFiltered = flattenedArray.filter(item => !item.faceIsHidden); // filter out faces which are hidden
      // console.log(flattenedArray.map(item => ({ faceGroupNumber: item.faceGroupNumber, size: item.size, faceOccurrence: item.faceOccurrence })));

      // sort by count, size and then score
      flattenedArrayFiltered.sort((a, b) => {
        // Sort by count number
        if (a.faceOccurrence < b.faceOccurrence) return sortOrderMultiplier * 1;
        if (a.faceOccurrence > b.faceOccurrence) return sortOrderMultiplier * -1;

        // If the count number is the same between both items, sort by size
        if (a.size < b.size) return sortOrderMultiplier * 1;
        if (a.size > b.size) return sortOrderMultiplier * -1;

        // If the count number is the same between both items, sort by size
        if (a.score < b.score) return sortOrderMultiplier * 1;
        if (a.score > b.score) return sortOrderMultiplier * -1;
        return -1;
      });

      // only keep first faceOccurrence of frameNumber
      sortedArray = flattenedArrayFiltered.filter(
        (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
      );
      break;
    }
    case SORT_METHOD.DISTTOORIGIN: {
      // filtered and flatten the detectionArray
      const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
      const { faceIdOfOrigin } = optionalSortProperties;

      if (detectionArrayFiltered.length > 0 && faceIdOfOrigin !== undefined) {
        // console.log(faceIdOfOrigin);

        if (faceIdOfOrigin !== undefined) {
          const flattenedArray = getFlattenedArray(detectionArrayFiltered);
          const flattenedArrayFiltered = flattenedArray.filter(item => !item.faceIsHidden); // filter out faces which are hidden
          // console.log(flattenedArray);

          // filter array to only include faceIdOfOrigin
          flattenedArrayFiltered.filter(item => item.faceGroupNumber === faceIdOfOrigin);

          // sort by distToOrigin
          flattenedArrayFiltered.sort((a, b) => {
            // Sort by distToOrigin
            if (a.distToOrigin > b.distToOrigin) return sortOrderMultiplier * 1;
            if (a.distToOrigin < b.distToOrigin) return sortOrderMultiplier * -1;
            return -1;
          });

          // only keep first faceOccurrence of frameNumber
          sortedArray = flattenedArrayFiltered.filter(
            (item, index, self) => index === self.findIndex(t => t.frameNumber === item.frameNumber),
          );
        }
      }
      break;
    }
    default:
  }
  // console.log(sortedArray);
  return sortedArray;
};

// filter detectionArray by ...
export const filterArray = (detectionArray, filters) => {
  // console.log(filters);

  // if there are no filters, return untouched
  if (!areOneOrMoreFiltersEnabled(filters)) {
    // remove faceDescriptor and unhide thumbs
    deleteFaceDescriptorFromFaceScanArray(detectionArray, true);
    return detectionArray;
  }

  const detectionArrayFiltered = detectionArray.filter(item => item.faceCount !== 0); // filter out frames with no faces
  const flattenedArray = getFlattenedArray(detectionArrayFiltered);

  // filteredAndSortedArray = flattenedArray.filter(item => item.distToOrigin === 0);

  /* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement", "BinaryExpression[operator='in']"] */
  // mutating array!!!
  flattenedArray.forEach(item => {
    // start by unhiding all faces
    item.faceIsHidden = false;

    for (const key of Object.keys(filters)) {
      // console.log(key)
      // console.log(filters[key])
      // console.log(item[key])
      // only filter if enabled
      if (filters[key].enabled) {
        // set new max value if upper equals max to not exclude top values on age, size ...
        let newMaxValue;
        let rangeFilter = false;
        let valueFilter = false;
        let arrayFilter = false;
        switch (key) {
          // rangeFilters
          case FILTER_METHOD.AGE:
            newMaxValue = filters[key].upper === FILTER_METHOD_AGE.MAX ? FILTER_METHOD_AGE.MAXMAX : filters[key].upper;
            rangeFilter = true;
            break;
          case FILTER_METHOD.FACECOUNT:
            newMaxValue =
              filters[key].upper === FILTER_METHOD_FACECOUNT.MAX ? FILTER_METHOD_FACECOUNT.MAXMAX : filters[key].upper;
            rangeFilter = true;
            break;
          case FILTER_METHOD.FACEOCCURRENCE:
            newMaxValue =
              filters[key].upper === FILTER_METHOD_FACEOCCURRENCE.MAX
                ? FILTER_METHOD_FACEOCCURRENCE.MAXMAX
                : filters[key].upper;
            rangeFilter = true;
            break;
          case FILTER_METHOD.FACESIZE:
            newMaxValue =
              filters[key].upper === FILTER_METHOD_FACESIZE.MAX ? FILTER_METHOD_FACESIZE.MAXMAX : filters[key].upper;
            rangeFilter = true;
            break;

          // valueFilters
          case FILTER_METHOD.GENDER:
            valueFilter = true;
            break;
          case FILTER_METHOD.DISTTOORIGIN:
            valueFilter = true;
            break;

          // arrayFilter
          case FILTER_METHOD.FACEID:
            arrayFilter = true;
            break;
          default:
        }

        // if rangeFilter hide face if it is not within range
        if (
          rangeFilter &&
          (item[key] === undefined || !(filters[key].lower <= item[key] && item[key] <= newMaxValue))
        ) {
          item.faceIsHidden = true;
          break; // break out of for loop and go to next item
        }

        // if valueFilter hide face if it is not a specific value
        if (valueFilter && (item[key] === undefined || item[key] !== filters[key].value)) {
          item.faceIsHidden = true;
          break; // break out of for loop and go to next item
        }

        // if arrayFilter hide face if it is not a specific value
        if (
          arrayFilter &&
          (item[key] === undefined || !filters[key].faceIdArray.some(faceId => faceId === item[key]))
        ) {
          item.faceIsHidden = true;
          break; // break out of for loop and go to next item
        }
      }
    }
    return undefined;
  });

  // sort by count, size and then score
  flattenedArray.sort((a, b) => {
    // Sort by faceOccurrence
    if (a.faceOccurrence < b.faceOccurrence) return 1;
    if (a.faceOccurrence > b.faceOccurrence) return -1;

    // If the count number is the same between both items, sort by size
    if (a.size < b.size) return 1;
    if (a.size > b.size) return -1;

    // If the count number is the same between both items, sort by size
    if (a.score < b.score) return 1;
    if (a.score > b.score) return -1;
    return -1;
  });

  const unflattenedArray = unflattenArray(flattenedArray);
  // console.log(filteredAndSortedArray);
  return unflattenedArray;
};

export const unflattenArray = flattenedArray => {
  // construct a new unflattened Array
  const unflattenedArray = [];
  // console.log(unflattenedArray);
  flattenedArray.map(face => {
    const indexOfOtherFrame = unflattenedArray.findIndex(item => item.frameNumber === face.frameNumber);
    const newFaceObject = {
      faceIsHidden: face.faceIsHidden,
      score: face.score,
      size: face.size,
      box: face.box,
      gender: face.gender,
      age: face.age,
      faceId: face.faceId,
      faceGroupNumber: face.faceGroupNumber,
      faceOccurrence: face.faceOccurrence,
      distToOrigin: face.distToOrigin,
    };
    if (indexOfOtherFrame > -1) {
      // if it already exists push new face and in case faceIsHidden is false update hidden property to show thumb
      unflattenedArray[indexOfOtherFrame].facesArray.push(newFaceObject);
      if (!face.faceIsHidden) {
        unflattenedArray[indexOfOtherFrame].hidden = false;
      }
    } else {
      unflattenedArray.push({
        frameNumber: face.frameNumber,
        faceCount: face.faceCount,
        largestSize: face.largestSize,
        facesArray: [newFaceObject],
        hidden: face.faceIsHidden,
      });
    }
    // console.log(face.frameNumber);
    return undefined;
  });
  // console.log(unflattenedArray);
  return unflattenedArray;
};

// export const getFlattenedArrayWithOccurrences = detectionArray => {
//   const arrayOfOccurrences = getArrayOfOccurrences(detectionArray);
//   const flattenedArray = getFlattenedArray(detectionArray);
//   flattenedArray.forEach(item => {
//     // convert object to array and find faceOccurrence and add to item
//     const { count } = Object.values(arrayOfOccurrences).find(item2 => item2.faceGroupNumber === item.faceGroupNumber);
//     item.faceOccurrence = count;
//   });
//   return flattenedArray;
// };

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
  // console.log(frameOfFace);
  if (frameOfFace === undefined || frameOfFace.facesArray === undefined || frameOfFace.facesArray.length === 0) {
    return []; // return an empty array as there where no faceOccurrences
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
        // console.log(dist);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < defaultFaceUniquenessThreshold) {
          // console.log(dist === 0 ? `this face is identical: ${dist}` : `this face is probably the same: ${dist}`);
          foundFaces.push({ ...face, distToOrigin: dist, faceDescriptor: undefined });
        } else if (foundFaces.length > 0) {
          // only add other faces if one face is similar
          // console.log(`this face is different: ${dist}`);
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
  // this function determines faceOccurrences and adds them to the detectionArray
  // insert faceOccurrence into detectionArray
  const arrayOfOccurrences = getArrayOfOccurrences(detectionArray);
  // console.log(arrayOfOccurrences);
  detectionArray.forEach(frame => {
    if (frame.facesArray !== undefined) {
      frame.facesArray.forEach(face => {
        // convert object to array and find faceOccurrence and add to item
        const { count } = Object.values(arrayOfOccurrences).find(item => item.faceGroupNumber === face.faceGroupNumber);
        /* eslint no-param-reassign: ["error", { "props": false }] */
        face.faceOccurrence = count;
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
  // console.log(frameNumberArrayFromFaceDetection);
  // console.log(thumbsArray);

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
  // console.log(thumbsArrayAfterSorting);
  return thumbsArrayAfterSorting;
};

export const deleteFaceDescriptorFromFaceScanArray = (faceScanArray, unhide = false) => {
  // note!!! this is a mutating function
  faceScanArray.map(frame => {
    // loop through all frames
    if (unhide) {
      frame.hidden = false;
    }
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

export const getFaceIdArrayFromThumbs = thumbArray => {
  const flattenedArray = getFlattenedArray(thumbArray);
  // get faceId of all faces with distToOrigin parameter (used for expanded face prints)
  const faceIdArray = flattenedArray.filter(face => face.distToOrigin !== undefined).map(face => face.faceId);
  return faceIdArray;
};
