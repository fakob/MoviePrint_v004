import Dexie from 'dexie';

const SceneDetectionDataObject = Dexie.defineClass({
  frameId: String,
  data: [Number],
});

export default SceneDetectionDataObject;
