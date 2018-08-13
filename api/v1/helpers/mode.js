export default arr => {
	return arr.reduce((current, item)=>{
		let val = current.numMapping[item] = (current.numMapping[item] || 0) + 1;
		if(val > current.greatestFreq){
			current.greatestFreq = val;
			current.mode = item;
		}
		return current;
	}, {mode: null, greatestFreq: -Infinity, numMapping: {}}).mode;
};