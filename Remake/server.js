const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const csvFilePath = path.join('D:\\Kra tae\\IS\\Data', 'touch_data.csv');

// CSV header
const csvHeader = "x,y,lineWidth,real_time,speed,acceleration,angle,currentPageName,lineCount,timestamp,user,distance,force,timeCounter,totalDrawingTime,averageSpeed\n";

// Ensure CSV file exists and write the header if it doesn't
if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, csvHeader);
}

app.post('/save-csv', (req, res) => {
    const touchDataArrayWithParameters = req.body;

    // Convert array of data to CSV rows
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

    // Append to CSV file
    fs.appendFile(csvFilePath, csvRows + "\n", (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
            return res.status(500).json({ message: 'Failed to save data' });
        }

        // Respond with success message
        res.status(200).json({ message: 'Data saved successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on https://k0c9lchx-3000.asse.devtunnels.ms/`);
});
