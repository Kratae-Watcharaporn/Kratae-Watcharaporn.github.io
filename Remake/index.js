const $force = document.querySelector('#force');
const $touches = document.querySelector('#touches');
const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
fabricCanvas.setBackgroundImage('', fabricCanvas.renderAll.bind(fabricCanvas));

let lineCount = 1;
let user = localStorage.getItem('username');

localStorage.setItem('beforeX', 0);
localStorage.setItem('beforeY', 0);
localStorage.setItem('currentX', 0);
localStorage.setItem('currentY', 0);

let lineWidth = 0;
let isMousedown = false;
let points = [];
let timeCounter = 0;
let startTime = 0;
let totalDrawingTime = 0;

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
    return Math.sqrt(squared_distance);
}

function calculate_speed(prevX, prevY, currentX, currentY, timeElapsed) {
    const distance = euclidean_distance(prevX, prevY, currentX, currentY);
    return distance / timeElapsed;
}

function calculate_acceleration(prevSpeed, currentSpeed, timeElapsed) {
    return (currentSpeed - prevSpeed) / timeElapsed;
}

function calculate_angle(prevX, prevY, currentX, currentY) {
    return Math.atan2(currentY - prevY, currentX - prevX) * (180 / Math.PI);
}

fabricCanvas.on('mouse:down', function (e) {
    isMousedown = true;
    startTime = new Date().getTime();
    
    points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, lineWidth });

    localStorage.setItem('beforeX', localStorage.getItem('currentX'));
    localStorage.setItem('beforeY', localStorage.getItem('currentY'));
    localStorage.setItem('currentX', e.e.pageX * 2);
    localStorage.setItem('currentY', e.e.pageY * 2);

    timeCounter = new Date().getTime(); // Record time when mouse is pressed down
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

        lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;

        points.push({ x, y, lineWidth, real_time, speed: currentSpeed, acceleration, angle });

        drawOnCanvas(points);

        requestIdleCallback(() => {
            $force.textContent = 'force = ' + pressure;

            if (e.pointerType === 'pen') {
                let rotationAngle = e.rotationAngle || 0;
                let altitudeAngle = e.altitudeAngle || 0;
                let azimuthAngle = e.azimuthAngle || 0;
                console.log('Pointer parameters:', { rotationAngle, altitudeAngle, azimuthAngle });
            }
        });

        timeCounter = new Date().getTime(); // Update time after pointer move
    });
}

fabricCanvas.on('mouse:up', function (e) {
    isMousedown = false;
    totalDrawingTime = (new Date().getTime() - startTime) / 1000; // Calculate total drawing time

    requestIdleCallback(function () {
        const numTouches = points.length;
        const averageSpeed = points.reduce((sum, point) => sum + point.speed, 0) / points.length;

        strokeHistory.push([...points]);
        points = [];

        saveDataLocally(numTouches, totalDrawingTime, averageSpeed);
        resetStrokeHistory();
        lineCount++;
        timeCounter = 0;
    });
});

function drawLine(start, end) {
    const ctx = fabricCanvas.getContext();
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = end.lineWidth;
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
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

function saveDataLocally(numTouches, totalDrawingTime, averageSpeed) {
    const timestamp = Date.now();
    const dateObj = new Date(timestamp);
    const formattedTimestamp = dateObj.toISOString();

    const prevX = localStorage.getItem('beforeX');
    const prevY = localStorage.getItem('beforeY');
    const currentX = localStorage.getItem('currentX');
    const currentY = localStorage.getItem('currentY');
    const distance = euclidean_distance(prevX, prevY, currentX, currentY);
    const pressure = points.length > 0 ? points[points.length - 1].lineWidth : 0;

    const touchDataArrayWithParameters = strokeHistory.flat().map(point => ({
        ...point,
        currentPageName,
        lineCount,
        timestamp: formattedTimestamp,
        user,
        distance,
        force: pressure,
        timeCounter: timeCounter++,
        totalDrawingTime,
        averageSpeed,
    }));

    console.log('Stroke history from canvas with parameters:', touchDataArrayWithParameters);
    console.log('Number of touches:', numTouches, currentPageName, user);

    // Send the data to the server for saving
    fetch('http://localhost:3000/save-csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(touchDataArrayWithParameters),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data saved:', data);
    })
    .catch(error => {
        console.error('Error saving data:', error);
    });
}
