document.addEventListener("DOMContentLoaded", () => {
    // --- Timer Constants & Variables ---
    const WORK_MINUTES = 25;
    const BREAK_MINUTES = 5;
    let timeLeft = WORK_MINUTES * 60;
    let isWorking = true;
    let timerInterval = null;
    let isRunning = false;

    // --- DOM Elements: Timer ---
    const elTimeDisplay = document.getElementById('time-display');
    const btnWork = document.getElementById('btn-work');
    const btnBreak = document.getElementById('btn-break');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const circle = document.getElementById('progress-ring');
    const timerSection = document.querySelector('.timer-section');

    // SVG Progress Calculation
    // r=135 => circumference = 2 * PI * 135
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = 0;

    function setProgress(percent) {
        // SVG offset: 0 means full, circumference means empty
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    // --- Timer Logic ---
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        elTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        let totalTime = isWorking ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
        let percent = (timeLeft / totalTime) * 100;
        setProgress(percent);
    }

    function switchMode(mode) {
        pauseTimer();
        isWorking = mode === 'work';
        timeLeft = (isWorking ? WORK_MINUTES : BREAK_MINUTES) * 60;

        // UI Updates
        btnWork.classList.toggle('active', isWorking);
        btnBreak.classList.toggle('active', !isWorking);
        document.body.classList.toggle('mode-break', !isWorking);

        updateDisplay();
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        btnStart.classList.add('hidden');
        btnPause.classList.remove('hidden');
        timerSection.classList.add('timer-running');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();

            // When time's up
            if (timeLeft <= 0) {
                pauseTimer(); // Stop interval
                fireConfetti(); // 達成感の演出
                // Switch modes automatically after a short delay
                setTimeout(() => {
                    switchMode(isWorking ? 'break' : 'work');
                    updateDisplay();
                }, 2000); // 2秒後に自動切り替え
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(timerInterval);
        btnPause.classList.add('hidden');
        btnStart.classList.remove('hidden');
        timerSection.classList.remove('timer-running');
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = (isWorking ? WORK_MINUTES : BREAK_MINUTES) * 60;
        updateDisplay();
    }

    // Timer Event Listeners
    btnWork.addEventListener('click', () => { if (!isWorking) switchMode('work'); });
    btnBreak.addEventListener('click', () => { if (isWorking) switchMode('break'); });
    btnStart.addEventListener('click', startTimer);
    btnPause.addEventListener('click', pauseTimer);
    btnReset.addEventListener('click', resetTimer);

    // Initial Display
    updateDisplay();

    // --- Task List Logic ---
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskListElement = document.getElementById('task-list');
    const statsText = document.getElementById('task-stats');

    // 状態管理用配列
    let tasks = [];

    // Local Storageから読み込み
    const savedTasks = localStorage.getItem('pomodoro_tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
        updateStats();
    }

    function addTask(text) {
        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };
        tasks.push(newTask);
        saveTasks();

        // DOMに新規追加
        const li = createTaskElement(newTask);
        taskListElement.appendChild(li); // 一番下に追加
        // Smooth scroll to bottom
        taskListElement.scrollTop = taskListElement.scrollHeight;
    }

    function toggleTask(id) {
        const index = tasks.findIndex(t => t.id === id);
        if (index > -1) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks();

            // DOMのクラス切り替え
            const li = document.getElementById(`task-${id}`);
            if (li) {
                if (tasks[index].completed) {
                    li.classList.add('completed');
                    // 完了時に紙吹雪
                    fireMiniConfetti(li.getBoundingClientRect());
                } else {
                    li.classList.remove('completed');
                }
            }
        }
    }

    function deleteTask(id, liElement) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();

        // Fade out animation
        liElement.style.transform = 'scale(0.8)';
        liElement.style.opacity = '0';
        setTimeout(() => {
            liElement.remove();
        }, 300); // matches CSS transition
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.id = `task-${task.id}`;

        li.innerHTML = `
            <label class="task-checkbox-container">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn"><i class='bx bx-trash'></i></button>
        `;

        // Event Listeners for DOM elements
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

        return li;
    }

    function renderTasks() {
        taskListElement.innerHTML = '';
        tasks.forEach(task => {
            taskListElement.appendChild(createTaskElement(task));
        });
        updateStats();
    }

    function updateStats() {
        const completedCount = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        statsText.textContent = `${completedCount}/${total}`;
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = ''; //クリア
        }
    });


    // --- Confetti Animation (Canvas 2D) ---
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let confettis = [];
    let animationId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function createParticle(x, y, isMini = false) {
        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (isMini ? 10 : 20),
            vy: (Math.random() - 1) * (isMini ? 15 : 25) - 5,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10
        };
    }

    function fireConfetti() {
        // 中央下から吹き出す
        const originX = canvas.width / 2;
        const originY = canvas.height;
        for (let i = 0; i < 150; i++) {
            confettis.push(createParticle(originX, originY));
        }
        if (!animationId) loopStyleConfetti();
    }

    function fireMiniConfetti(rect) {
        // タスクのチェックボックス付近から小規模に吹き出す
        const x = rect.left + 20;
        const y = rect.top + 20;
        for (let i = 0; i < 30; i++) {
            confettis.push(createParticle(x, y, true));
        }
        if (!animationId) loopStyleConfetti();
    }

    function loopStyleConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeConfettis = false;

        for (let i = 0; i < confettis.length; i++) {
            let p = confettis[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            p.rot += p.rotSpeed;

            if (p.y < canvas.height) activeConfettis = true; // Still on screen

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // Remove off-screen particles to save memory
        confettis = confettis.filter(p => p.y < canvas.height + 100);

        if (activeConfettis) {
            animationId = requestAnimationFrame(loopStyleConfetti);
        } else {
            animationId = null;
        }
    }
});
