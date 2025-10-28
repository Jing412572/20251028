let questionTable;
let allQuestions = [];
let quizQuestions = []; // 儲存本次測驗的3個題目
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'START'; // 遊戲狀態: START, QUESTION, FEEDBACK, RESULT

// 按鈕物件
let answerButtons = [];
let startButton, restartButton;

// 互動效果
let particles = [];      // 同時存放背景粒子與特效粒子（以 life 判定類型）
let feedbackMessage = '';
let feedbackColor;
let feedbackTimer = 0;
let stars = []; // 新增：星星陣列

// 用於顯示答題時選擇與正確答案
let lastSelected = null;
let lastCorrect = null;

function preload() {
  // 載入 CSV 檔案，指定 'csv' 格式並使用 header（如果你的 questions.csv 有標頭）
  questionTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  processData();
  setupButtons();
  setupParticles();
  startGame();
  textFont('Arial');
}

function draw() {
  // 動態漸層背景 + 星塵
  drawBackground();
  drawParticles();

  // 根據不同的遊戲狀態繪製不同畫面
  switch (gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'QUESTION':
      drawQuestionScreen();
      break;
    case 'FEEDBACK':
      drawFeedbackScreen();
      break;
    case 'RESULT':
      drawResultScreen();
      break;
  }
}

// ---------------------------------
// 遊戲流程函數
// ---------------------------------

// 1. 處理CSV資料
function processData() {
  allQuestions = []; // clear to avoid重複
  if (!questionTable) return;
  // 使用欄位名稱讀取（欄位範例： id,question,A,B,C,D,answer,feedback ）
  for (let row of questionTable.getRows()) {
    allQuestions.push({
      question: row.get('question'),
      opA: row.get('A'),
      opB: row.get('B'),
      opC: row.get('C'),
      opD: row.get('D'),
      correct: row.get('answer') ? row.get('answer').trim().toUpperCase() : ''
    });
  }
}

// 2. 設定按鈕位置
function setupButtons() {
  // 重置按鈕陣列避免重複加入
  answerButtons = [];

  // 按鈕寬度以畫面為基準，置中顯示（單欄）
  let btnW = min(width * 0.7, 800);
  let btnH = min(90, height * 0.12);
  let gap = min(20, height * 0.03);

  // 開始按鈕改為較小的圓形（深藍色）
  let startR = min(80, floor(min(width, height) * 0.08)); // 縮小半徑
  startButton = {
    cx: width / 2,
    cy: height / 2 + 50,
    r: startR,
    shape: 'circle',
    text: '開始測驗',
    fillColor: color(10, 35, 90),      // 深藍（預設）
    hoverColor: color(30, 70, 160)     // 深藍 hover
  };

  // 重新開始按鈕保持矩形（也可指定顏色）`
  restartButton = {
    x: width / 2 - 120,
    y: height / 2 + 150,
    w: 240,
    h: 64,
    text: '重新開始',
    fillColor: color(50, 100, 200),
    hoverColor: color(100, 180, 255)
  };

  // 四個答案按鈕改為置中（垂直堆疊）
  let centerX = width / 2 - btnW / 2;
  let topY = max(160, height * 0.35);

  answerButtons.push({ x: centerX, y: topY, w: btnW, h: btnH, option: 'A', text: '' });
  answerButtons.push({ x: centerX, y: topY + (btnH + gap), w: btnW, h: btnH, option: 'B', text: '' });
  answerButtons.push({ x: centerX, y: topY + 2 * (btnH + gap), w: btnW, h: btnH, option: 'C', text: '' });
  answerButtons.push({ x: centerX, y: topY + 3 * (btnH + gap), w: btnW, h: btnH, option: 'D', text: '' });
}

// 3. 開始或重新開始遊戲
function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  lastSelected = null;
  lastCorrect = null;
  // 隨機排序所有問題，並取出前3題
  quizQuestions = shuffle(allQuestions).slice(0, 3);
  gameState = 'START';
}

