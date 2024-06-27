const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../config.json').development);

const Akun = sequelize.define('Akun', {
  id_user: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_kartu: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_role: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'akun'
});

module.exports = Akun;
