const connection = new signalR.HubConnectionBuilder()
    .withUrl("/telemetry")
    .withAutomaticReconnect()
    .build();

const debug = document.getElementById('debug');
function dbg(s){
  debug.textContent = s + "\n" + debug.textContent;
  if(debug.textContent.length>8000) debug.textContent = debug.textContent.slice(0,8000);
}
const BLINK_AZ_THRESHOLD = 0;
// DOM elements
const valTime = document.getElementById('val_time');
const valSeq  = document.getElementById('val_seq');
const valAx   = document.getElementById('val_ax');
const valAy   = document.getElementById('val_ay');
const valAz   = document.getElementById('val_az');
const valPitch= document.getElementById('val_pitch');
const valRoll = document.getElementById('val_roll');
const valYaw  = document.getElementById('val_yaw');


// Visualization DOM elements (top-level)
const pitchViz = document.getElementById('pitchViz');
const yawViz = document.getElementById('yawViz');
const rollViz = document.getElementById('rollViz');
const pitchValue = document.getElementById('pitchValue');
const yawValue = document.getElementById('yawValue');
const rollValue = document.getElementById('rollValue');

// Draw default orientation figures (0 deg) on page load
window.addEventListener('DOMContentLoaded', () => {
  if (pitchViz) drawRocket(pitchViz.getContext('2d'), 0);
  if (yawViz) drawRocket(yawViz.getContext('2d'), 0);
  if (rollViz) drawRoll(rollViz.getContext('2d'), 0);
  if (pitchValue) pitchValue.textContent = '0.00 °';
  if (yawValue) yawValue.textContent = '0.00 °';
  if (rollValue) rollValue.textContent = '0.00 °';
});

function drawRocket(ctx, angleDeg) {
  // Draw a simple rocket shape centered and rotated by angleDeg
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(angleDeg * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, -40); // nose
  ctx.lineTo(12, 20); // right body
  ctx.lineTo(6, 20); // right fin top
  ctx.lineTo(18, 40); // right fin tip
  ctx.lineTo(0, 28); // bottom
  ctx.lineTo(-18, 40); // left fin tip
  ctx.lineTo(-6, 20); // left fin top
  ctx.lineTo(-12, 20); // left body
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRoll(ctx, angleDeg) {
  // Draw a circle with a line indicating roll angle
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, 2*Math.PI);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Draw roll indicator line
  ctx.save();
  ctx.rotate(angleDeg * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -32);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  // Draw 3 small lines for reference
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * 120) * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -40);
    ctx.strokeStyle = '#fff8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function updateOrientationVisuals(pitch, yaw, roll) {
  if (pitchViz && typeof pitch === 'number' && !isNaN(pitch)) drawRocket(pitchViz.getContext('2d'), pitch);
  if (yawViz && typeof yaw === 'number' && !isNaN(yaw)) drawRocket(yawViz.getContext('2d'), yaw);
  if (rollViz && typeof roll === 'number' && !isNaN(roll)) drawRoll(rollViz.getContext('2d'), roll);
  if (pitchValue && typeof pitch === 'number' && !isNaN(pitch)) pitchValue.textContent = pitch.toFixed(2) + ' °';
  if (yawValue && typeof yaw === 'number' && !isNaN(yaw)) yawValue.textContent = yaw.toFixed(2) + ' °';
  if (rollValue && typeof roll === 'number' && !isNaN(roll)) rollValue.textContent = roll.toFixed(2) + ' °';
}
const valTemp = document.getElementById('val_temp');
const valVel  = document.getElementById('val_vel');
const valPress= document.getElementById('val_press');
const valLat  = document.getElementById('val_lat');
const valLon  = document.getElementById('val_lon');
const valAlt  = document.getElementById('val_alt');

// === BLINK VARS ===
let blinkActive = false;
let blinkInterval = null;

