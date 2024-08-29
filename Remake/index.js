const $force = document.querySelector('#force');
const $touches = document.querySelector('#touches');
const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
fabricCanvas.setBackgroundImage('', fabricCanvas.renderAll.bind(fabricCanvas));
let lineCount = 1;
let rotationAngle = 0;
let altitudeAngle = 0;
let azimuthAngle = 0;
var user = localStorage.getItem('username');
localStorage.setItem('beforeX', 0);
localStorage.setItem('beforeY', 0);
localStorage.setItem('currentX', 0);
localStorage.setItem('currentY', 0);

let lineWidth = 0;
let isMousedown = false;
let points = [];

let timeCounter = 0;
let totalDrawingTime = 0;
fabricCanvas.width = window.innerWidth * 2;
fabricCanvas.height = window.innerHeight * 2;

const strokeHistory = [];
const sampleLine = [/* ใส่ตำแหน่งจุดของเส้นตัวอย่างที่นี่ */];

const requestIdleCallback = window.requestIdleCallback || function (fn) { setTimeout(fn, 1) };

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 7;

fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
const currentPageURL = window.location.href;

// Function to calculate Euclidean distance
function euclidean_distance(x1, y1, x2, y2) {
  const squared_distance = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  return Math.sqrt(squared_distance);
}

// Function to calculate speed
function calculate_speed(prevX, prevY, currentX, currentY, timeElapsed) {
  const distance = euclidean_distance(prevX, prevY, currentX, currentY);
  return distance / timeElapsed; // Speed = Distance / Time
}

// Function to calculate acceleration
function calculate_acceleration(prevSpeed, currentSpeed, timeElapsed) {
  return (currentSpeed - prevSpeed) / timeElapsed; // Acceleration = Change in Speed / Time
}

// Function to calculate angle
function calculate_angle(prevX, prevY, currentX, currentY) {
  return Math.atan2(currentY - prevY, currentX - prevX) * (180 / Math.PI); // Angle in degrees
}

// Function to calculate total drawing time
function calculate_total_drawing_time(startTime, endTime) {
  return (endTime - startTime) / 1000; // Time in seconds
}

// Function to calculate deviation from sample line
function calculate_deviation(points, sampleLine) {
  let totalDeviation = 0;
  for (let i = 0; i < points.length; i++) {
    totalDeviation += euclidean_distance(points[i].x, points[i].y, sampleLine[i].x, sampleLine[i].y);
  }
  return totalDeviation / points.length; // ค่าเฉลี่ยของความคลาดเคลื่อน
}

// Function to calculate average speed
function calculate_average_speed(points) {
  let totalSpeed = 0;
  for (let i = 0; i < points.length; i++) {
    totalSpeed += points[i].speed || 0;
  }
  return totalSpeed / points.length; // ค่าเฉลี่ยของความเร็ว
}

// Function to calculate stroke direction
function calculate_direction(prevX, prevY, currentX, currentY) {
  return Math.atan2(currentY - prevY, currentX - prevX); // ทิศทางในรูปแบบราดียน
}

let drawingStartTime = 0;

fabricCanvas.on('mouse:down', function (e) {
  isMousedown = true;
  points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, lineWidth });

  localStorage.setItem('beforeX', localStorage.getItem('currentX'));
  localStorage.setItem('beforeY', localStorage.getItem('currentY'));
  localStorage.setItem('currentX', e.e.pageX * 2);
  localStorage.setItem('currentY', e.e.pageY * 2);

  drawingStartTime = new Date().getTime();
  timeCounter = new Date().getTime();
});

