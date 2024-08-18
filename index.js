const $force = document.querySelector('#force');
const $touches = document.querySelector('#touches');
const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
let lineCount = 1;
let isMousedown = false;
let points = [];

fabricCanvas.width = window.innerWidth * 2;
fabricCanvas.height = window.innerHeight * 2;

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 7;

const strokeHistory = [];
let timeCounter = 0;
fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;

function drawOnCanvas(points) {
  for (let i = 1; i < points.length; i++) {
    const startPoint = points[i - 1];
    const endPoint = points[i];
    drawLine(startPoint, endPoint);
  }
}

fabricCanvas.on('mouse:down', function (e) {
  isMousedown = true;
  points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, force: 1.0 });
});

fabricCanvas.on('touch:gesture', function (e) {
  isMousedown = true;
  const touch = e.e.touches[0];
  points.push({
    x: touch.pageX * 2,
    y: touch.pageY * 2,
    force: touch.force || 1.0,
    rotationAngle: touch.rotationAngle || 0,
    altitudeAngle: touch.altitudeAngle || 0,
    azimuthAngle: touch.azimuthAngle || 0,
    currentPageName: currentPageName,
    timestamp: Date.now()
  });
});

fabricCanvas.on('mouse:move', function (e) {
  if (!isMousedown) return;

  const x = e.e.pageX * 2;
  const y = e.e.pageY * 2;

  points.push({
    x: x,
    y: y,
    force: 1.0,
    currentPageName: currentPageName,
    timestamp: Date.now()
  });

  drawOnCanvas(points);
});

fabricCanvas.on('touch:drag', function (e) {
  if (!isMousedown) return;
  const touch = e.e.touches[0];
  points.push({
    x: touch.pageX * 2,
    y: touch.pageY * 2,
    force: touch.force || 1.0,
    rotationAngle: touch.rotationAngle || 0,
    altitudeAngle: touch.altitudeAngle || 0,
    azimuthAngle: touch.azimuthAngle || 0,
    currentPageName: currentPageName,
    timestamp: Date.now()
  });

  drawOnCanvas(points);
});

fabricCanvas.on('mouse:up', function () {
  isMousedown = false;
  strokeHistory.push([...points]);
  points = [];
  lineCount++;
  sendDataToServer();
});

function drawLine(start, end) {
  fabricCanvas.getContext().beginPath();
  fabricCanvas.getContext().moveTo(start.x, start.y);
  fabricCanvas.getContext().lineTo(end.x, end.y);
  fabricCanvas.getContext().lineWidth = end.force * 10;
  fabricCanvas.getContext().strokeStyle = 'black';
  fabricCanvas.getContext().lineCap = 'round';
  fabricCanvas.getContext().stroke();
  fabricCanvas.getContext().closePath();
}

function sendDataToServer() {
  fetch('https://k0c9lchx-3000.asse.devtunnels.ms/api/pencil', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(strokeHistory),
  })
  .then((response) => {
    console.log('Data sent to the server');
    timeCounter = 0;
  })
  .catch((error) => {
    console.error('Error sending data to the server:', error);
  });
}
