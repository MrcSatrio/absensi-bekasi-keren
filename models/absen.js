const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../config.json').development);
const moment = require('moment-timezone');

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
  tableName: 'absen',
  hooks: {
    beforeCreate: (absen, options) => {
      absen.jam_masuk = moment(absen.jam_masuk).tz('Asia/Jakarta').toDate();
      absen.created_at = moment().tz('Asia/Jakarta').toDate();
      absen.updated_at = moment().tz('Asia/Jakarta').toDate();
    },
    beforeUpdate: (absen, options) => {
      if (absen.jam_pulang) {
        absen.jam_pulang = moment(absen.jam_pulang).tz('Asia/Jakarta').toDate();
      }
      absen.updated_at = moment().tz('Asia/Jakarta').toDate();
    }
  }
});

module.exports = Absen;
