const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const app = express();

// Middleware to enable CORS
app.use(cors({ origin: '*' }));

// Middleware to parse incoming JSON data with increased size limit
app.use(express.json({ limit: '50mb' }));  // เพิ่มขนาด limit เป็น 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    real_time: String,
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
// app.use('/api/pencil', (req, res, next) => {
//   console.log('Received data:', req.body);
//   next();
// });

// Function to convert JSON to CSV format
function convertToCSV(jsonData) {
  if (jsonData.length === 0) return '';

  // Get all unique headers from the JSON data
  const headers = new Set();
  jsonData.forEach(row => Object.keys(row).forEach(key => headers.add(key)));
  const headerArray = Array.from(headers);

  const csvRows = [headerArray.join(',')]; // Join headers with commas

  for (const row of jsonData) {
    const values = headerArray.map(header => {
      const value = row[header];
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and handle special characters
      const escaped = ('' + value).replace(/"/g, '""').replace(/\n/g, '\\n').replace(/,/g, '\\,');
      return `"${escaped}"`; // Wrap values in quotes
    });
    csvRows.push(values.join(',')); // Join values with commas
  }

  return csvRows.join('\n'); // Join rows with new lines
}



// API endpoint to handle incoming pencil data
app.post('/api/pencil', async (req, res) => {
  const touchDataArray = req.body;

  try {
    // Check if there is data to save
    if (touchDataArray.length === 0) {
      return res.status(400).json({ error: 'No touch data to save' });
    }

    // Get the current date and time
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(currentDate.getHours()).padStart(2, '0')}-${String(currentDate.getMinutes()).padStart(2, '0')}-${String(currentDate.getSeconds()).padStart(2, '0')}`;
  console.log('Received data:', touchDataArray);
  
  // Convert the JSON data to CSV format
  const csvData = convertToCSV(touchDataArray);
  console.log('csv data:', csvData);


  // Create the file name with the date and time
  const fileName = `D:/Kra tae/IS/Data/touch_data_${formattedDate}_${formattedTime}.csv`;

  // Save the CSV data to a file
  fs.appendFile(fileName, csvData + '\n', (err) => {
    if (err) {
      console.error('Error saving CSV file:', err);
      return res.status(500).json({ error: 'Failed to save CSV file' });
    }
    console.log('CSV file saved successfully.');
});

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