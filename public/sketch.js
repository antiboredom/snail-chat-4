let socket = io.connect();

socket.on("message", processMessage);

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
      let freq = map(y, 0, height, 0, 1000);
      // let phase = map(x, 0, width, 0.0, 1.0);
      instruments.push(new Instrument(freq, x, y, size));
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

  if (touches.length > 0) {
    const data = {
      touches: touches.map((t) => {
        return { x: t.x / width, y: t.y / height };
      }),
      c: myColor,
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
        // console.log(i);
      }
    }
  }
}

// function mousePressed() {
//   //   let data = {x: mouseX, y: mouseY, color: myColor};
//   //   socket.emit("message", data);
//   //   fill(myColor, 255, 255);
//   //   rect(mouseX, mouseY, 10, 10)
// }

function mousePressed() {
  if (!allowed) {
    background(0);
    userStartAudio();
    allowed = true;
  }
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
  constructor(freq, x, y, size) {
    this.freq = freq;
    this.x = x;
    this.y = y;
    this.size = size;
    this.on = false; //random() > 0.8;

    this.env = new p5.Envelope();
    this.env.setADSR(attackTime, decayTime, susPercent, releaseTime);
    this.env.setRange(attackLevel, releaseLevel);

    this.osc = new p5.Oscillator("sine");

    this.osc.amp(this.env);
    this.osc.start();
    this.osc.freq(this.freq);
    this.playTime = 0;
  }

  play() {
    if (!this.on) {
      console.log(this.freq);
      this.on = true;
      this.env.triggerAttack();
    } else {
      this.playTime = 0;
    }
  }

  update() {
    if (this.on) {
      this.playTime += 1;

      if (this.playTime > 100) {
        this.playTime = 0;
        this.env.triggerRelease();
        this.on = false;
      }
    }
  }
}
