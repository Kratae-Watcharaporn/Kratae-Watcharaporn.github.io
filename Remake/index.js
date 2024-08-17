const $force = document.querySelector('#force'); // Replace with the actual ID of the element
const $touches = document.querySelector('#touches'); // Replace with the actual ID of the element
const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
fabricCanvas.setBackgroundImage('', fabricCanvas.renderAll.bind(fabricCanvas));
let lineCount = 1; // Initialize the line count
let rotationAngle = 0;
let altitudeAngle = 0;
let azimuthAngle =  0;
var user = localStorage.getItem('username');
localStorage.setItem('beforeX', 0);
localStorage.setItem('beforeY', 0);
localStorage.setItem('currentX', 0);
localStorage.setItem('currentY', 0);

console.log('user:', user );
let lineWidth = 0 ;
let isMousedown = false;
let points = [];

let timeCounter = 0;    // Initialize the timeCounter
fabricCanvas.width = window.innerWidth * 2;
fabricCanvas.height = window.innerHeight * 2;

const strokeHistory = [];

const requestIdleCallback = window.requestIdleCallback || function (fn) { setTimeout(fn, 1) };

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 7;

fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
const currentPageURL = window.location.href;
function euclidean_distance(x1, y1, x2, y2) {
  const squared_distance = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const distance = Math.sqrt(squared_distance);
  return distance;
}

function drawOnCanvas(points) {
  for (let i = 1; i < points.length; i++) {
    const startPoint = points[i - 1];
    const endPoint = points[i];
    drawLine(startPoint, endPoint);
  }
}

fabricCanvas.on('touch:start', function (e) {
  console.log('Touch start event triggered');
  isMousedown = true;
  const touch = e.e.touches[0];
  points.push({ x: touch.pageX * 2, y: touch.pageY * 2, lineWidth });

  // Update localStorage values
  localStorage.setItem('beforeX', localStorage.getItem('currentX'));
  localStorage.setItem('beforeY', localStorage.getItem('currentY'));
  localStorage.setItem('currentX', touch.pageX * 2);
  localStorage.setItem('currentY', touch.pageY * 2);
});

fabricCanvas.on('touch:gesture', function (e) {
  isMousedown = true;
  const touch = e.e.touches[0];
  points.push({ x: touch.pageX * 2, y: touch.pageY * 2 , lineWidth});
});

for (const ev of ['touchmove']) {
  canvas.addEventListener(ev, function (e) {
    if (!isMousedown) return;
    e.preventDefault();

    let pressure = 0.1;
    let x, y;

    if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
      if (e.touches[0]["force"] > 0) {
        pressure = e.touches[0]["force"];
      }
      x = e.touches[0].pageX * 2;
      y = e.touches[0].pageY * 2;
    } else {
      pressure = 1.0;
      x = e.pageX * 2;
      y = e.pageY * 2;
    }

    // smoothen line width
    lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;
    points.push({ x, y , lineWidth});
    drawOnCanvas(points);

    requestIdleCallback(() => {
      $force.textContent = 'force = ' + pressure;

      const touch = e.touches[0];
      if (touch) {
        console.log('Touch parameters:', {
          rotationAngle: touch.rotationAngle,
          altitudeAngle: touch.altitudeAngle,
          azimuthAngle: touch.azimuthAngle,
        });
      } else {
        console.log('No touch parameters available.');
      }
    });
  });
}

fabricCanvas.on('touch:drag', function (e) {
  if (!isMousedown) return;
  e.preventDefault();

  let pressure = 0.1;
  let x, y;
  if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
    if (e.touches[0]["force"] > 0) {
      pressure = e.touches[0]["force"];
    }
    x = e.touches[0].pageX * 2;
    y = e.touches[0].pageY * 2;
  } else {
    pressure = 1.0;
    x = e.pageX * 2;
    y = e.pageY * 2;
  }

  // smoothen line width
  lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;
  points.push({ x, y , lineWidth });

  drawOnCanvas(points);

  requestIdleCallback(() => {
    $force.textContent = 'force = ' + pressure;

    const touch = e.touches ? e.touches[0] : null;
    if (touch) {
      $touches.innerHTML = `
        rotationAngle = ${touch.rotationAngle} <br/>
        altitudeAngle = ${touch.altitudeAngle} <br/>
        azimuthAngle = ${touch.azimuthAngle} <br/>
      `;
    }
  });
});

fabricCanvas.on('touch:end', function (e) {
  isMousedown = false;

  requestIdleCallback(function () {
    const numTouches = points.length; // Count the number of touches
    strokeHistory.push([...points]); // Add the current touch data array to the strokeHistory
    points = [];
    sendDataToServer(numTouches); // Call the sendDataToServer function with the number of touches
    resetStrokeHistory(); // Reset the stroke history after sending data
    lineCount++; // Increment the line count
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

// Function to reset the stroke history array
function resetStrokeHistory() {
  strokeHistory.splice(0, strokeHistory.length);
}

function sendDataToServer(numTouches) {
  const timestamp = Date.now();
  const dateObj = new Date(timestamp);
  const formattedTimestamp = dateObj.toISOString();

  // Calculate Euclidean distance using the most recent coordinates
  const prevX = localStorage.getItem('beforeX');
  const prevY = localStorage.getItem('beforeY');
  const currentX = localStorage.getItem('currentX');
  const currentY = localStorage.getItem('currentY');
  const distance = euclidean_distance(prevX, prevY, currentX, currentY);
  const pressure = points.length > 0 ? points[points.length - 1].lineWidth : 0;

  const touchDataArrayWithParameters = strokeHistory.flat().map(point => ({
    ...point,
    rotationAngle: rotationAngle || 0,
    altitudeAngle: altitudeAngle || 0,
    azimuthAngle: azimuthAngle || 0,
    currentPageName: currentPageName,
    lineCount: lineCount,
    timestamp: formattedTimestamp,
    user: user,
    distance: distance || 0, // Include the Euclidean distance
    force: pressure, // Include the force value
    timeCounter: timeCounter++  ,    // Initialize the timeCounter
  }));
  
  console.log('Stroke history from canvas with parameters:', touchDataArrayWithParameters);
  console.log('Number of touches:', numTouches, currentPageName, user);
  
  // Replace the URL with the server endpoint where you want to send the data
  fetch('https://k0c9lchx-3000.asse.devtunnels.ms/api/pencil', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(touchDataArrayWithParameters), // Send the entire stroke history with parameters to the server
  })
  
    .then((response) => {
      console.log('Data sent to the server');
      timeCounter = 0;
    })
    .catch((error) => {
      console.error('Error sending data to the server:', error);
    });
}
