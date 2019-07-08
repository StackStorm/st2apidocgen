const isPerfRun = process.env.DEBUG === 'perf';
const start = process.hrtime();

module.exports = () => {
  if (!isPerfRun) { 
    return ''; 
  }
  const [ seconds, fractions ] = process.hrtime(start);
  return ` [ ${(seconds + (fractions / (10 ** 9))).toFixed(9)} | ${(process.memoryUsage().rss / (2 ** 20)).toFixed(3)} ]`;
};
