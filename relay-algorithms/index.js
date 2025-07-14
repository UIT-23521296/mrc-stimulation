module.exports = {
    ...require('./roundRobin'),
    ...require('./wlc'),
    ...require('./resourceBased'),
    ...require('./hybridAdaptive'),
    ...require('./adaptiveProperties'),
    computeWeight: require('./adaptiveProperties').computeWeight
};
  