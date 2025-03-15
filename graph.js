let myChart = null;
const xMin = -50;
const xMax = 50;
const yMin = -5;
const yMax = 5;
const step = 0.2;

function switchMode() {
    const normalCalc = document.querySelector('.Calculator');
    const graphCalc = document.getElementById('graphCalc');
    
    normalCalc.classList.toggle('hidden');
    graphCalc.classList.toggle('active');
    
    // Initialize grid when switching to graph mode
    if (graphCalc.classList.contains('active')) {
        initializeGrid();
    }
}

function initializeGrid() {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const gridSize = 40;  // Size of each grid cell
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines - start from center and go both directions
    for (let x = centerX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let x = centerX - gridSize; x >= 0; x -= gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Add numbers on axes
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    
    // X-axis numbers
    ctx.textAlign = 'center';
    for (let x = -7; x <= 7; x++) {
        if (x !== 0) {
            ctx.fillText(x.toString(), centerX + (x * gridSize), centerY + 20);
        }
    }
    
    // Y-axis numbers
    ctx.textAlign = 'right';
    for (let y = -4; y <= 4; y++) {
        if (y !== 0) {
            ctx.fillText(y.toString(), centerX - 10, centerY - (y * gridSize));
        }
    }
}

function insertMath(symbol) {
    const functionField = document.getElementById('function');
    functionField.value += symbol;
}

function decodeFunction() {
    const functionField = document.getElementById('function');
    codedFunction = functionField.value;
    if(codedFunction.includes('sin')){
        codedFunction = codedFunction.replace('sin', 'Math.sin');
    } 
    if(codedFunction.includes('cos')){
        codedFunction = codedFunction.replace('cos', 'Math.cos');
    }
    if(codedFunction.includes('tan')){
        codedFunction = codedFunction.replace('tan', 'Math.tan');
    }
    if(codedFunction.includes('π')){
        codedFunction = codedFunction.replace('π', 'Math.PI');
    }
    if(codedFunction.includes('√')){
        // Find number before √ using regex
        const nthRootMatch = codedFunction.match(/(\d+)√\((.*?)\)/);
        if (nthRootMatch) {
            // nthRootMatch[1] contains the number before √
            // nthRootMatch[2] contains what's inside the parentheses
            codedFunction = codedFunction.replace(
                `${nthRootMatch[1]}√(${nthRootMatch[2]})`, 
                `Math.pow(${nthRootMatch[2]}, 1/${nthRootMatch[1]})`
            );
        } else {
            // If no number specified, assume square root
            codedFunction = codedFunction.replace('√', 'Math.sqrt');
        }
    }
    if(codedFunction.includes('^')){
        codedFunction = codedFunction.replace('^', '**');
    }
    if(codedFunction.includes('e')){
        codedFunction = codedFunction.replace('e', 'Math.E');
    }
    
    plotGraph(codedFunction);
}

function getData(mathFunction) {
    //TODO: Add support for more functions

    let data = [];
    for (let x = xMin; x <= xMax; x += step) {
        // Round to prevent floating point errors
        x = Number(x.toFixed(2));
        
        let y;
        try {
            // Create a copy of the function expression
            let expr = mathFunction.toString();
            
            // Handle negative x values
            if (x < 0) {
                expr = expr.replace(/x/g, `(${x})`);
            } else {
                expr = expr.replace(/x/g, x);
            }
            
            // Evaluate and round the result
            y = eval(expr);
            
            // Only add points if y is a valid number and within bounds
            if (!isNaN(y) && isFinite(y) && y >= yMin - 5 && y <= yMax + 5) {
                data.push({
                    x: x,
                    y: Number(y.toFixed(4))
                });
            }
        } catch (error) {
            console.warn(`Error calculating y for x=${x}: ${error.message}`);
            // Skip this point if there's an error
            continue;
        }
    }
    // Add extra points near potential discontinuities
    const extraPoints = findDiscontinuities(data);
    data = [...data, ...extraPoints];

    //sort data acc to x values
    data.sort((a, b) => a.x - b.x);

    //logging4thewin
    console.log({
        function: mathFunction,
        bounds: {
            x: { min: xMin, max: xMax },
            y: { min: yMin, max: yMax }
        },
        step: step,
        pointCount: data.length,
        discontinuities: extraPoints.length,
        data: data,
        extraPoints: extraPoints
    });

    return data;
}


// Helper function to find potential discontinuities
function findDiscontinuities(data) {
    const extraPoints = [];
    const threshold = 1; // Threshold for detecting jumps
    
    for (let i = 0; i < data.length - 1; i++) {
        const dy = Math.abs(data[i + 1].y - data[i].y);
        const dx = Math.abs(data[i + 1].x - data[i].x);
        
        // If there's a large change in y relative to x, add points in between
        if (dy > threshold && dx >= step) {
            const xMid = (data[i].x + data[i + 1].x) / 2;
            const smallerStep = step / 10;
            
            // Add several points around the potential discontinuity
            for (let x = xMid - smallerStep * 2; x <= xMid + smallerStep * 2; x += smallerStep) {
                try {
                    let expr = mathFunction.toString();
                    if (x < 0) {
                        expr = expr.replace(/x/g, `(${x})`);
                    } else {
                        expr = expr.replace(/x/g, x);
                    }
                    const y = eval(expr);
                    
                    if (!isNaN(y) && isFinite(y) && y >= yMin - 5 && y <= yMax + 5) {
                        extraPoints.push({
                            x: Number(x.toFixed(4)),
                            y: Number(y.toFixed(4))
                        });
                    }
                } catch (error) {
                    continue;
                }
            }
        }
    }
    
    return extraPoints;
}


function plotGraph(mathFunction, xMin = -10, xMax = 10, yMin = -5, yMax = 5) {
    // Get the canvas element
    const ctx = document.getElementById("graphCanvas").getContext('2d');
    
    // get data-points from math function
    const dataPoints = getData(mathFunction);
    
    
    // Create the chart
    const chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Sample Function',
          data: dataPoints,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointRadius: 3,
          showLine: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            position: 'center',
            min: xMin,
            max: xMax,
            grid: {
              color: 'rgba(200, 200, 200, 0.3)'
            },
            title: {
              display: true,
              text: 'X Axis'
            }
          },
          y: {
            type: 'linear',
            position: 'center',
            min: yMin,
            max: yMax,
            grid: {
              color: 'rgba(200, 200, 200, 0.3)'
            },
            title: {
              display: true,
              text: 'Y Axis'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Dual Axis Chart'
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
              }
            }
          }
        }
      }
    });
    
    // return chart; idek if i needed that ever
  }