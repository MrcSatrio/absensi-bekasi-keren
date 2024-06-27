const express = require("express");
const bodyParser = require("body-parser");
const { Op } = require("sequelize");
const multer = require('multer');
const path = require('path');
const Absen = require("./models/absen");
const Kartu = require("./models/kartu");
const Akun = require("./models/akun");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directory to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original name of the file
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Endpoint untuk mendapatkan semua absen
app.get("/absen", async (req, res) => {
  try {
    const absens = await Absen.findAll();
    res.json(absens);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint untuk menambah absen baru
app.post("/absen", async (req, res) => {
  try {
    const { kartu, link } = req.body;

    // Validasi input
    if (!kartu || !link) {
      return res.status(400).json({ error: "kartu and link are required" });
    }

    // Cek apakah kartu terdapat di database
    const kartuRecord = await Kartu.findOne({ where: { nomor_kartu: kartu } });
    if (!kartuRecord) {
      return res.status(404).json({ error: "Kartu not found" });
    }

    // Cari akun berdasarkan id_kartu
    const akunRecord = await Akun.findOne({
      where: { id_kartu: kartuRecord.id_kartu },
    });
    if (!akunRecord) {
      return res
        .status(404)
        .json({ error: "Akun not found for the given kartu" });
    }

    // Cek apakah sudah ada absen pada hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set waktu ke awal hari
    const absenToday = await Absen.findOne({
      where: {
        id_user: akunRecord.id_user,
        jam_masuk: {
          [Op.gte]: today,
        },
      },
    });

    if (absenToday) {
      if (!absenToday.jam_pulang) {
        absenToday.foto_pulang = link;
        absenToday.jam_pulang = new Date();
        absenToday.updated_at = new Date();
        await absenToday.save();
        return res
          .status(200)
          .json({ message: "Check-out recorded", absen: absenToday });
      } else {
        // Jika jam_masuk dan jam_pulang sudah ada, kembalikan pesan bahwa sudah absen hari ini
        return res
          .status(200)
          .json({
            message: "User has already checked in and out today",
            absen: absenToday,
          });
      }
    } else {
      // Jika belum absen, masukkan absen baru ke database
      const newAbsen = await Absen.create({
        id_user: akunRecord.id_user,
        foto_masuk: link,
        jam_masuk: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res.status(201).json({
        message: "check-in recorded",
        absen: newAbsen,
      });
    }
  } catch (error) {
    console.error(error); // Log error untuk debugging
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint untuk upload foto
app.post('/foto', upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const filePath = req.file.path;
    console.log('File uploaded to:', filePath);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: req.file
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Endpoint untuk mendapatkan absen berdasarkan ID
app.get('/absen/:id', async (req, res) => {
    try {
      const absen = await Absen.findByPk(req.params.id);
      if (absen) {
        res.json(absen);
      } else {
        res.status(404).json({ error: 'Absen not found' });
      }
    } catch (error) {
      console.error(error); // Log error untuk debugging
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

// Middleware untuk menangani error dari multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed!') {
    res.status(400).json({ error: err.message });
  } else {
    next(err);
  }
});

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
