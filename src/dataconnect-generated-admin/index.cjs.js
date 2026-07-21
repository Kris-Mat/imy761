const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'users',
  serviceId: 'imy761-b36eb-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

function getUsers(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetUsers', undefined, inputOpts);
}
exports.getUsers = getUsers;

function seedUsers(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SeedUsers', undefined, inputOpts);
}
exports.seedUsers = seedUsers;

