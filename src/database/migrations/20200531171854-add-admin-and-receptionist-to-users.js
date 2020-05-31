module.exports = {
  up: async (queryInterface, Sequelize) => {
    let transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'users',
        'admin',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'users',
        'receptionist',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction }
      );
      await transaction.commit();
      return Promise.resolve();
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      return Promise.reject(err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    let transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('users', 'admin', {
        transaction,
      });
      await queryInterface.removeColumn('users', 'receptionist', {
        transaction,
      });
      await transaction.commit();
      return Promise.resolve();
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      return Promise.reject(err);
    }
  },
};
