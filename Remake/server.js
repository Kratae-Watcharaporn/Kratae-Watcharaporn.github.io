const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// ตั้งค่าเส้นทางของไฟล์ CSV
const csvFilePath = path.join('D:', 'Kra tae', 'IS', 'Data', 'touch_data.csv');

// ตรวจสอบว่าไฟล์ CSV มี header หรือไม่ ถ้าไม่มีให้เขียน header ลงไป
const csvHeader = "x,y,lineWidth,real_time,speed,acceleration,angle,currentPageName,lineCount,timestamp,user,distance,force,timeCounter,totalDrawingTime,averageSpeed\n";

if (!fs.existsSync(csvFilePath)) {
    // สร้างไฟล์พร้อมกับเขียน header
    fs.writeFileSync(csvFilePath, csvHeader, 'utf8', (err) => {
        if (err) {
            console.error('Error creating CSV file:', err);
        }
    });
}

app.post('/save-csv', (req, res) => {
    const touchDataArrayWithParameters = req.body;

    // แปลงข้อมูลจาก array เป็นรูปแบบของ CSV row
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

    // เขียนข้อมูลเพิ่มเติมลงในไฟล์ CSV
    fs.appendFile(csvFilePath, csvRows + "\n", 'utf8', (err) => {
        if (err) {
            console.error('Error writing to CSV file:', err);
            return res.status(500).json({ message: 'Failed to save data' });
        }

        // ตอบกลับเพื่อยืนยันการบันทึกข้อมูลสำเร็จ
        res.status(200).json({ message: 'Data saved successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on https://k0c9lchx-3000.asse.devtunnels.ms/`);
});
