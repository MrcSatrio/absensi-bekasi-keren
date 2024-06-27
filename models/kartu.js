const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../config.json').development);

const Kartu = sequelize.define('Kartu', {
  id_kartu: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nomor_kartu: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: false,
  tableName: 'kartu'
});

module.exports = Kartu;
