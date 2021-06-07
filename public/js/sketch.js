const params = new URLSearchParams(window.location.search);
const secret = params.get("secret");
const name = params.get("name");
let isSnail = false;

let socket = io.connect({ query: { secret: secret, name: name } });

socket.on("message", processMessage);
socket.on("connected", gotConnection);

// let touches = [];
let myColor;
let others = [];
let instruments = [];

let total = 10;
let attackLevel = 1.0;
let releaseLevel = 0.0;
let attackTime = 1.1515;
let decayTime = 5.112;
let susPercent = 0.1;
let releaseTime = 5.15;

let allowed = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  myColor = random(255);
  colorMode(HSB);
  rectMode(CENTER);

  size = width / total;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      instruments.push(new Instrument(x, y, size));
    }
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

  for (let i of instruments) {
    i.update();
  }
}

function playInstruments(data) {
  for (let i of instruments) {
    for (let t of data.touches) {
      if (dist(t.x * width, t.y * height, i.x, i.y) <= i.size / 2) {
        i.play();
      }
    }
  }
}

function mousePressed() {
  if (!allowed) {
    background(0);
    userStartAudio();
    allowed = true;
    CsoundObj.CSOUND_AUDIO_CONTEXT.resume();
  }

  const data = {
    touches: [{ x: mouseX / width, y: mouseY / height }],
    c: myColor,
    fc: frameCount,
  };
  drawPoints(data);
  playInstruments(data);
  socket.emit("message", data);
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
  navigator.vibrate(3000);

  for (const t1 of data.touches) {
    for (const t2 of touches) {
      if (dist(t1.x, t1.y, t2.x, t2.y) < 30) {
        navigator.vibrate(200);
      }
    }
  }
}

class Instrument {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.on = false; //random() > 0.8;
    this.playTime = 0;
  }

  play() {
    if (!this.on) {
      this.on = true;
      csound.SetChannel("Y", this.y / height);
      csound.SetChannel("X", this.x / width);
      csound.Event("i1 0 -1");
      csound.SetChannel("amp", 0.7);
    } else {
      this.playTime = 0;
    }
  }

  update() {
    if (this.on) {
      this.playTime += 1;

      if (this.playTime > 100) {
        this.playTime = 0;
        this.on = false;
        csound.Event("i-1 0 -1");
        csound.SetChannel("X", 0.5);
        csound.SetChannel("Y", 0.5);
      }
    }
  }
}

window.oncontextmenu = function (event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

function moduleDidLoad() {
  console.log("loading module");
  csound.PlayCsd("snailgrains1.csd");
}

function handleMessage(msg) {
  console.log(msg);
}
