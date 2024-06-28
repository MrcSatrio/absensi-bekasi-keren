const express = require("express");
const bodyParser = require("body-parser");
const { Op } = require("sequelize");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const moment = require('moment-timezone');
const crypto = require('crypto');
const Absen = require("./models/absen");
const Kartu = require("./models/kartu");
const Akun = require("./models/akun");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
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

function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// Endpoint to get all absences
app.get("/absen", async (req, res) => {
  try {
    const absens = await Absen.findAll();
    res.json(absens);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint to add a new absence
app.post("/absen", async (req, res) => {
  try {
    const { kartu, link } = req.body;

    if (!kartu || !link) {
      return res.status(400).json({ error: "kartu and link are required" });
    }

    const kartuRecord = await Kartu.findOne({ where: { nomor_kartu: kartu } });
    if (!kartuRecord) {
      return res.status(404).json({ error: "Kartu not found" });
    }

    const akunRecord = await Akun.findOne({ where: { id_kartu: kartuRecord.id_kartu } });
    if (!akunRecord) {
      return res.status(404).json({ error: "Akun not found for the given kartu" });
    }

    const today = moment.tz('Asia/Jakarta').startOf('day');
    const absenToday = await Absen.findOne({
      where: {
        id_user: akunRecord.id_user,
        jam_masuk: { [Op.gte]: today.toDate() },
      },
    });

    if (absenToday) {
      if (!absenToday.jam_pulang) {
        absenToday.foto_pulang = link;
        absenToday.jam_pulang = moment.tz('Asia/Jakarta').toDate();
        absenToday.updated_at = moment.tz('Asia/Jakarta').toDate();
        await absenToday.save();
        return res.status(200).json({
          message: "Check-out recorded",
          absen: {
            ...absenToday.toJSON(),
            jam_masuk: moment(absenToday.jam_masuk).tz('Asia/Jakarta').format(),
            jam_pulang: moment(absenToday.jam_pulang).tz('Asia/Jakarta').format(),
            updatedAt: moment(absenToday.updatedAt).tz('Asia/Jakarta').format(),
            createdAt: moment(absenToday.createdAt).tz('Asia/Jakarta').format(),
          }
        });
      } else {
        return res.status(200).json({
          message: "User has already checked in and out today",
          absen: {
            ...absenToday.toJSON(),
            jam_masuk: moment(absenToday.jam_masuk).tz('Asia/Jakarta').format(),
            jam_pulang: moment(absenToday.jam_pulang).tz('Asia/Jakarta').format(),
            updatedAt: moment(absenToday.updatedAt).tz('Asia/Jakarta').format(),
            createdAt: moment(absenToday.createdAt).tz('Asia/Jakarta').format(),
          }
        });
      }
    } else {
      const newAbsen = await Absen.create({
        id_user: akunRecord.id_user,
        foto_masuk: link,
        jam_masuk: moment.tz('Asia/Jakarta').toDate(),
        created_at: moment.tz('Asia/Jakarta').toDate(),
        updated_at: moment.tz('Asia/Jakarta').toDate(),
      });

      return res.status(201).json({
        message: "Check-in recorded",
        absen: {
          ...newAbsen.toJSON(),
          jam_masuk: moment(newAbsen.jam_masuk).tz('Asia/Jakarta').format(),
          jam_pulang: newAbsen.jam_pulang ? moment(newAbsen.jam_pulang).tz('Asia/Jakarta').format() : null,
          updatedAt: moment(newAbsen.updatedAt).tz('Asia/Jakarta').format(),
          createdAt: moment(newAbsen.createdAt).tz('Asia/Jakarta').format(),
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// Endpoint to upload a photo
app.post('/foto', upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const filePath = req.file.path;
    console.log('File uploaded to:', filePath);

    res.status(201).json({ message: 'File uploaded successfully', file: req.file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Endpoint to get all images
app.get('/images', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory' });
    }
    const imageFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|gif)$/));
    res.status(200).json({ images: imageFiles });
  });
});

// Endpoint to get an image by filename
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(filePath);
  });
});

// Endpoint to get an absence by ID
app.get('/absen/:id', async (req, res) => {
  try {
    const absen = await Absen.findByPk(req.params.id);
    if (absen) {
      res.json(absen);
    } else {
      res.status(404).json({ error: 'Absen not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Error handling middleware for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed!') {
    res.status(400).json({ error: err.message });
  } else {
    next(err);
  }
});

// Endpoint to register a new user
app.post('/user/register', async (req, res) => {
  try {
    const { nomor_kartu, username, password, nama } = req.body;

    // Input validation
    if (!nomor_kartu || !username || !password || !nama) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username exists
    const existingUser = await Akun.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if card exists
    let kartuRecord = await Kartu.findOne({ where: { nomor_kartu } });
    if (!kartuRecord) {
      kartuRecord = await Kartu.create({ nomor_kartu });
    }

    // Hash password with MD5
    const hashedPassword = hashPassword(password);

    // Create a new user
    const newUser = await Akun.create({
      id_kartu: kartuRecord.id_kartu,
      id_role: 1,  // Default id_role is 1, change as needed
      username,
      password: hashedPassword,
      nama
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint to delete a user
app.delete('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by id_user
    const user = await Akun.findOne({ where: { id_user: id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user
    await user.destroy();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Endpoint to update a user
app.put('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama, nomor_kartu } = req.body;

    // Find user by id_user
    const user = await Akun.findOne({ where: { id_user: id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if username exists on another user
    const existingUser = await Akun.findOne({ where: { username, id_user: { [Op.ne]: id } } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if card exists on another user
    const existingCard = await Kartu.findOne({ where: { nomor_kartu, id_kartu: { [Op.ne]: user.id_kartu } } });
    if (existingCard) {
      return res.status(400).json({ error: "Card number already exists" });
    }

    // Check if card exists, if not create new card
    let kartuRecord = await Kartu.findOne({ where: { nomor_kartu } });
    if (!kartuRecord) {
      kartuRecord = await Kartu.create({ nomor_kartu });
    }

    // Update user data
    user.username = username;
    if (password) {
      user.password = hashPassword(password); // Update password if provided
    }
    user.nama = nama;
    user.id_kartu = kartuRecord.id_kartu;

    await user.save();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start the server
app.listen(port, () => {
  console.log('Current Jakarta Time:', moment.tz('Asia/Jakarta').format());
  console.log(`Server running at http://localhost:${port}`);
});
