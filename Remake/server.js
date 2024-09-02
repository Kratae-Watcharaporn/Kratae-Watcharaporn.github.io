const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware to enable CORS
app.use(cors({ origin: '*' }));

// Middleware to parse incoming JSON data
app.use(express.json());

// Connect to MongoDB
mongoose.connect(
  'mongodb+srv://Watcharaporn:Only24042538@coding.6t7m44z.mongodb.net/DrawPencil?retryWrites=true&w=majority&appName=Coding',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false, // Disable buffering
  }
);

// Define the schema and model for the Touchev collection
const touchevSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    lineWidth: Number,
    rotationAngle: Number,
    altitudeAngle: Number,
    azimuthAngle: Number,
    currentPageName: String,
    lineCount: Number,
    timestamp: String,
    user: String,
    distance: Number,
    force: Number, // Add the force property
    timeCounter: Number,
    speed: Number,        // Add speed property
    acceleration: Number, // Add acceleration property
    angle: Number         // Add angle property
  },
  { collection: 'information' }
);

const Touchev = mongoose.model('Touchev', touchevSchema, 'information');

// Middleware to log incoming data for debugging purposes
app.use('/api/pencil', (req, res, next) => {
  console.log('Received data:', req.body);
  next();
});

// API endpoint to handle incoming pencil data
app.post('/api/pencil', async (req, res) => {
  const touchDataArray = req.body;

  try {
    // Check if there is data to save
    if (touchDataArray.length === 0) {
      return res.status(400).json({ error: 'No touch data to save' });
    }

    // Save data to MongoDB
    await Touchev.insertMany(touchDataArray);

    return res.status(200).json({ message: 'Touchev data saved successfully' });
  } catch (err) {
    console.error('Error saving touchev data to database:', err);
    return res.status(500).json({ error: 'Failed to save touchev data' });
  }
});

// Start the server on port 3000 and listen on all network interfaces
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
