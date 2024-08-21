const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

mongoose.connect(
  'mongodb+srv://Watcharaporn:Only24042538@coding.6t7m44z.mongodb.net/DrawPencil?retryWrites=true&w=majority&appName=Coding',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false, // Disable buffering
  }
);

const touchevSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    lineWidth: Number,
    tiltX: Number,  // Replaced rotationAngle
    tiltY: Number,  // Replaced altitudeAngle
    velocity: Number, // Added velocity
    path: [Object], // Added path (array of objects to store points)
    currentPageName: String,
    lineCount: Number,
    timestamp: String,
    user: String,
    distance: Number,
    force: Number,
    timeCounter: Number,
  },
  { collection: 'information' }
);

const Touchev = mongoose.model('Touchev', touchevSchema, 'information');

app.post('/api/pencil', async (req, res) => {
  const touchDataArray = req.body;

  try {
    if (touchDataArray.length === 0) {
      return res.status(400).json({ error: 'No touch data to save' });
    }

    await Touchev.insertMany(touchDataArray);

    return res.status(200).json({ message: 'Touchev data saved successfully' });
  } catch (err) {
    console.error('Error saving touchev data to database:', err);
    return res.status(500).json({ error: 'Failed to save touchev data' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
