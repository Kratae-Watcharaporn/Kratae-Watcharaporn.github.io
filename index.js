const fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: false });
const currentPageName = window.location.pathname.split('/').pop();
let points = [];
let isDrawing = false;

fabricCanvas.width = window.innerWidth * 2;
fabricCanvas.height = window.innerHeight * 2;

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 7;

function drawOnCanvas(points) {
    const ctx = fabricCanvas.getContext();
    ctx.beginPath();
    for (let i = 1; i < points.length; i++) {
        const start = points[i - 1];
        const end = points[i];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }
    ctx.lineWidth = points[points.length - 1].force * 10;
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
}

fabricCanvas.on('mouse:down', function (e) {
    isDrawing = true;
    points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, force: 1.0 });
});

fabricCanvas.on('mouse:move', function (e) {
    if (!isDrawing) return;
    points.push({ x: e.e.pageX * 2, y: e.e.pageY * 2, force: 1.0 });
    drawOnCanvas(points);
});

fabricCanvas.on('mouse:up', function () {
    isDrawing = false;
    points = [];
});

fabricCanvas.on('touch:gesture', function (e) {
    e.preventDefault();
    const touch = e.e.touches[0];
    points.push({
        x: touch.pageX * 2,
        y: touch.pageY * 2,
        force: touch.force || 1.0,
        rotationAngle: touch.rotationAngle || 0,
        altitudeAngle: touch.altitudeAngle || 0,
        azimuthAngle: touch.azimuthAngle || 0,
        currentPageName: currentPageName
    });
    drawOnCanvas(points);
});

fabricCanvas.on('touch:drag', function (e) {
    e.preventDefault();
    const touch = e.e.touches[0];
    points.push({
        x: touch.pageX * 2,
        y: touch.pageY * 2,
        force: touch.force || 1.0,
        rotationAngle: touch.rotationAngle || 0,
        altitudeAngle: touch.altitudeAngle || 0,
        azimuthAngle: touch.azimuthAngle || 0,
        currentPageName: currentPageName
    });
    drawOnCanvas(points);
});

// Use pointer events to capture the Apple Pencil's specific data
fabricCanvas.getElement().addEventListener('pointerdown', function(e) {
    if (e.pointerType === 'pen') {
        isDrawing = true;
        points.push({
            x: e.pageX * 2,
            y: e.pageY * 2,
            force: e.pressure,
            rotationAngle: e.rotationAngle || 0,
            altitudeAngle: e.altitudeAngle || 0,
            azimuthAngle: e.azimuthAngle || 0,
            currentPageName: currentPageName
        });
    }
});

fabricCanvas.getElement().addEventListener('pointermove', function(e) {
    if (isDrawing && e.pointerType === 'pen') {
        points.push({
            x: e.pageX * 2,
            y: e.pageY * 2,
            force: e.pressure,
            rotationAngle: e.rotationAngle || 0,
            altitudeAngle: e.altitudeAngle || 0,
            azimuthAngle: e.azimuthAngle || 0,
            currentPageName: currentPageName
        });
        drawOnCanvas(points);
    }
});

fabricCanvas.getElement().addEventListener('pointerup', function(e) {
    if (e.pointerType === 'pen') {
        isDrawing = false;
        points = [];
    }
});