// 4. 檢查答案
function checkAnswer(selectedOption) {
  let correctOption = quizQuestions[currentQuestionIndex].correct;
  lastSelected = selectedOption;
  lastCorrect = correctOption;

  // 找出被按的按鈕中心位置作為粒子特效發生點
  let centerX = width / 2;
  let centerY = height / 2;
  for (let btn of answerButtons) {
    if (btn.option === selectedOption) {
      centerX = btn.x + btn.w / 2;
      centerY = btn.y + btn.h / 2;
      break;
    }
  }

  if (selectedOption === correctOption) {
    score++;
    feedbackMessage = '答對了！';
    feedbackColor = color(0, 200, 100, 220); // 綠色
    spawnBurst(centerX, centerY, color(80, 220, 120));
  } else {
    feedbackMessage = `答錯了... 正確答案是 ${correctOption}`;
    feedbackColor = color(200, 50, 50, 220); // 紅色
    spawnBurst(centerX, centerY, color(240, 120, 120));
  }

  gameState = 'FEEDBACK';
  feedbackTimer = 90; // 顯示回饋 1.5 秒 (60fps * 1.5)
}

// 5. 進入下一題
function nextQuestion() {
  currentQuestionIndex++;
  lastSelected = null;
  lastCorrect = null;
  if (currentQuestionIndex >= quizQuestions.length) {
    gameState = 'RESULT';
  } else {
    gameState = 'QUESTION';
  }
}

// 6. 取得回饋用語
function getFeedbackText() {
  if (score === quizQuestions.length) return '太棒了，全部答對！';
  if (score >= Math.ceil(quizQuestions.length / 2)) return '不錯喔，再接再厲！';
  return '別灰心，再試一次吧！';
}

// ---------------------------------
// 畫面繪製函數
// ---------------------------------

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  // 標題：黑色並加粗
  textSize(48);
  textStyle(BOLD);
  fill(0); // 黑色
  text('p5.js 題庫測驗', width / 2, height / 2 - 100);

  // 恢復文字樣式並將副標設為黑色
  textStyle(NORMAL);
  fill(0); // 副標黑色
  textSize(24);
  text(`從 ${allQuestions.length} 題中隨機抽取 ${quizQuestions.length} 題`, width / 2, height / 2 - 30);
  
  // 繪製開始按鈕
  drawButton(startButton);
}

function drawQuestionScreen() {
  if (quizQuestions.length === 0) return; // 防止資料還沒載入

  let q = quizQuestions[currentQuestionIndex];

  // 將題目置中並改為黑色
  textAlign(CENTER, TOP);
  fill(0); // 黑色
  textSize(28);
  text(`第 ${currentQuestionIndex + 1} 題 / ${quizQuestions.length} 題`, width / 2, 40);

  textSize(32);
  // 置中並限制寬度（左右各保留80px），黑色題目文字
  fill(0);
  text(q.question, width / 2, 100, width - 160, 200);

  // 更新並繪製答案按鈕（單欄置中）
  answerButtons[0].text = 'A. ' + q.opA;
  answerButtons[1].text = 'B. ' + q.opB;
  answerButtons[2].text = 'C. ' + q.opC;
  answerButtons[3].text = 'D. ' + q.opD;

  for (let btn of answerButtons) {
    drawButton(btn);
  }
}

