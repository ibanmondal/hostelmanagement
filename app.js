const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/hostelDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Student model
const Student = require('./db');

// Route: Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Route: Add student (generic)
app.post('/add-student', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.send('✅ Student added!');
  } catch (err) {
    res.status(500).send('❌ Error adding student');
  }
});

// Route: View all students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).send('❌ Error fetching students');
  }
});

// Route: Search students
app.get('/search-students', async (req, res) => {
  const query = req.query.q;
  try {
    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(students);
  } catch (err) {
    res.status(500).send('❌ Error searching students');
  }
});

// Route: Check room availability (1–100)
app.get('/available-rooms', async (req, res) => {
  try {
    const assignedRooms = await Student.find({}, 'roomNumber');
    const used = new Set(assignedRooms.map(s => s.roomNumber));
    const allRooms = Array.from({ length: 100 }, (_, i) => i + 1);
    const available = allRooms.filter(r => !used.has(r.toString()));
    res.json(available);
  } catch (err) {
    res.status(500).send('❌ Error fetching room availability');
  }
});

// Route: Auto assign rooms (non-gender-specific fallback)
app.post('/auto-assign-rooms', async (req, res) => {
  try {
    const unassignedStudents = await Student.find({ roomNumber: { $exists: false } });

    if (unassignedStudents.length === 0) {
      return res.send('✅ All students already have rooms assigned');
    }

    const assignedRooms = new Set((await Student.find({}, 'roomNumber')).map(s => s.roomNumber));
    let room = 1;

    for (let student of unassignedStudents) {
      while (assignedRooms.has(room.toString())) {
        room++;
        if (room > 100) break;
      }

      if (room > 100) break;

      await Student.findByIdAndUpdate(student._id, { roomNumber: room.toString() });
      assignedRooms.add(room.toString());
      room++;
    }

    res.send('✅ Auto-assigned rooms to unassigned students');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error auto-assigning rooms');
  }
});

// Route: Gender-based room assignment
app.post('/assign-room', async (req, res) => {
  try {
    const { gender } = req.body;

    if (!gender || (gender !== "Male" && gender !== "Female")) {
      return res.status(400).send('❌ Invalid gender');
    }

    const student = new Student(req.body);

    // Gender-based room ranges
    const roomRange = gender === "Male"
      ? { start: 1, end: 50 }
      : { start: 51, end: 100 };

    // Get already assigned room numbers for that gender
    const assignedRooms = new Set(
      (await Student.find({ gender }, 'roomNumber')).map(s => s.roomNumber)
    );

    let room = roomRange.start;

    // Find the first unassigned room in range
    while (assignedRooms.has(room.toString()) && room <= roomRange.end) {
      room++;
    }

    if (room > roomRange.end) {
      return res.status(400).send(`❌ No ${gender} rooms available`);
    }

    student.roomNumber = room.toString();
    await student.save();

    res.send(`✅ ${gender} student added and assigned Room ${room}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Failed to assign room');
  }
});

// Route: Warden info (used in chatbot)
app.get('/warden-info', (req, res) => {
  res.json({
    name: "Mr. NAHEEM KHAN",
    email: "warden@hkbk.edu",
    contact: "+91 9876543210"
  });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
