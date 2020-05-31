const { hash } = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Receptionist user',
          email: 'receptionist1@topbarber.com.br',
          password_hash: await hash('teste1', 8),
          receptionist: true,
          provider: false,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
        {
          name: 'Provider user',
          email: 'provider1@topbarber.com.br',
          password_hash: await hash('teste2', 8),
          provider: true,
          receptionist: false,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      ],
      {}
    ),

  down: (queryInterface) => queryInterface.bulkDelete('users', null, {}),
};
