module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_referral', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(11),
      },
      user_id: {
        type: Sequelize.INTEGER,
        // references: {
        //   model: 'User',
        //   key: 'id',
        // },
      },
      ref_user_id: {
        type: Sequelize.INTEGER,
        // references: {
        //   model: 'User',
        //   key: 'id',
        // },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_referral')
  },
}
