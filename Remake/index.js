const $force = document.querySelector('#force'); // Replace with the actual ID of the element
const $touches = document.querySelector('#touches'); // Replace with the actual ID of the element
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

fabricCanvas.on('mouse:down', function (e) {
  isMousedown = true;
  points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, lineWidth });

  localStorage.setItem('beforeX', localStorage.getItem('currentX'));
  localStorage.setItem('beforeY', localStorage.getItem('currentY'));
  localStorage.setItem('currentX', e.e.pageX * 2);
  localStorage.setItem('currentY', e.e.pageY * 2);
});

for (const ev of ['pointermove', 'mousemove']) {
  fabricCanvas.upperCanvasEl.addEventListener(ev, function (e) {
    if (!isMousedown) return;
    e.preventDefault();

    let pressure = e.pressure || 1.0;
    let x = e.pageX * 2;
    let y = e.pageY * 2;

    lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;
    points.push({ x, y, lineWidth });
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
  });
}

fabricCanvas.on('mouse:up', function (e) {
  isMousedown = false;

  requestIdleCallback(function () {
    const numTouches = points.length;
    strokeHistory.push([...points]);
    points = [];
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
  console.log('Point:', points);
  const pressure = points.length > 0 ? points[points.length - 1].lineWidth : 1;

  const touchDataArrayWithParameters = strokeHistory.flat().map(point => ({
    ...point,
    rotationAngle,
    altitudeAngle,
    azimuthAngle,
    currentPageName,
    lineCount,
    timestamp: formattedTimestamp,
    user,
    distance,
    force: pressure,
    timeCounter: timeCounter++,
  }));

  console.log('Stroke history from canvas with parameters:', touchDataArrayWithParameters);
  console.log('Number of touches:', numTouches, currentPageName, user);

  fetch('https://k0c9lchx-3000.asse.devtunnels.ms/api/pencil', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(touchDataArrayWithParameters),
  })
    .then((response) => {
      console.log('Data sent to the server');
      timeCounter = 0;
    })
    .catch((error) => {
      console.error('Error sending data to the server:', error);
    });
}