for (const ev of ['pointermove', 'mousemove']) {
  fabricCanvas.upperCanvasEl.addEventListener(ev, function (e) {
    if (!isMousedown) return;
    e.preventDefault();

    let pressure = e.pressure || 1.0;
    let x = e.pageX * 2;
    let y = e.pageY * 2;
    
    let now = new Date();
    let real_time = now.toLocaleTimeString() + ':' + now.getMilliseconds();

    let timeElapsed = (new Date().getTime() - timeCounter) / 1000;
    const prevX = localStorage.getItem('beforeX');
    const prevY = localStorage.getItem('beforeY');
    const currentSpeed = calculate_speed(prevX, prevY, x, y, timeElapsed);
    const prevSpeed = points.length > 1 ? points[points.length - 2].speed : 0;
    const acceleration = calculate_acceleration(prevSpeed, currentSpeed, timeElapsed);
    const angle = calculate_angle(prevX, prevY, x, y);
    const direction = calculate_direction(prevX, prevY, x, y);

    lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;

    points.push({ x, y, lineWidth, real_time, speed: currentSpeed, acceleration, angle, direction });

    drawOnCanvas(points);

    requestIdleCallback(() => {
      $force.textContent = 'force = ' + pressure;
           
      if (e.pointerType === 'pen') {
        rotationAngle = e.rotationAngle || 0;
        altitudeAngle = e.altitudeAngle || 0;
        azimuthAngle = e.azimuthAngle || 0;

        console.log('Pointer parameters:', { rotationAngle, altitudeAngle, azimuthAngle });
      }
    });

    timeCounter = new Date().getTime();
  });
}

fabricCanvas.on('mouse:up', function (e) {
  isMousedown = false;

  requestIdleCallback(function () {
    const numTouches = points.length;
    strokeHistory.push([...points]);
    points = [];
    const drawingEndTime = new Date().getTime();
    totalDrawingTime = calculate_total_drawing_time(drawingStartTime, drawingEndTime);

    sendDataToServer(numTouches);
    resetStrokeHistory();
    lineCount++;
    timeCounter = 0;
  });
});

function drawLine(start, end) {
  fabricCanvas.getContext().beginPath();
  fabricCanvas.getContext().moveTo(start.x, start.y);
  fabricCanvas.getContext().lineTo(end.x, end.y);
  fabricCanvas.getContext().lineWidth = end.lineWidth;
  fabricCanvas.getContext().strokeStyle = 'black';
  fabricCanvas.getContext().lineCap = 'round';
  fabricCanvas.getContext().stroke();
  fabricCanvas.getContext().closePath();
}

function drawOnCanvas(points) {
  for (let i = 1; i < points.length; i++) {
    const startPoint = points[i - 1];
    const endPoint = points[i];
    drawLine(startPoint, endPoint);
  }
}

function resetStrokeHistory() {
  strokeHistory.splice(0, strokeHistory.length);
}

function sendDataToServer(numTouches) {
  const timestamp = Date.now();
  const dateObj = new Date(timestamp);
  const formattedTimestamp = dateObj.toISOString();

  const prevX = localStorage.getItem('beforeX');
  const prevY = localStorage.getItem('beforeY');
  const currentX = localStorage.getItem('currentX');
  const currentY = localStorage.getItem('currentY');
  const distance = euclidean_distance(prevX, prevY, currentX, currentY);
  const pressure = points.length > 0 ? points[points.length - 1].lineWidth : 0;

  const averageSpeed = calculate_average_speed(strokeHistory.flat());
  const totalDeviation = calculate_deviation(strokeHistory.flat(), sampleLine);
  
  const touchDataArrayWithParameters = strokeHistory.flat().map(point => ({
    ...point,
    currentPageName,
    lineCount,
    timestamp: formattedTimestamp,
    user,
    distance,
    force: pressure,
    timeCounter: timeCounter++,

    speed: point.speed,
    acceleration: point.acceleration,
    angle: point.angle,
    direction: point.direction,
  }));

  console.log("Data to server:", {
    totalDrawingTime,
    averageSpeed,
    totalDeviation,
    touchDataArrayWithParameters,
  });

  // ส่งข้อมูลไปยังเซิร์ฟเวอร์
  fetch('https://k0c9lchx-3000.asse.devtunnels.ms/api/pencil', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      totalDrawingTime,
      averageSpeed,
      totalDeviation,
      touchDataArrayWithParameters
    }),
  })
  .then(response => {
    console.log('Data sent to the server');
    timeCounter = 0;
  })
  .catch(error => {
    console.error('Error sending data to the server:', error);
  });
}