function drawFeedbackScreen() {
  // 顯示回饋文字及高亮答案按鈕（不使用全螢幕純色遮罩，保留星空與粒子）
  // 輕微半透明遮罩
  push();
  noStroke();
  fill(0, 0, 0, 140);
  rect(0, 0, width, height);
  pop();

  // 顯示題目（置中）
  let q = quizQuestions[currentQuestionIndex];
  textAlign(CENTER, TOP);
  fill(255);
  textSize(28);
  text(q.question, width / 2, 90, width - 160, 200);

  // 繪製按鈕並高亮正確/錯誤
  for (let btn of answerButtons) {
    push();
    // 背景顏色預設
    let bg = color(60, 110, 200, 220);
    // 若為正確答案，綠色；若為所選錯誤，紅色
    if (btn.option === lastCorrect) {
      bg = color(30, 190, 100, 240);
    } else if (btn.option === lastSelected && lastSelected !== lastCorrect) {
      bg = color(200, 60, 60, 240);
    }
    // draw rect
    fill(bg);
    stroke(255, 220);
    strokeWeight(1.5);
    rect(btn.x, btn.y, btn.w, btn.h, 10);
    // 文字
    fill(255);
    noStroke();
    textSize(20);
    textAlign(CENTER, CENTER);
    text(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    pop();
  }

  // 大字回饋訊息
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text(feedbackMessage, width / 2, height * 0.78);

  // 計時
  feedbackTimer--;
  if (feedbackTimer <= 0) {
    nextQuestion();
  }
}

function drawResultScreen() {
  textAlign(CENTER, CENTER);

  // 計算百分比（防除以零）
  let total = max(quizQuestions.length, 1);
  let pct = Math.round((score / total) * 100);

  // 標題
  fill(255);
  textSize(50);
  text('測驗結束！', width / 2, 120);

  // 分數
  textSize(28);
  fill(255);
  text(`得分: ${score} / ${total}`, width / 2, 190);

  // 百分比（大字、根據成績改變顏色）
  textSize(72);
  if (pct >= 80) fill(80, 220, 120);      // 優良綠
  else if (pct >= 50) fill(255, 200, 80); // 中等黃
  else fill(240, 100, 100);               // 待加強紅
  text(`${pct}%`, width / 2, 280);

  // 回饋用語（黑色）
  textSize(24);
  fill(0);
  text(getFeedbackText(), width / 2, 360);

  // 繪製重新開始按鈕
  drawButton(restartButton);

  // 依成績產生慶祝粒子
  if (frameCount % 10 === 0 && pct >= 60) {
    spawnBurst(random(width * 0.3, width * 0.7), random(height * 0.2, height * 0.6), color(255, 200, 80));
  }
}

// ---------------------------------
// 互動與輔助函數
// ---------------------------------

// 繪製按鈕 (含 hover 效果) - 支援圓形與矩形
function drawButton(btn) {
  let isHover = isMouseOver(btn) && (gameState === 'START' || gameState === 'QUESTION' || gameState === 'RESULT');

  push(); // 保存繪圖狀態
  // 若按鈕有自訂顏色屬性則使用，否則使用預設
  let baseFill = btn.fillColor || color(50, 100, 200, 200);
  let hoverFill = btn.hoverColor || color(100, 180, 255);

  if (btn.shape === 'circle') {
    // 圓形按鈕繪製（使用自訂深藍色）`
    if (isHover) {
      fill(hoverFill);
      stroke(255);
      strokeWeight(2);
      cursor(HAND);
    } else {
      fill(baseFill);
      noStroke();
      cursor(ARROW);
    }
    ellipse(btn.cx, btn.cy, btn.r * 2, btn.r * 2);

    // 文字（白色）
    fill(255);
    textSize(max(14, btn.r * 0.35));
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(btn.text, btn.cx, btn.cy);
    textStyle(NORMAL);
  } else {
    // 矩形按鈕（原本行為，但支援自訂顏色）`
    if (isHover) {
      fill(hoverFill);
      stroke(255);
      strokeWeight(2);
      cursor(HAND); // 改變滑鼠游標
    } else {
      fill(baseFill);
      noStroke();
      cursor(ARROW);
    }
    rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形

    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    // 使用中心座標繪字
    text(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
  pop(); // 恢復繪圖狀態
}

// 檢查滑鼠是否在按鈕上（支援圓形與矩形）
function isMouseOver(btn) {
  if (btn.shape === 'circle') {
    let d = dist(mouseX, mouseY, btn.cx, btn.cy);
    return d <= btn.r;
  } else {
    return (mouseX > btn.x && mouseX < btn.x + btn.w &&
            mouseY > btn.y && mouseY < btn.y + btn.h);
  }
}

// 滑鼠點擊事件
function mousePressed() {
  // 重設游標
  cursor(ARROW);

  if (gameState === 'START') {
    if (isMouseOver(startButton)) {
      gameState = 'QUESTION';
    }
  } else if (gameState === 'QUESTION') {
    for (let btn of answerButtons) {
      if (isMouseOver(btn)) {
        checkAnswer(btn.option);
        break; // 點擊後就停止檢查
      }
    }
  } else if (gameState === 'RESULT') {
    if (isMouseOver(restartButton)) {
      startGame();
    }
  }
}

// ---------------------------------
// 互動視覺效果 (背景粒子 & 特效)
// ---------------------------------

function setupParticles() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.3, 0.3),
      vy: random(-0.3, 0.3),
      r: random(1.5, 4),
      alpha: random(30, 110),
      life: undefined, // 長期背景粒子沒有 life
      col: color(255, 255, 255, 200)
    });
  }

  // 產生星星（背景用）
  stars = [];
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.8), // 上方為主要星空區域
      r: random(0.6, 2.8),
      twinkle: random(0.6, 1.6),
      phase: random(TWO_PI),
      drift: random(-0.02, 0.02)
    });
  }
}

