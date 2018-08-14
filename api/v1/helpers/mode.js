export default (arr) => {
  return arr.reduce((current, item) => {
    current.numMapping[item] = (current.numMapping[item] || 0) + 1;
    let val = current.numMapping[item];
    if (val > current.greatestFreq) {
      current.greatestFreq = val;
      current.mode = item;
    }
    return current;
  }, { mode: null, greatestFreq: -Infinity, numMapping: {} }).mode;
};
