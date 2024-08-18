const $force = document.querySelector('#force'); // Replace with the actual ID of the element
const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
fabricCanvas.setBackgroundImage('', fabricCanvas.renderAll.bind(fabricCanvas));

let lineCount = 1;
let rotationAngle = 0;
let altitudeAngle = 0;
let azimuthAngle = 0;
let lineWidth = 0;
let isMousedown = false;
let points = [];
let timeCounter = 0;
let user = localStorage.getItem('username') || 'anonymous';

fabricCanvas.width = window.innerWidth * 2;
fabricCanvas.height = window.innerHeight * 2;

const strokeHistory = [];
const requestIdleCallback = window.requestIdleCallback || function (fn) { setTimeout(fn, 1) };

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 7;

function euclidean_distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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
});

for (const ev of ['pointermove', 'mousemove', 'pointerdown', 'pointerup']) {
  fabricCanvas.upperCanvasEl.addEventListener(ev, function (e) {
    if (ev === 'pointerdown') isMousedown = true;
    if (ev === 'pointerup') isMousedown = false;
    
    if (isMousedown && (e.pointerType === 'pen' || e.pointerType === 'mouse')) {
      e.preventDefault();
      
      const pressure = e.pressure || 1.0;
      const x = e.pageX * 2;
      const y = e.pageY * 2;
      
      lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;
      points.push({
        x,
        y,
        lineWidth,
        rotationAngle: e.rotationAngle || 0,
        altitudeAngle: e.altitudeAngle || 0,
        azimuthAngle: e.azimuthAngle || 0,
        force: pressure
      });

      drawOnCanvas(points);

      requestIdleCallback(() => {
        $force.textContent = 'force = ' + pressure;
      });
    }
  });
}

fabricCanvas.on('mouse:up', function () {
  if (isMousedown) {
    strokeHistory.push([...points]);
    sendDataToServer();
    resetStrokeHistory();
    lineCount++;
    timeCounter = 0;
  }
  isMousedown = false;
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
  strokeHistory.length = 0;
}

function sendDataToServer() {
  const timestamp = new Date().toISOString();
  const touchDataArrayWithParameters = strokeHistory.flat().map(point => ({
    ...point,
    currentPageName,
    lineCount,
    timestamp,
    user,
    timeCounter: timeCounter++
  }));

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