function startBlinking(){
  if (!blinkActive){
    blinkActive = true;
    document.body.classList.add("blink-red");
  }
}
function stopBlinking(){
  if (blinkActive){
    blinkActive = false;
    document.body.classList.remove("blink-red");
  }
}

// charts
let velChart, altChart, accChart, orientChart, tempChart, pressChart;
function createCharts(){
  
// velocity chart
const ctx1 = document.getElementById('velChart').getContext('2d');
velChart = new Chart(ctx1, {
  type: 'line',
  data: {
    labels: [], // fylles med sekunder
    datasets: [
      { 
        label:'Velocity (m/s)', 
        data:[], 
        borderColor:'goldenrod', 
        borderWidth: 2,
        fill:false, 
        yAxisID:'y_vel', 
        pointRadius:1 
      }
    ]
  },
  options: { 
    animation:false, 
    responsive:false, 
    maintainAspectRatio: true, 
    scales:{ 
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y_vel:{
        title:{ display:true, text:'Velocity (m/s)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});

// altitude chart
const ctx2 = document.getElementById('altChart').getContext('2d');
altChart = new Chart(ctx2, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { 
        label:'Altitude (m)', 
        data:[], 
        borderColor:'Magenta', 
        fill:false, 
        yAxisID:'y_alt', 
        pointRadius:1 
      }
    ]
  },
  options: { 
    animation:false, 
    responsive:false, 
    maintainAspectRatio: true, 
    scales:{ 
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y_alt:{
        title:{ display:true, text:'Altitude (m)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});


// temperature chart
const ctxTemp = document.getElementById('tempChart').getContext('2d');
tempChart = new Chart(ctxTemp, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label:'Temperature (\u00B0C)', data:[], borderColor:'brown', fill:false, pointRadius:1 }
    ]
  },
  options: {
    animation:false,
    responsive:false,
    maintainAspectRatio: true,
    scales: {
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y: {
        title:{ display:true, text:'Temp (\u00B0C)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});

// pressure chart
const ctxPress = document.getElementById('pressChart').getContext('2d');
pressChart = new Chart(ctxPress, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label:'Pressure: ', data:[], borderColor:'gray', fill:false, pointRadius:1 }
    ]
  },
  options: {
    animation:false,
    responsive:false,
    maintainAspectRatio: true,
    scales: {
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y: {
        title:{ display:true, text:'Pressure (atm)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});

// acceleration chart
const ctx4 = document.getElementById('accChart').getContext('2d');
accChart = new Chart(ctx4, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'ax', data: [], borderColor:'red', fill:false, pointRadius:1 },
      { label: 'ay', data: [], borderColor:'green', fill:false, pointRadius:1 },
      { label: 'az', data: [], borderColor:'blue', fill:false, pointRadius:1 }
    ]
  },
  options: { 
    animation:false, 
    responsive:false, 
    maintainAspectRatio: true, 
    scales:{ 
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y: {
        title:{ display:true, text:'Acceleration (g)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});

// orientation chart
const ctx5 = document.getElementById('orientChart').getContext('2d');
orientChart = new Chart(ctx5, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label:'Pitch', data:[], borderColor:'orange', fill:false, pointRadius:1 },
      { label:'Roll',  data:[], borderColor:'purple', fill:false, pointRadius:1 },
      { label:'Yaw',   data:[], borderColor:'teal', fill:false, pointRadius:1 }
    ]
  },
  options: { 
    animation:false, 
    responsive:false, 
    maintainAspectRatio: true,
    scales:{
      x:{ 
        display:true, 
        min: 0,
        title:{ display:true, text:'Time (s)', font:{ size:20 }, color:'#fff' },
        ticks: { font: { size: 14 }, color:'#fff', callback: function(value, index) {
        const label = this.getLabelForValue(index);
        if (!label) return '';
          return parseFloat(label); 
        }
      }
      },
      y: {
        title:{ display:true, text:'Orientation (°)', font:{ size:20 }, color:'#fff' },
        ticks:{ font:{ size:14 }, color:'#fff' }
      }
    },
    plugins:{ legend:{ labels:{ font:{ size:20 } } } }
  }
});
}

function updateLatest(tMs, seq, ax, ay, az, pitch, roll, yaw, temp, vel, press, lat, lon, alt) {
  const timeStr = (Number(tMs)/1000).toFixed(3) + " s";
  valTime.textContent = timeStr;
  // Update timer value at top
  const timerValue = document.getElementById('timerValue');
  if (timerValue) timerValue.textContent = timeStr;
  valSeq.textContent = seq ?? '-';
  valAx.textContent = (ax !== undefined ? Number(ax).toFixed(3) : '-');
  valAy.textContent = (ay !== undefined ? Number(ay).toFixed(3) : '-');
  valAz.textContent = (az !== undefined ? Number(az).toFixed(3) : '-');
  valPitch.textContent = (pitch !== undefined ? Number(pitch).toFixed(2) : '-');
  valRoll.textContent = (roll !== undefined ? Number(roll).toFixed(2) : '-');
  valYaw.textContent = (yaw !== undefined ? Number(yaw).toFixed(2) : '-');
  valTemp.textContent = (temp !== undefined ? Number(temp).toFixed(2) : '-');
  valVel.textContent = (vel !== undefined ? Number(vel).toFixed(2) : '-');
  valPress.textContent = (press !== undefined ? Number(press).toFixed(1) : '-');
  valLat.textContent = (lat !== undefined ? (Number(lat)/1e6).toFixed(6) : '-');
  valLon.textContent = (lon !== undefined ? (Number(lon)/1e6).toFixed(6) : '-');
  valAlt.textContent = (alt !== undefined ? Number(alt).toFixed(0) : '-');

  // Update chart labels with live data
  if (velChart && velChart.data && velChart.data.datasets[0]) {
    velChart.data.datasets[0].label = `Velocity: ${vel !== undefined ? Number(vel).toFixed(2) : '-'} m/s`;
  }
  if (altChart && altChart.data && altChart.data.datasets[0]) {
    altChart.data.datasets[0].label = `Altitude: ${alt !== undefined ? Number(alt).toFixed(0) : '-'} m`;
  }
  if (accChart && accChart.data && accChart.data.datasets[0]) {
    accChart.data.datasets[0].label = `ax (g)`;
    accChart.data.datasets[1].label = `ay (g)`;
    accChart.data.datasets[2].label = `az (g)`;
  }
  if (orientChart && orientChart.data && orientChart.data.datasets[0]) {
    orientChart.data.datasets[0].label = `Pitch (°)`;
    orientChart.data.datasets[1].label = `Roll (°)`;
    orientChart.data.datasets[2].label = `Yaw (°)`;
  }
  if (tempChart && tempChart.data && tempChart.data.datasets[0]) {
    tempChart.data.datasets[0].label = `Temperature: ${temp !== undefined ? Number(temp).toFixed(2) : '-'} °C`;
  }
  if (pressChart && pressChart.data && pressChart.data.datasets[0]) {
    pressChart.data.datasets[0].label = `Pressure: ${press !== undefined ? Number(press).toFixed(3) : '-'} atm`;
  }
  // Update orientation visualizations
  updateOrientationVisuals(pitch, yaw, roll);
  // Update 3D model orientation
  if (typeof setRocket3DRotation === 'function') {
    setRocket3DRotation(pitch, yaw, roll);
  }
  // Update 3D rocket orientation if available
  if (typeof setRocket3DRotation === 'function') {
    setRocket3DRotation(pitch, yaw, roll);
  }
}

function pushToCharts(ax, ay, az, pitch, roll, yaw, temp, vel, press, alt) {
  const maxPoints = 100000000;
  const tLabel = valTime.textContent || '';  // bruk tid fra mikrokontrolleren

  // velocity
  velChart.data.labels.push(tLabel);
  velChart.data.datasets[0].data.push(vel);
  if (velChart.data.labels.length > maxPoints) { 
    velChart.data.labels.shift(); 
    velChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  velChart.update('none');

  // altitude
  altChart.data.labels.push(tLabel);
  altChart.data.datasets[0].data.push(alt);
  if (altChart.data.labels.length > maxPoints) { 
    altChart.data.labels.shift(); 
    altChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  altChart.update('none');

  // acceleration
  accChart.data.labels.push(tLabel);
  accChart.data.datasets[0].data.push(ax);
  accChart.data.datasets[1].data.push(ay);
  accChart.data.datasets[2].data.push(az);

  if (accChart.data.labels.length > maxPoints) { 
    accChart.data.labels.shift(); 
    accChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  accChart.update('none');

  // orientation
  orientChart.data.labels.push(tLabel);
  orientChart.data.datasets[0].data.push(pitch);
  orientChart.data.datasets[1].data.push(roll);
  orientChart.data.datasets[2].data.push(yaw);
  if (orientChart.data.labels.length > maxPoints) { 
    orientChart.data.labels.shift(); 
    orientChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  orientChart.update('none');

  // temperature
  tempChart.data.labels.push(tLabel);
  tempChart.data.datasets[0].data.push(temp);
  if (tempChart.data.labels.length > maxPoints) { 
    tempChart.data.labels.shift(); 
    tempChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  tempChart.update('none');

  // pressure
  pressChart.data.labels.push(tLabel);
  pressChart.data.datasets[0].data.push(press);
  if (pressChart.data.labels.length > maxPoints) { 
    pressChart.data.labels.shift(); 
    pressChart.data.datasets.forEach(ds => ds.data.shift()); 
  }
  pressChart.update('none');
}

// SignalR handler
connection.on("telemetry", (payload) => {
  try {
    if (payload.type === 'telemetry') {
      const t = Number(payload.t);
      const seq = Number(payload.seq);
      const ax = Number(payload.ax);
      const ay = Number(payload.ay);
      const az = Number(payload.az);
      const pitch = Number(payload.pitch);
      const roll = Number(payload.roll);
      const yaw = Number(payload.yaw);
      const temp = Number(payload.temp);
      const vel = Number(payload.vel);
      const press = Number(payload.press);
      const lat = Number(payload.lat);
      const lon = Number(payload.lon);
      const alt = Number(payload.alt);

      updateLatest(t, seq, ax, ay, az, pitch, roll, yaw, temp, vel, press, lat, lon, alt);
      pushToCharts(ax, ay, az, pitch, roll, yaw, temp, vel, press, alt);

      // 🚀 Constant blink logic
      if (Number(payload.az) <= BLINK_AZ_THRESHOLD) {
        document.body.classList.add("blink-red");
      } else {
        document.body.classList.remove("blink-red");
      }

      const dashboardTitle = document.querySelector('h1');
      if (Number(payload.az) <= BLINK_AZ_THRESHOLD) {
        document.body.classList.add("blink-red");
        if (dashboardTitle) dashboardTitle.textContent = "WARNING: Altitude dropping";
      } else {
        document.body.classList.remove("blink-red");
        if (dashboardTitle) dashboardTitle.textContent = "";
      }

    } else {
      dbg("RAW: " + JSON.stringify(payload));
    }
  } catch (e) {
    dbg("Error parsing payload: " + e);
  }
});

async function start(){
  createCharts();
  // Initialize 3D rocket model after DOM and three.js are ready
  if (typeof initRocket3D === 'function') {
    initRocket3D();
  } else {
    // If not yet loaded, try again shortly
    setTimeout(() => { if (typeof initRocket3D === 'function') initRocket3D(); }, 500);
  }
  try {
    await connection.start();
    dbg("Connected to SignalR hub");
  } catch (err) {
    dbg("SignalR start failed: " + err);
    setTimeout(start, 2000);
  }
}
start();