const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../config.json').development);

const Absen = sequelize.define('Absen', {
  id_absen: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  jam_masuk: {
    type: DataTypes.DATE,
    allowNull: false
  },
  jam_pulang: {
    type: DataTypes.DATE,
    allowNull: true
  },
  foto_masuk: {
    type: DataTypes.STRING,
    allowNull: true
  },
  foto_pulang: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,  // Enable timestamps for createdAt and updatedAt
  underscored: true, // Use snake_case for automatically added attributes
  tableName: 'absen'
});

module.exports = Absen;
