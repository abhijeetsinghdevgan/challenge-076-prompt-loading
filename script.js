/* ==========================================================================
   LOAD_STATION CONTROLLER & RENDERING ENGINES
   Challenge #076 // Interactive Loading Showcase
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- Global Application State ---
    const state = {
        currentTab: 'game-mode',
        audioEnabled: false,
        synth: {
            ctx: null,
            droneOsc: null,
            droneGain: null,
            activeDrone: false
        }
    };

    // --- Selectors ---
    const navButtons = document.querySelectorAll(".nav-item");
    const panels = document.querySelectorAll(".scenario-panel");
    const audioToggleBtn = document.getElementById("synth-audio-toggle");

    /* ==========================================================================
       1. GLOBAL CONTROLS & NAVIGATION
       ========================================================================== */
    
    // Tab Swapping
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.target;
            if (target === state.currentTab) return;

            // Update Nav State
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Swap Display Panels with elegant transition
            panels.forEach(p => {
                p.classList.remove("active");
                if (p.id === target) {
                    setTimeout(() => p.classList.add("active"), 50);
                }
            });

            state.currentTab = target;
            playClickSound(800, 0.05);

            // Handle scenario transitions (e.g. resetting loaders on entry)
            triggerScenarioTransition(target);
        });
    });

    function triggerScenarioTransition(tabId) {
        // Drone audio manipulation based on active screen
        if (state.audioEnabled) {
            updateDroneSettingsForTab(tabId);
        }

        // Specific loader triggers
        if (tabId === 'game-mode') {
            resetGameLoader();
            startGameLoader();
        } else if (tabId === 'movie-mode') {
            resetMoviePlayer();
        } else if (tabId === 'dashboard-mode') {
            triggerDashboardFetch();
        } else if (tabId === 'sandbox-mode') {
            initSandboxSimulation();
        }
    }

    /* ==========================================================================
       2. WEB AUDIO API SYNTHESIZER (SOUNDSCAPE ENGINE)
       ========================================================================== */
    
    // Lazy initialization of AudioContext on user interaction
    function initAudioContext() {
        if (state.synth.ctx) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            state.synth.ctx = new AudioContextClass();
            
            // Build Deep Synth Drone routing
            state.synth.droneOsc = state.synth.ctx.createOscillator();
            state.synth.droneGain = state.synth.ctx.createGain();
            
            // Create low-pass filter for extra analog feel
            const filter = state.synth.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, state.synth.ctx.currentTime);
            filter.Q.setValueAtTime(1.5, state.synth.ctx.currentTime);

            state.synth.droneOsc.type = 'sawtooth';
            state.synth.droneOsc.frequency.setValueAtTime(55, state.synth.ctx.currentTime); // Low A

            state.synth.droneGain.gain.setValueAtTime(0.0, state.synth.ctx.currentTime);

            // Route
            state.synth.droneOsc.connect(filter);
            filter.connect(state.synth.droneGain);
            state.synth.droneGain.connect(state.synth.ctx.destination);

            state.synth.droneOsc.start(0);
            state.synth.activeDrone = true;
        } catch (e) {
            console.error("Audio Context initialization failed: ", e);
        }
    }

    // Toggle soundscape
    audioToggleBtn.addEventListener("click", () => {
        initAudioContext();
        
        // Resume context if suspended (browser security)
        if (state.synth.ctx && state.synth.ctx.state === 'suspended') {
            state.synth.ctx.resume();
        }

        state.audioEnabled = !state.audioEnabled;

        if (state.audioEnabled) {
            audioToggleBtn.classList.add("active");
            audioToggleBtn.querySelector(".icon-muted").classList.add("hidden");
            audioToggleBtn.querySelector(".icon-playing").classList.remove("hidden");
            audioToggleBtn.querySelector("span").textContent = "SYNTH AUDIO: ON";
            
            // Fade in Drone
            if (state.synth.droneGain) {
                state.synth.droneGain.gain.linearRampToValueAtTime(0.12, state.synth.ctx.currentTime + 1.5);
                updateDroneSettingsForTab(state.currentTab);
            }
            playClickSound(900, 0.1);
        } else {
            audioToggleBtn.classList.remove("active");
            audioToggleBtn.querySelector(".icon-muted").classList.remove("hidden");
            audioToggleBtn.querySelector(".icon-playing").classList.add("hidden");
            audioToggleBtn.querySelector("span").textContent = "SYNTH AUDIO: OFF";
            
            // Fade out Drone
            if (state.synth.droneGain) {
                state.synth.droneGain.gain.linearRampToValueAtTime(0.0, state.synth.ctx.currentTime + 0.5);
            }
        }
    });

    // Sound effect: Simple high-frequency neon blip
    function playClickSound(frequency = 800, duration = 0.05, type = 'sine') {
        if (!state.audioEnabled || !state.synth.ctx) return;
        
        try {
            const osc = state.synth.ctx.createOscillator();
            const gainNode = state.synth.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, state.synth.ctx.currentTime);
            
            gainNode.gain.setValueAtTime(0.08, state.synth.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, state.synth.ctx.currentTime + duration);
            
            osc.connect(gainNode);
            gainNode.connect(state.synth.ctx.destination);
            
            osc.start();
            osc.stop(state.synth.ctx.currentTime + duration);
        } catch (e) {
            // Silence audio errors safely
        }
    }

    // Sound effect: Deep cinematic boom upon successful loading completion
    function playSuccessBoom() {
        if (!state.audioEnabled || !state.synth.ctx) return;

        try {
            const time = state.synth.ctx.currentTime;
            
            // Deep sub impact
            const subOsc = state.synth.ctx.createOscillator();
            const subGain = state.synth.ctx.createGain();
            
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(80, time);
            subOsc.frequency.exponentialRampToValueAtTime(25, time + 1.5); // Sweeping sub-bass downward
            
            subGain.gain.setValueAtTime(0.35, time);
            subGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);
            
            subOsc.connect(subGain);
            subGain.connect(state.synth.ctx.destination);
            
            subOsc.start();
            subOsc.stop(time + 1.8);

            // Shimmer high-frequency chime
            const chimeOsc = state.synth.ctx.createOscillator();
            const chimeGain = state.synth.ctx.createGain();
            
            chimeOsc.type = 'triangle';
            chimeOsc.frequency.setValueAtTime(880, time);
            chimeOsc.frequency.exponentialRampToValueAtTime(1320, time + 0.3);
            
            chimeGain.gain.setValueAtTime(0.06, time);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
            
            chimeOsc.connect(chimeGain);
            chimeGain.connect(state.synth.ctx.destination);
            
            chimeOsc.start();
            chimeOsc.stop(time + 0.8);
        } catch(e) {}
    }

    // Dynamic Drone updates to match screens
    function updateDroneSettingsForTab(tabId) {
        if (!state.synth.ctx || !state.synth.droneOsc) return;

        const time = state.synth.ctx.currentTime;
        switch(tabId) {
            case 'game-mode':
                // Cyberpunk heavy industrial drone (55Hz / Sawtooth)
                state.synth.droneOsc.type = 'sawtooth';
                state.synth.droneOsc.frequency.exponentialRampToValueAtTime(55, time + 1.0);
                break;
            case 'movie-mode':
                // Cinema soft deep rumble (40Hz / Sine-like triangle)
                state.synth.droneOsc.type = 'triangle';
                state.synth.droneOsc.frequency.exponentialRampToValueAtTime(40, time + 1.5);
                break;
            case 'dashboard-mode':
                // Tech analytical warm hum (110Hz / Triangle)
                state.synth.droneOsc.type = 'triangle';
                state.synth.droneOsc.frequency.exponentialRampToValueAtTime(110, time + 1.0);
                break;
            case 'sandbox-mode':
                // Celestial resonant sine wave (73.4Hz / Sine)
                state.synth.droneOsc.type = 'sine';
                state.synth.droneOsc.frequency.exponentialRampToValueAtTime(73.4, time + 1.0);
                break;
        }
    }


    /* ==========================================================================
       3. CYBERPUNK GAME LOADING SCREEN (NEO-GENESIS)
       ========================================================================= */
    const gameMode = {
        percentage: 0,
        timer: null,
        logs: [
            { pct: 0, txt: "BOOTING_SYSTEM_NEO_GENESIS_v9.84", type: "system" },
            { pct: 4, txt: "INITIATING DIAGNOSTIC CORE SWEEP...", type: "info" },
            { pct: 9, txt: "CPU QUANTUM CORE ALLOCATION: ACTIVE [16 Thds]", type: "ok" },
            { pct: 15, txt: "MEM SHADOW ARRAYS STABILIZING...", type: "info" },
            { pct: 24, txt: "FUSION INJECTOR SYNC STATUS: SECURE", type: "ok" },
            { pct: 32, txt: "CONNECTING NEURAL SYNERGY INTERFACE...", type: "info" },
            { pct: 38, txt: "WARNING: THERMAL GRADIENT SPIKE DETECTED", type: "warn" },
            { pct: 41, txt: "STABILIZING CORE TEMP via LIQUID-HE EXCHANGERS...", type: "info" },
            { pct: 48, txt: "CORE TEMP NOMINAL (2.4 Kelvin) // PROCEEDING", type: "ok" },
            { pct: 58, txt: "SYNCHRONIZING GRAPHICS ENGINE RASTERIZERS...", type: "info" },
            { pct: 67, txt: "ASSET PIPELINE BOOT: Loaded 41,293 meshes", type: "ok" },
            { pct: 75, txt: "SHADERS COMPILING: [██████████░░] 82.5%", type: "info" },
            { pct: 81, txt: "ALERT: MINOR SYNAPSE DESYNC DETECTED [SECTOR 09]", type: "warn" },
            { pct: 84, txt: "AUTO-TUNING NEURAL GAIN RESISTANCE... COMPLETE", type: "ok" },
            { pct: 92, txt: "FINALIZING SPATIAL RENDERING LAYER MATRIX", type: "info" },
            { pct: 97, txt: "NEURAL LINK SYNCHRONIZED // STANDBY", type: "ok" },
            { pct: 100, txt: "SIMULATION CONSTRUCT READY. PRESS REBOOT TO INJECT.", type: "system" }
        ],
        tips: [
            "Thermal spikes are natural in high-capacity fusion arrays. Ensure grid coolant levels exceed 75% in active sectors.",
            "Cybernetic neural links operate best when biological jitter remains below 0.12ms.",
            "Sector 09 is currently undergoing cyber-grid maintenance. Expect chromatic aberration in visual HUD feeds.",
            "Quantum core registers require periodic reboots to clear entropic memory leak residues."
        ],
        tipIndex: 0,
        tipTimer: null
    };

    const gameLogsContainer = document.getElementById("game-logs");
    const gamePercentageEl = document.getElementById("game-percentage");
    const gameProgressBar = document.getElementById("game-bar");
    const gameProgressBarGlow = document.getElementById("game-bar-glow");
    const gameTipCard = document.getElementById("game-tip-card");
    const gameTipText = document.getElementById("game-tip-text");
    const restartGameBtn = document.getElementById("restart-game-loader");

    function resetGameLoader() {
        clearInterval(gameMode.timer);
        clearInterval(gameMode.tipTimer);
        gameMode.percentage = 0;
        gameLogsContainer.innerHTML = "";
        gamePercentageEl.textContent = "0%";
        gameProgressBar.style.width = "0%";
        gameProgressBarGlow.style.width = "0%";
        gameTipCard.classList.remove("show");
        restartGameBtn.disabled = true;
    }

    function startGameLoader() {
        gameTipCard.classList.add("show");
        rotateGameTip();
        
        // Setup tip rotation
        gameMode.tipTimer = setInterval(rotateGameTip, 4500);

        gameMode.timer = setInterval(() => {
            // Realistic organic loading progression (surges and pauses)
            let increment = 1;
            
            // Pauses around tricky systems allocation (38% to 41% and 78% to 83%)
            if ((gameMode.percentage >= 37 && gameMode.percentage < 41) || 
                (gameMode.percentage >= 77 && gameMode.percentage < 82)) {
                increment = Math.random() > 0.85 ? 1 : 0; // Slow down heavily
            } else if (Math.random() > 0.4) {
                increment = Math.floor(Math.random() * 3) + 1; // Surge!
            }

            gameMode.percentage = Math.min(100, gameMode.percentage + increment);
            
            // Render Progress
            gamePercentageEl.textContent = `${gameMode.percentage}%`;
            gameProgressBar.style.width = `${gameMode.percentage}%`;
            gameProgressBarGlow.style.width = `${gameMode.percentage}%`;

            // Draw diagnostic log rows
            gameMode.logs.forEach(log => {
                if (log.pct <= gameMode.percentage && !log.rendered) {
                    log.rendered = true;
                    appendTerminalLog(log.txt, log.type);
                    if (state.audioEnabled) {
                        // High-pitched diagnostic clicks
                        const tone = log.type === 'warn' ? 440 : log.type === 'system' ? 1200 : 880;
                        playClickSound(tone, 0.04);
                    }
                }
            });

            // Completed!
            if (gameMode.percentage >= 100) {
                clearInterval(gameMode.timer);
                restartGameBtn.disabled = false;
                playSuccessBoom();
            }
        }, 120);
    }

    function appendTerminalLog(text, type) {
        const row = document.createElement("div");
        row.className = `log-row log-${type}`;
        
        let prefix = "[OK]";
        if (type === 'warn') prefix = "[WRN]";
        if (type === 'system') prefix = "[SYS]";
        if (type === 'info') prefix = "[...]";

        row.textContent = `${prefix} ${text}`;
        gameLogsContainer.appendChild(row);
        gameLogsContainer.scrollTop = gameLogsContainer.scrollHeight;
    }

    function rotateGameTip() {
        gameTipCard.classList.remove("show");
        
        setTimeout(() => {
            gameTipText.textContent = gameMode.tips[gameMode.tipIndex];
            gameMode.tipIndex = (gameMode.tipIndex + 1) % gameMode.tips.length;
            gameTipCard.classList.add("show");
            playClickSound(600, 0.05, 'triangle');
        }, 600);
    }

    restartGameBtn.addEventListener("click", () => {
        // Mark logs as unrendered
        gameMode.logs.forEach(l => l.rendered = false);
        resetGameLoader();
        startGameLoader();
        playClickSound(300, 0.15, 'sawtooth');
    });


    /* ==========================================================================
       4. MOVIE BUFFER SIMULATOR (CINE-FLOW)
       ========================================================================== */
    const movieMode = {
        status: 'idle', // idle, buffering, playing, completed
        percentage: 0,
        timelinePct: 0,
        networkSpeed: 'fiber', // fiber, fiveg, fourg, threeg
        videoDuration: 150, // 2 mins 30 seconds
        playTimer: null,
        bufferTimer: null,
        simulatedLoadedPct: 0,
        
        // Speeds configurations
        rates: {
            fiber: { speed: '120.4 MB/s', delay: 400, jitter: '4ms', freq: 'Very Low' },
            fiveg: { speed: '14.8 MB/s', delay: 1500, jitter: '18ms', freq: 'Low' },
            fourg: { speed: '4.2 MB/s', delay: 3000, jitter: '42ms', freq: 'Medium (Intermittent)' },
            threeg: { speed: '820 KB/s', delay: 6000, jitter: '124ms', freq: 'High (Frequent Stutter)' }
        }
    };

    const movieBg = document.getElementById("movie-bg");
    const movieBufferOverlay = document.getElementById("movie-buffer-overlay");
    const movieBufferRate = document.getElementById("movie-buffer-rate");
    const movieBufferEta = document.getElementById("movie-buffer-eta");
    const moviePlayBtn = document.getElementById("movie-play-btn");
    const movieReloadBtn = document.getElementById("movie-reload-btn");
    const movieTimeDisplay = document.getElementById("movie-time-display");
    const movieTimelineProgress = document.getElementById("movie-timeline-progress");
    const movieTimelineBuffered = document.getElementById("movie-timeline-buffered");
    const movieBigPlayBtn = document.getElementById("movie-big-play");
    const networkPresetBtns = document.querySelectorAll(".btn-preset");
    
    // Stats elements
    const statBufferingFreq = document.getElementById("stat-buffering-freq");
    const statJitter = document.getElementById("stat-jitter");
    const statDroppedFrames = document.getElementById("stat-dropped-frames");
    let droppedFramesCount = 0;

    function resetMoviePlayer() {
        clearInterval(movieMode.playTimer);
        clearInterval(movieMode.bufferTimer);
        movieMode.status = 'idle';
        movieMode.percentage = 0;
        movieMode.timelinePct = 0;
        movieMode.simulatedLoadedPct = 0;
        droppedFramesCount = 0;

        movieBg.className = "movie-backdrop-img blurred";
        movieBufferOverlay.style.opacity = 1;
        movieBufferOverlay.classList.remove("hidden");
        moviePlayBtn.querySelector("#play-icon").classList.remove("hidden");
        moviePlayBtn.querySelector("#pause-icon").classList.add("hidden");
        movieBigPlayBtn.classList.remove("hidden");
        movieTimelineProgress.style.width = "0%";
        movieTimelineBuffered.style.width = "0%";
        movieTimeDisplay.textContent = "0:00 / 2:30";
        statDroppedFrames.textContent = "0";
        
        updateNetworkUI();
    }

    function updateNetworkUI() {
        const rate = movieMode.rates[movieMode.networkSpeed];
        statBufferingFreq.textContent = rate.freq;
        statJitter.textContent = rate.jitter;
    }

    // Switch speed presets
    networkPresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            networkPresetBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            movieMode.networkSpeed = btn.dataset.speed;
            
            playClickSound(700, 0.05);
            resetMoviePlayer();
        });
    });

    movieBigPlayBtn.addEventListener("click", startCinemaBuffering);
    moviePlayBtn.addEventListener("click", () => {
        if (movieMode.status === 'playing') {
            pauseCinema();
        } else if (movieMode.status === 'idle') {
            startCinemaBuffering();
        } else {
            resumeCinema();
        }
    });

    movieReloadBtn.addEventListener("click", () => {
        playClickSound(400, 0.1);
        resetMoviePlayer();
        startCinemaBuffering();
    });

    function startCinemaBuffering() {
        movieBigPlayBtn.classList.add("hidden");
        movieMode.status = 'buffering';
        moviePlayBtn.querySelector("#play-icon").classList.add("hidden");
        moviePlayBtn.querySelector("#pause-icon").classList.remove("hidden");
        movieBufferOverlay.classList.remove("hidden");
        movieBufferOverlay.style.opacity = 1;
        movieBg.className = "movie-backdrop-img blurred";

        let buffProgress = 0;
        const netConfig = movieMode.rates[movieMode.networkSpeed];
        
        movieBufferRate.textContent = `CONNECTING NETWORK...`;
        movieBufferEta.textContent = `SPEED: ${netConfig.speed}`;

        // Buffer Loop
        movieMode.bufferTimer = setInterval(() => {
            let increment = Math.floor(Math.random() * 8) + 4;
            if (movieMode.networkSpeed === 'threeg') increment = Math.floor(Math.random() * 3) + 1; // 3G loads extremely slow

            buffProgress = Math.min(100, buffProgress + increment);
            movieBufferRate.textContent = `BUFFERING... ${buffProgress}%`;
            
            // Render buffer timeline slightly ahead of playing position
            movieMode.simulatedLoadedPct = Math.min(100, Math.max(movieMode.simulatedLoadedPct, buffProgress));
            movieTimelineBuffered.style.width = `${movieMode.simulatedLoadedPct}%`;

            if (state.audioEnabled) {
                // Buffer loading whistle sound
                playClickSound(200 + (buffProgress * 2), 0.05, 'triangle');
            }

            if (buffProgress >= 100) {
                clearInterval(movieMode.bufferTimer);
                startPlayingCinema();
            }
        }, 100);
    }

    function startPlayingCinema() {
        movieMode.status = 'playing';
        movieBufferOverlay.style.opacity = 0;
        setTimeout(() => movieBufferOverlay.classList.add("hidden"), 500);
        
        movieBg.className = "movie-backdrop-img active-play";
        playSuccessBoom();

        // Video Timeline Loop
        movieMode.playTimer = setInterval(() => {
            movieMode.timelinePct += 0.5; // Increment timeline progress
            
            if (movieMode.timelinePct >= 100) {
                movieMode.timelinePct = 100;
                clearInterval(movieMode.playTimer);
                movieMode.status = 'completed';
                pauseCinema();
            }

            movieTimelineProgress.style.width = `${movieMode.timelinePct}%`;

            // Calculate current running play timer display
            const curSeconds = Math.floor((movieMode.timelinePct / 100) * movieMode.videoDuration);
            const minutes = Math.floor(curSeconds / 60);
            const seconds = curSeconds % 60;
            movieTimeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} / 2:30`;

            // BUFFERING STUTTERS SIMULATION
            // 4G stutters once at 40%, 3G stutters constantly (at 20%, 50%, 75%)
            const shouldStutter4G = movieMode.networkSpeed === 'fourg' && Math.floor(movieMode.timelinePct) === 40;
            const shouldStutter3G = movieMode.networkSpeed === 'threeg' && 
                                   (Math.floor(movieMode.timelinePct) === 20 || 
                                    Math.floor(movieMode.timelinePct) === 50 || 
                                    Math.floor(movieMode.timelinePct) === 75);

            if (shouldStutter4G || shouldStutter3G) {
                triggerCinemaStutter();
            }
        }, 200);
    }

    function triggerCinemaStutter() {
        clearInterval(movieMode.playTimer);
        movieMode.status = 'buffering';
        droppedFramesCount += Math.floor(Math.random() * 20) + 10;
        statDroppedFrames.textContent = droppedFramesCount;

        startCinemaBuffering();
    }

    function pauseCinema() {
        clearInterval(movieMode.playTimer);
        moviePlayBtn.querySelector("#play-icon").classList.remove("hidden");
        moviePlayBtn.querySelector("#pause-icon").classList.add("hidden");
        movieBg.classList.add("blurred");
        movieBg.classList.remove("active-play");
    }

    function resumeCinema() {
        playClickSound(800, 0.05);
        if (movieMode.status === 'completed') {
            resetMoviePlayer();
            startCinemaBuffering();
        } else {
            startPlayingCinema();
        }
    }


    /* ==========================================================================
       5. ENTERPRISE SAAS DASHBOARD SKELETON (CORP-GRID)
       ========================================================================== */
    const dbMode = {
        loading: false,
        chart: null,
        chartCtx: null,
        conversionsTarget: 24892,
        revenueTarget: 142390,
        sessionsTarget: 8419
    };

    const dbSkeleton = document.getElementById("dashboard-skeleton");
    const dbActual = document.getElementById("dashboard-actual");
    const dbReloadBtn = document.getElementById("trigger-skeleton-reload");
    const chartCanvas = document.getElementById("dashboard-canvas-chart");

    dbReloadBtn.addEventListener("click", () => {
        playClickSound(900, 0.05, 'triangle');
        triggerDashboardFetch();
    });

    function triggerDashboardFetch() {
        if (dbMode.loading) return;
        
        dbMode.loading = true;
        dbActual.classList.add("hidden");
        dbSkeleton.classList.remove("hidden");
        dbSkeleton.style.opacity = 1;
        dbReloadBtn.disabled = true;

        // Simulate high-fidelity network request with 2s latency
        setTimeout(() => {
            dbSkeleton.style.opacity = 0;
            setTimeout(() => {
                dbSkeleton.classList.add("hidden");
                dbActual.classList.remove("hidden");
                dbReloadBtn.disabled = false;
                dbMode.loading = false;
                
                // Initialize high-fidelity canvas charts
                initDashboardCanvasCharts();
                animateNumbers();
                playSuccessBoom();
            }, 300);
        }, 2000);
    }

    function animateNumbers() {
        // Smoothly roll numbers up for extra visual premiumness
        animateSingleNumber("val-conversions", 24000, dbMode.conversionsTarget, 1200, "");
        animateSingleNumber("val-revenue", 140000, dbMode.revenueTarget, 1500, "$");
        animateSingleNumber("val-sessions", 8000, dbMode.sessionsTarget, 1000, "");
    }

    function animateSingleNumber(elementId, start, end, duration, prefix) {
        const el = document.getElementById(elementId);
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            const value = Math.floor(start + easeProgress * (end - start));
            
            el.textContent = prefix + value.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // High fidelity Canvas custom dual line rendering
    function initDashboardCanvasCharts() {
        if (!chartCanvas) return;

        dbMode.chartCtx = chartCanvas.getContext("2d");
        
        // Setup Retina resolution canvas sizing
        const rect = chartCanvas.getBoundingClientRect();
        chartCanvas.width = rect.width * devicePixelRatio;
        chartCanvas.height = rect.height * devicePixelRatio;
        dbMode.chartCtx.scale(devicePixelRatio, devicePixelRatio);

        drawDashboardCharts(rect.width, rect.height);
    }

    function drawDashboardCharts(width, height) {
        const ctx = dbMode.chartCtx;
        ctx.clearRect(0, 0, width, height);

        // Chart configurations
        const padding = { top: 20, right: 30, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Custom High-fidelity grid coordinates
        const data1 = [24, 38, 48, 32, 54, 76, 68, 88, 92, 100];
        const data2 = [18, 22, 28, 45, 38, 62, 51, 68, 84, 78];
        const xStep = chartWidth / (data1.length - 1);

        // Grid lines drawing
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            // Y Axis Labels
            ctx.fillStyle = "#475569";
            ctx.font = "10px var(--font-mono)";
            ctx.fillText(`${100 - i * 25}%`, padding.left - 30, y + 4);
        }

        // Draw dual performance paths
        drawPath(ctx, data1, xStep, padding, chartHeight, "rgba(0, 240, 255, 1)", "rgba(0, 240, 255, 0.08)");
        drawPath(ctx, data2, xStep, padding, chartHeight, "rgba(240, 0, 255, 1)", "rgba(240, 0, 255, 0.08)");
    }

    function drawPath(ctx, data, xStep, padding, chartHeight, strokeColor, fillColor) {
        ctx.beginPath();
        
        data.forEach((val, idx) => {
            const x = padding.left + idx * xStep;
            const y = padding.top + chartHeight - (val / 100) * chartHeight;
            
            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                // Bezier curve interpolation for organic smooth flows
                const prevX = padding.left + (idx - 1) * xStep;
                const prevY = padding.top + chartHeight - (data[idx - 1] / 100) * chartHeight;
                const cpX1 = prevX + xStep / 2;
                const cpY1 = prevY;
                const cpX2 = prevX + xStep / 2;
                const cpY2 = y;
                ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
            }
        });

        // Stroke line
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Fill under path
        ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        grad.addColorStop(0, fillColor);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();

        // Node dots
        data.forEach((val, idx) => {
            const x = padding.left + idx * xStep;
            const y = padding.top + chartHeight - (val / 100) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        });
    }


    /* ==========================================================================
       6. ABSTRACT INTERACTIVE LOADING SANDBOX (MORPH-LAB)
       ========================================================================== */
    const sandbox = {
        canvas: document.getElementById("sandbox-canvas"),
        ctx: null,
        particles: [],
        active: false,
        animationFrameId: null,
        
        // Dynamic Parameters
        speed: 1.0,
        particlesCount: 200,
        glowRadius: 15,
        matrixStyle: 'circular', // circular, helix, attractor, vortex
        colorTheme: 'cyber', // cyber, toxic, cosmic, amber
        
        // Color presets
        themes: {
            cyber: ['#00f0ff', '#f000ff'],
            toxic: ['#39ff14', '#00ffcc'],
            cosmic: ['#ff007f', '#7f00ff'],
            amber: ['#ffb700', '#ff5500']
        }
    };

    // Sliders
    const sbSpeedSlider = document.getElementById("sb-speed");
    const sbParticlesSlider = document.getElementById("sb-particles");
    const sbGlowSlider = document.getElementById("sb-glow");
    
    // Slider Value displays
    const sbValSpeed = document.getElementById("sb-val-speed");
    const sbValParticles = document.getElementById("sb-val-particles");
    const sbValGlow = document.getElementById("sb-val-glow");
    const sbValDimension = document.getElementById("sb-val-dimension");

    // Grid Options & Theme Selectors
    const gridOptionBtns = document.querySelectorAll(".btn-grid-option");
    const themePaletteBtns = document.querySelectorAll(".btn-palette");
    const explodeBtn = document.getElementById("sb-explode");

    // Stats Displays
    const sbStatCount = document.getElementById("sb-stat-count");
    const sbStatPreset = document.getElementById("sb-stat-preset");
    const sbStatAudio = document.getElementById("sb-stat-audio");

    function initSandboxSimulation() {
        if (sandbox.active) return;
        
        sandbox.ctx = sandbox.canvas.getContext("2d");
        sandbox.active = true;

        // Resize Hook
        resizeSandboxCanvas();
        window.addEventListener("resize", resizeSandboxCanvas);

        // Build Particle Arrays
        rebuildParticles();
        
        // Run loop
        loopSandbox();
    }

    function resizeSandboxCanvas() {
        if (!sandbox.active || state.currentTab !== 'sandbox-mode') return;
        const rect = sandbox.canvas.parentNode.getBoundingClientRect();
        sandbox.canvas.width = rect.width;
        sandbox.canvas.height = rect.height;
    }

    // Single Particle blueprint
    class Particle {
        constructor(idx) {
            this.idx = idx;
            this.reset();
        }

        reset() {
            const w = sandbox.canvas.width;
            const h = sandbox.canvas.height;
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = 0;
            this.vy = 0;
            this.angle = Math.random() * Math.PI * 2;
            this.speedMultiplier = Math.random() * 0.5 + 0.5;
            this.size = Math.random() * 3 + 1.5;
            this.entropyX = 0;
            this.entropyY = 0;
            this.entropyForce = 0;
        }

        update(time) {
            const w = sandbox.canvas.width;
            const h = sandbox.canvas.height;
            const centerX = w / 2;
            const centerY = h / 2;
            
            // Base coordinates targeting
            let tx = centerX;
            let ty = centerY;

            // Apply specific loading configurations
            if (sandbox.matrixStyle === 'circular') {
                // Classic concentric loading spinner
                const circleRadius = 130 + (this.idx % 3) * 20; // 3 Rings
                const speed = 0.003 * sandbox.speed * this.speedMultiplier;
                const rotationAngle = (this.idx % 2 === 0 ? time : -time) * speed + (this.idx * 0.1);
                
                tx = centerX + Math.cos(rotationAngle) * circleRadius;
                ty = centerY + Math.sin(rotationAngle) * circleRadius;
            } 
            else if (sandbox.matrixStyle === 'helix') {
                // Double Helix strand loader rotating in 3D perspective
                const helixWidth = 320;
                const scale = (this.idx % 2 === 0 ? 1 : -1);
                const helixX = ((this.idx * 1.8) % helixWidth) - (helixWidth / 2);
                
                // Rotational projection
                const spinSpeed = 0.002 * sandbox.speed * time + (this.idx * 0.05);
                const offset3D = Math.sin(spinSpeed) * 50 * scale;
                const depthScale = (Math.cos(spinSpeed) + 1.5) * 0.4;
                
                tx = centerX + helixX;
                ty = centerY + offset3D;
                this.size = (Math.cos(spinSpeed) + 2) * 1.2 * depthScale;
            } 
            else if (sandbox.matrixStyle === 'attractor') {
                // Swarm orbital gravity attractor
                const angleSpeed = 0.0001 * time * sandbox.speed + (this.idx * 0.3);
                const orbitRadius = 150 + Math.sin(time * 0.001 + this.idx) * 40;
                
                tx = centerX + Math.cos(angleSpeed) * orbitRadius;
                ty = centerY + Math.sin(angleSpeed) * orbitRadius;
            } 
            else if (sandbox.matrixStyle === 'vortex') {
                // Spatial black-hole vortex sucking in particles
                const spiralSpeed = 0.0008 * time * sandbox.speed;
                const inwardDist = (400 - (time * 0.05 * sandbox.speed + this.idx * 4) % 400);
                const spiralAngle = spiralSpeed + (this.idx * 0.08);

                tx = centerX + Math.cos(spiralAngle) * inwardDist;
                ty = centerY + Math.sin(spiralAngle) * inwardDist;
            }

            // Apply massive Entropy Explode Force
            if (this.entropyForce > 0.1) {
                this.x += this.entropyX * this.entropyForce;
                this.y += this.entropyY * this.entropyForce;
                this.entropyForce *= 0.93; // Exponential decay
            } else {
                // Gravitational drag pull towards target coordinates
                const dx = tx - this.x;
                const dy = ty - this.y;
                
                this.x += dx * 0.08 * sandbox.speed;
                this.y += dy * 0.08 * sandbox.speed;
            }
        }

        draw(ctx) {
            // Draw glowing circles
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function rebuildParticles() {
        sandbox.particles = [];
        for (let i = 0; i < sandbox.particlesCount; i++) {
            sandbox.particles.push(new Particle(i));
        }
        sbStatCount.textContent = sandbox.particlesCount;
    }

    function loopSandbox(timestamp = 0) {
        if (!sandbox.active || state.currentTab !== 'sandbox-mode') {
            cancelAnimationFrame(sandbox.animationFrameId);
            sandbox.active = false;
            return;
        }

        const ctx = sandbox.ctx;
        const w = sandbox.canvas.width;
        const h = sandbox.canvas.height;

        // Clear canvas with subtle alpha accumulation trails for motion blur
        ctx.fillStyle = 'rgba(3, 3, 6, 0.16)';
        ctx.fillRect(0, 0, w, h);

        // Gradient Glow styling
        const colors = sandbox.themes[sandbox.colorTheme];
        const centerGradient = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, 280);
        centerGradient.addColorStop(0, colors[0]);
        centerGradient.addColorStop(1, colors[1]);

        ctx.fillStyle = centerGradient;
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = sandbox.glowRadius;

        // Update & Render loop
        sandbox.particles.forEach(p => {
            p.update(timestamp);
            p.draw(ctx);
        });

        // Reset drop shadow to avoid drawing grids or cards with shadows
        ctx.shadowBlur = 0;

        // Modulate Synth sound frequencies dynamically mapping sandbox parameters!
        modulateSynthSandbox(timestamp);

        sandbox.animationFrameId = requestAnimationFrame(loopSandbox);
    }

    function modulateSynthSandbox(time) {
        if (!state.audioEnabled || !state.synth.ctx || !state.synth.droneOsc) return;

        // Dynamically shift drone frequencies matching particle simulation speeds & gravity presets!
        const hzSpeedFactor = sandbox.speed * 15;
        let baseHz = 55; // Default low A
        
        if (sandbox.matrixStyle === 'helix') baseHz = 73.4; // Low D
        if (sandbox.matrixStyle === 'attractor') baseHz = 65.4; // Low C
        if (sandbox.matrixStyle === 'vortex') baseHz = 48.9; // Low G

        const dynamicHz = baseHz + hzSpeedFactor;
        state.synth.droneOsc.frequency.setValueAtTime(dynamicHz, state.synth.ctx.currentTime);
        sbStatAudio.textContent = `${Math.floor(dynamicHz)} Hz`;
    }

    // Trigger Entropy scatter
    explodeBtn.addEventListener("click", () => {
        playClickSound(180, 0.4, 'sawtooth');
        
        sandbox.particles.forEach(p => {
            const force = Math.random() * 30 + 15;
            const angle = Math.random() * Math.PI * 2;
            p.entropyX = Math.cos(angle) * force;
            p.entropyY = Math.sin(angle) * force;
            p.entropyForce = 1.0;
        });
    });

    // Control triggers hooks
    sbSpeedSlider.addEventListener("input", () => {
        sandbox.speed = parseFloat(sbSpeedSlider.value);
        sbValSpeed.textContent = `${sandbox.speed.toFixed(1)}x`;
    });

    sbParticlesSlider.addEventListener("input", () => {
        sandbox.particlesCount = parseInt(sbParticlesSlider.value);
        sbValParticles.textContent = sandbox.particlesCount;
        rebuildParticles();
    });

    sbGlowSlider.addEventListener("input", () => {
        sandbox.glowRadius = parseInt(sbGlowSlider.value);
        sbValGlow.textContent = `${sandbox.glowRadius}px`;
    });

    // Form Matrices Switches
    gridOptionBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            gridOptionBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            sandbox.matrixStyle = btn.dataset.style;
            
            // Set stats label
            let presetLabel = "CIRCULAR GRID";
            if (sandbox.matrixStyle === 'helix') presetLabel = "DOUBLE HELIX SPIRAL";
            if (sandbox.matrixStyle === 'attractor') presetLabel = "ORBITAL ATTRACTOR";
            if (sandbox.matrixStyle === 'vortex') presetLabel = "SPATIAL VORTEX";

            sbValDimension.textContent = btn.textContent;
            sbStatPreset.textContent = presetLabel;

            playClickSound(800, 0.08, 'triangle');
            
            // Trigger minor burst to transition smoothly
            sandbox.particles.forEach(p => p.entropyForce = 0.2);
        });
    });

    // Color Swatches Selection
    themePaletteBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            themePaletteBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            sandbox.colorTheme = btn.dataset.palette;
            
            playClickSound(950, 0.05);
        });
    });


    /* ==========================================================================
       7. INITIALIZATION RUN
       ========================================================================== */
    // Trigger main entry sequence (Neo-Genesis cyberpunk loading begins!)
    startGameLoader();

});