function drawParticles() {
  // 先繪製星星
  push();
  noStroke();
  for (let s of stars) {
    let a = map(sin(frameCount * 0.05 * s.twinkle + s.phase), -1, 1, 80, 220);
    fill(200, 220, 255, a * 0.95);
    ellipse(s.x, s.y, s.r);
    // light halo occasionally
    if (random() < 0.01) {
      fill(170, 200, 255, a * 0.12);
      ellipse(s.x + random(-2,2), s.y + random(-2,2), s.r * 3);
    }
    s.x += s.drift;
    if (s.x < 0) s.x = width;
    if (s.x > width) s.x = 0;
  }
  pop();

  // 更新並繪製所有粒子（包含特效）
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    // 若有 life（代表特效），則遞減並使用 col
    if (p.life !== undefined) {
      p.life--;
      let a = map(p.life, 0, p.maxLife, 0, p.initAlpha);
      fill(red(p.col), green(p.col), blue(p.col), a);
      noStroke();
      ellipse(p.x, p.y, p.r);
      if (p.life <= 0) particles.splice(i, 1);
    } else {
      // 背景粒子（恆常）
      fill(255, p.alpha);
      noStroke();
      ellipse(p.x, p.y, p.r);
      // 邊界環繞
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    }
  }
}

// 產生粒子爆發（於按鈕中心）
function spawnBurst(x, y, col) {
  let count = 40;
  for (let i = 0; i < count; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 6);
    let vx = cos(angle) * speed;
    let vy = sin(angle) * speed;
    particles.push({
      x: x + random(-6,6),
      y: y + random(-6,6),
      vx: vx,
      vy: vy,
      r: random(3, 8),
      life: int(random(30, 80)),
      maxLife: 80,
      initAlpha: random(150, 255),
      col: col
    });
  }
}

// ---------------------------------
// 背景繪製（深藍漸層 + 星星 + 細格）
// ---------------------------------

function drawBackground() {
  // 淺藍色動態漸層 + 星星（適合淺藍基底）
  let t = millis() * 0.0005;
  // 上方淺藍與下方較深但依然是淺藍調
  let topCol = color(200 + 10 * sin(t), 230 + 8 * cos(t * 1.1), 255);
  let bottomCol = color(160 + 12 * cos(t + 1.2), 200 + 6 * sin(t * 0.8), 240 + 6 * cos(t * 1.3));

  noFill();
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    stroke(lerpColor(topCol, bottomCol, inter));
    line(0, y, width, y);
  }

  // 中央柔和光暈（淺藍）
  push();
  noStroke();
  let glowCol = color(220, 240, 255, 18);
  for (let r = 0; r < 300; r += 30) {
    fill(red(glowCol), green(glowCol), blue(glowCol), map(r, 0, 300, 28, 0));
    ellipse(width / 2, height * 0.33, r + 200, r + 100);
  }
  pop();

  // 星星（顏色調為冷白偏藍，與淺藍背景和諧）
  push();
  noStroke();
  for (let s of stars) {
    let a = map(sin(frameCount * 0.05 * s.twinkle + s.phase), -1, 1, 60, 200);
    fill(230, 240, 255, a * 0.9);
    ellipse(s.x, s.y, s.r);
    if (random() < 0.01) {
      fill(220, 235, 255, a * 0.12);
      ellipse(s.x + random(-2, 2), s.y + random(-2, 2), s.r * 3);
    }
    s.x += s.drift;
    if (s.x < 0) s.x = width;
    if (s.x > width) s.x = 0;
  }
  pop();

  // 很淡的網格（淺藍色調）
  push();
  stroke(190, 210, 230, 10);
  strokeWeight(1);
  let gx = (frameCount * 0.04) % 120;
  let gy = (frameCount * 0.03) % 120;
  for (let x = -120 + gx; x < width; x += 120) line(x, 0, x, height);
  for (let y = -120 + gy; y < height; y += 120) line(0, y, width, y);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setupButtons();
  // 重新產生背景粒子以符合新畫面
  particles = [];
  setupParticles();
}