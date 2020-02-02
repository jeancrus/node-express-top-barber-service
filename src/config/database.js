require('dotenv').config();

module.exports = {
  dialect: 'postgres',
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
