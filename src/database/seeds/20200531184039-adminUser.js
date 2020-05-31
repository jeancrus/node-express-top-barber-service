const { hash } = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'admin user',
          email: 'admin@topbarber.com.br',
          password_hash: await hash('teste', 8),
          admin: true,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      ],
      {}
    ),

  down: (queryInterface) => queryInterface.bulkDelete('users', null, {}),
};
