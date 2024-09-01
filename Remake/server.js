const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Path for the CSV file
const csvFilePath = path.join('D:', 'Kra tae', 'IS', 'Data', 'touch_data.csv');

// Header for CSV file
const csvHeader = "x,y,lineWidth,real_time,speed,acceleration,angle,currentPageName,lineCount,timestamp,user,distance,force,timeCounter,totalDrawingTime,averageSpeed\n";

// Create the CSV file if it does not exist
if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, csvHeader, 'utf8', (err) => {
        if (err) {
            console.error('Error creating CSV file:', err);
        }
    });
}

app.post('/save-csv', (req, res) => {
    const touchDataArrayWithParameters = req.body;

    if (!Array.isArray(touchDataArrayWithParameters) || touchDataArrayWithParameters.length === 0) {
        return res.status(400).json({ message: 'Invalid data format' });
    }

    // Convert data to CSV rows
    const csvRows = touchDataArrayWithParameters.map(point => [
        point.x,
        point.y,
        point.lineWidth,
        point.real_time,
        point.speed,
        point.acceleration,
        point.angle,
        point.currentPageName,
        point.lineCount,
        point.timestamp,
        point.user,
        point.distance,
        point.force,
        point.timeCounter,
        point.totalDrawingTime,
        point.averageSpeed
    ].join(",")).join("\n");

    // Append data to the CSV file
    fs.appendFile(csvFilePath, csvRows + "\n", 'utf8', (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
            return res.status(500).json({ message: 'Failed to save data' });
        }

        res.status(200).json({ message: 'Data saved successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on https://k0c9lchx-3000.asse.devtunnels.ms/`);
});
