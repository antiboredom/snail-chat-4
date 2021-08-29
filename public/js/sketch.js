const params = new URLSearchParams(window.location.search);
const secret = params.get("secret");
const name = params.get("name");
let isSnail = false;

let socket = io.connect({ query: { secret: secret, name: name } });

socket.on("message", processMessage);
socket.on("connected", gotConnection);

let myColor;
let others = [];
let players = [];

let total = 10;
let attackLevel = 1.0;
let releaseLevel = 0.0;
let attackTime = 1.1515;
let decayTime = 5.112;
let susPercent = 0.1;
let releaseTime = 5.15;

let allowed = false;

function setup() {
  let el = document.getElementById('canvas-container');
  let elWidth = el.offsetWidth;
  let elHeight = el.offsetHeight;
  let canvas = createCanvas(elWidth, elHeight);
  canvas.parent('canvas-container');
  background(0);
  myColor = random(255);
  colorMode(HSB);
  rectMode(CENTER);

  for (let i=0; i<5; i++) {
    players.push(new Player());
  }
}

function draw() {
  background(0, 0.01);

  if (!allowed) {
    background(0);
    fill(255);
    textSize(25);
    textFont("Serif");
    textAlign(CENTER);
    text("Click or tap to start.", width / 2, height / 2);
    return;
  }

  if (isSnail && touches.length > 0) {
    const data = {
      touches: touches.map((t) => {
        return { x: t.x / width, y: t.y / height };
      }),
      c: myColor,
      fc: frameCount,
    };
    drawPoints(data);
    playInstruments(data);
    socket.emit("message", data);
  }

  for (let p of players) {
    p.update();
  }
}

function windowResized() {
  let el = document.getElementById('canvas-container');
  let elWidth = el.offsetWidth;
  let elHeight = el.offsetHeight;
  resizeCanvas(elWidth, elHeight);
}

function playInstruments(data) {
  for (let i=0; i<players.length;i++) {
    if (data.touches[i]) {
      players[i].play(data.touches[i].x, data.touches[i].y);
    } else {
      players[i].stop();
    }
  }
}

function mousePressed() {
  if (!allowed) {
    background(0);
    allowed = true;
    CsoundObj.CSOUND_AUDIO_CONTEXT.resume();
  }

  // const data = {
  //   touches: [{ x: mouseX / width, y: mouseY / height }],
  //   c: myColor,
  //   fc: frameCount,
  // };
  // drawPoints(data);
  // playInstruments(data);
  // socket.emit("message", data);
}

function drawPoints(data) {
  noStroke();
  fill(data.c, 10, 100);
  for (const t of data.touches) {
    ellipse(t.x * width, t.y * height, 25, 25);
  }

  noFill();
  stroke(data.c, 10, 100);

  beginShape();
  for (const t of data.touches) {
    vertex(t.x * width, t.y * height);
  }
  endShape();
}

function gotConnection(data) {
  isSnail = data.isSnail;
}

function processMessage(data) {
  drawPoints(data);
  playInstruments(data);
}

class Player {
  constructor() {
    this.on = false;
    this.playTime = 0;
  }

  play(x, y) {
    console.log(x, y);
    if (!this.on) {
      this.on = true;
      this.playTime = 0;
      csound.Event("i1 0 -1");
      csound.SetChannel('amp', 0.7);
    } else {
      csound.SetChannel('Y', y);
      csound.SetChannel('X', x);
    }
  }

  stop() {
    if (this.on) {
      csound.Event("i-1 0 -1");
      csound.SetChannel('X', 0.5);
      csound.SetChannel('Y', 0.5);
      this.playTime = 0;
      this.on = false;
    }
  }

  update() {
    this.playTime ++;
    if (this.playTime > 100) {
      this.stop();
    }
  }
}


function moduleDidLoad() {
  console.log("loading module");
  csound.PlayCsd("snailgrains2.csd");
}

function handleMessage(msg) {
  // console.log(msg);
}

// window.oncontextmenu = function (event) {
//   event.preventDefault();
//   event.stopPropagation();
//   return false;
// };

document.addEventListener("DOMContentLoaded", function() {
  const text = document.getElementById('more-info');
  const button = document.getElementById('read-more');

  if (button) {
    button.addEventListener('click', () => {
      text.style.display = 'block';
      button.style.display = 'none';
    });
  }
});
