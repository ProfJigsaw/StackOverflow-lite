export default (arrayOfObjects, key) => {
  let max = 0;
  arrayOfObjects.map((obj) => {
    max = (obj[key] > max) ? obj[key] : max;
    return false;
  });
  return max + 1;
};
