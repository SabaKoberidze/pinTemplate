const canvas = document.getElementById("drawingCanvas");
const mainContainer = document.getElementById("mainContainer");
const container = document.getElementById("container");
const addPinButton = document.getElementById("addPin");
const drawButton = document.getElementById("draw");
const ctx = canvas.getContext("2d");
let drawing = false;
let drawingMode = false;
let isDragging = false;
let currentPath = [];
const actions = [];
const pins = [];
ctx.strokeStyle = "red";
let isPin = false;
let scale = 1
let isZoomed = false
let pinX
let pinY
let mouseX
let mouseY
let containerX
let containerY
let deltaX
let deltaY

canvas.addEventListener("mousedown", (event) => {
    if (isPin) {
        pinX = event.offsetX
        pinY = event.offsetY
    } else {
        if (drawingMode) {
            drawing = true;
            currentPath = [{ x: event.offsetX, y: event.offsetY }];
        } else if (isZoomed) {
            isDragging = true;
            // Get initial mouse position and relative to the container's zoomed position
            startX = event.pageX;
            startY = event.pageY;
            // Store the container's current position and scaling
            containerX = container.offsetLeft;
            containerY = container.offsetTop;
            container.style.cursor = "grabbing";
        }
    }
});
canvas.addEventListener("mousemove", (event) => {
    if (drawing) {
        const x = event.offsetX;
        const y = event.offsetY;
        currentPath.push({ x, y });
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (isDragging) {
        event.preventDefault();
        const x = event.pageX;
        const y = event.pageY;
        const deltaX = (x - startX); 
        const deltaY = (y - startY);
        container.style.left = `${containerX + deltaX}px`;
        container.style.top = `${containerY + deltaY}px`;
    }
}); 



canvas.addEventListener("mouseup", (event) => {
    if(isPin){
        addNewPin(pinX, pinY);
    }else{
        container.style.cursor = "";
        isDragging = false;
    }
    drawing = false;
    actions.push({ type: "path", points: currentPath.slice(), color: ctx.strokeStyle, lineWidth: ctx.lineWidth });
    ctx.beginPath();
});

canvas.addEventListener('mouseleave', () => {
    if(isDragging){
        isDragging = false
        container.style.cursor = "";
    } 
        
})

function saveDrawing() {
    console.log(actions);
    console.log(pins); 
    renderDrawing(actions, pins); 

    fetch("/save-drawing-data", {
        method: "POST",
        body: JSON.stringify({ actions, pins }),
        headers: { "Content-Type": "application/json" },
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
}

function renderDrawing(actions, pins) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    actions.forEach(action => {
        if (action.type === "path") {
            ctx.strokeStyle = action.color;
            ctx.lineWidth = action.lineWidth;
            ctx.beginPath();
            action.points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
            ctx.closePath();
        }
    });

    pins.forEach(pin => {
        addNewPin(pin.x, pin.y)
    });
}

function addPin() {
    isPin = !isPin;
    if (isPin) {
        addPinButton.classList.add("selected");
        drawButton.classList.remove("selected");
        disablePins(true)
        drawingMode = false
    } else {
        addPinButton.classList.remove("selected");
        removeRestrictions()
    }
}

function draw() {
    drawingMode = !drawingMode
    if (drawingMode) {
        drawButton.classList.add("selected");
        addPinButton.classList.remove("selected")
        disablePins(true)
        isPin = false
    } else {
        drawButton.classList.remove("selected");
        removeRestrictions()
    }
}

function disablePins(disable) {
    const pins = document.querySelectorAll('.pin')
    pins.forEach(pin=>{
        if(disable){
            pin.classList.add("disabled")
        }else{
            pin.classList.remove("disabled")
        }
    })
}

function removeRestrictions(){
    if(!drawingMode && !isPin){
        disablePins(false)
    }
}

function addNewPin(x, y) {
    const pin = { x, y }; 
    pins.push(pin);
    const pinImage = document.createElement("div");
    pinImage.style.position = "absolute";
    pinImage.style.left = `${x}px`;
    pinImage.style.top = `${y}px`;
    pinImage.classList.add("pin");
    pinImage.style.transform = `translate(-50%, -100%) scale(${1/scale})`
    container.appendChild(pinImage);
    pinImage.classList.add("disabled")
}

container.addEventListener('wheel', (event) => {    
    event.preventDefault(); 
    const rect = container.getBoundingClientRect();
    if (!isZoomed) {
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    }
    if (event.deltaY < 0) {
        scale *= 1.1; 
    } else {
        scale /= 11;
    }
    if (scale < 1) {
        scale = 1;
        isZoomed = false;
        container.style.cursor = "";
        container.style.left = "0%";
        container.style.top = "0%";
        container.style.transform = "translate(-50%, -50%) scale(1)";
    } else {
        isZoomed = true;
    }
    if (scale > 5) scale = 5;
    const originX = (mouseX / 600) * 100; 
    const originY = (mouseY / 600) * 100; 
    container.style.transformOrigin = `${originX}% ${originY}%`;
    container.style.transform = `scale(${scale})`;
    const pins = document.querySelectorAll('.pin');
    pins.forEach(pin => {
        pin.style.transform = `translate(-50%, -100%) scale(${1 / scale})`;
    });
});