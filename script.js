

let wordBank = [];
let score = 0;
let totalQuestions = 0;
let totalTimer = 0;
let totalTimerInterval = null;
let currentAnswers = [];
let questionLimit = Infinity;
let records = [];

async function loadWordBank() {
    try {
        const response = await fetch("mid.json");
        if (!response.ok) throw new Error("檔案載入失敗");
        wordBank = await response.json();
        if (wordBank.length === 0) {
            alert("題庫為空，請確認檔案內容！");
        }
        resetQuizState();
    } catch (error) {
        alert("無法載入預設題庫，請確認 mid.json 是否存在！");
    }
}

document.getElementById("upload-database").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const uploadedData = JSON.parse(reader.result);
                if (Array.isArray(uploadedData) && uploadedData.every(item => "question" in item && "choices" in item && "answer" in item)) {
                    wordBank = uploadedData.map(item => ({ ...item, seen: false }));
                    alert("題庫上傳成功！");
                } else {
                    alert("上傳的檔案格式不正確！");
                }
            } catch (error) {
                alert("無法解析上傳的檔案，請確保格式正確！");
            }
        };
        reader.readAsText(file);
    } else {
        alert("未選擇檔案，將載入預設題庫。");
        loadWordBank();
    }
});

document.getElementById("start-quiz").addEventListener("click", () => {
    const questionInput = document.getElementById("question-limit");
    const inputLimit = questionInput.value ? parseInt(questionInput.value, 10) : wordBank.length;
    if (isNaN(inputLimit) || inputLimit <= 0 || inputLimit > wordBank.length) {
        alert(`請輸入有效的題數（最多 ${wordBank.length} 題）！`);
        return;
    }
    questionLimit = inputLimit;
    showPage("quiz");
    startQuizMultipleChoice();
});

document.getElementById("back-to-home").addEventListener("click", () => {
    resetQuizState();
    showPage("home");
});

document.getElementById("view-records-home").addEventListener("click", () => {
    showPage("record");
    renderRecords();
});

document.getElementById("view-words-home").addEventListener("click", () => {
    showPage("word-bank");
    renderWordBank();
});

document.getElementById("back-to-home-from-word-bank").addEventListener("click", () => showPage("home"));
document.getElementById("back-to-home-from-record").addEventListener("click", () => showPage("home"));

document.addEventListener("DOMContentLoaded", () => {
    loadWordBank();
});

function showPage(page) {
    document.getElementById("home-page").style.display = page === "home" ? "block" : "none";
    document.getElementById("quiz-page").style.display = page === "quiz" ? "block" : "none";
    document.getElementById("record-page").style.display = page === "record" ? "block" : "none";
    document.getElementById("word-bank-page").style.display = page === "word-bank" ? "block" : "none";
    if (page === "quiz") startTotalTimer();
    else stopTotalTimer();
}

function startTotalTimer() {
    totalTimer = 0;
    document.getElementById("total-timer").innerText = `總計時: 0 秒`;
    totalTimerInterval = setInterval(() => {
        totalTimer++;
        document.getElementById("total-timer").innerText = `總計時: ${totalTimer} 秒`;
    }, 1000);
}

function stopTotalTimer() {
    clearInterval(totalTimerInterval);
    totalTimerInterval = null;
}

function startQuizMultipleChoice() {
    const content = document.getElementById("content");
    content.innerHTML = "";

    const remaining = wordBank.filter(q => !q.seen);
    if (remaining.length === 0 || totalQuestions >= questionLimit) {
        showQuizEnd(content);
        return;
    }

    const selected = remaining[Math.floor(Math.random() * remaining.length)];
    const question = document.createElement("h2");
    question.innerText = selected.question;

    const optionsContainer = document.createElement("div");
    optionsContainer.id = "options-container";

    selected.choices.forEach(choice => {
        const button = document.createElement("button");
        button.className = "choice-btn";
        button.innerText = choice;
        button.addEventListener("click", () => handleChoice(selected, choice));
        optionsContainer.appendChild(button);
    });

    const scoreboard = document.createElement("div");
    scoreboard.id = "scoreboard";
    updateScoreboard(scoreboard);

    content.appendChild(scoreboard);
    content.appendChild(question);
    content.appendChild(optionsContainer);
}

function handleChoice(questionItem, userAnswer) {
    const result = document.createElement("div");
    result.id = "result";

    const isCorrect = userAnswer === questionItem.answer;
    result.innerText = isCorrect ? "✅ 正確！" : `❌ 錯誤！正確答案是: ${questionItem.answer}`;

    currentAnswers.push({
        question: questionItem.question,
        userAnswer,
        correctAnswer: questionItem.answer,
        isCorrect
    });

    if (isCorrect) score++;
    totalQuestions++;
    questionItem.seen = true;

    updateScoreboard();
    document.getElementById("content").appendChild(result);
    setTimeout(() => startQuizMultipleChoice(), 1000);
}

function updateScoreboard(scoreboardElement = document.getElementById("scoreboard")) {
    if (scoreboardElement) {
        scoreboardElement.innerHTML = `已完成: ${totalQuestions} / ${questionLimit === Infinity ? wordBank.length : questionLimit}`;
    }
}

function resetQuizState() {
    wordBank.forEach(q => q.seen = false);
    score = 0;
    totalQuestions = 0;
    currentAnswers = [];
    stopTotalTimer();
}

function showQuizEnd(content) {
    stopTotalTimer();
    records.push({
        score,
        totalQuestions,
        totalTime: totalTimer,
        answers: currentAnswers.slice()
    });
    content.innerHTML = `
        <h2>測驗結束！</h2>
        <p>得分: ${score} / ${totalQuestions}</p>
        <p>總計時: ${totalTimer} 秒</p>
        <button id="restart-quiz">重新測驗</button>
    `;
    document.getElementById("restart-quiz").addEventListener("click", resetQuiz);
}

function resetQuiz() {
    resetQuizState();
    showPage("quiz");
    startQuizMultipleChoice();
}

function renderRecords() {
    const content = document.getElementById("record-content");
    content.innerHTML = "<h2>測驗紀錄</h2>";

    records.forEach((record, i) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>#${i + 1}</strong> 得分: ${record.score}/${record.totalQuestions}，時間: ${record.totalTime} 秒</p>
            <button onclick="showRecordDetail(${i})">查看詳情</button>
        `;
        content.appendChild(div);
    });
}

function showRecordDetail(index) {
    const record = records[index];
    const content = document.getElementById("record-content");
    content.innerHTML = `<h2>詳情 #${index + 1}</h2><button onclick="renderRecords()">返回紀錄列表</button>`;

    record.answers.forEach((ans, i) => {
        const item = document.createElement("div");
        item.innerHTML = `
            <p>第 ${i + 1} 題：${ans.question}<br>
            你的答案：${ans.userAnswer}<br>
            正確答案：${ans.correctAnswer}<br>
            ${ans.isCorrect ? "✅" : "❌"}</p>
        `;
        content.appendChild(item);
    });
}

function renderWordBank() {
    const content = document.getElementById("word-bank-content");
    content.innerHTML = "<h2>題庫內容</h2>";

    wordBank.forEach((item, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>#${index + 1}</strong> 題目：${item.question}<br>
            選項：${item.choices.join("，")}<br>
            正解：${item.answer}</p>
        `;
        content.appendChild(div);
    });
}
