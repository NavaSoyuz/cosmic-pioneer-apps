const soundsData = [
    {
        id: 'rain',
        name: 'Rain',
        icon: 'bx-cloud-rain',
        url: 'https://cdn.freesound.org/previews/34/34065_28216-lq.mp3'
    },
    {
        id: 'cafe',
        name: 'Cafe',
        icon: 'bx-coffee',
        url: 'https://cdn.freesound.org/previews/37/37618_52655-lq.mp3'
    },
    {
        id: 'birds',
        name: 'Forest Birds',
        icon: 'bx-leaf',
        url: 'https://cdn.freesound.org/previews/116/116089_2026709-lq.mp3'
    },
    {
        id: 'fire',
        name: 'Fireplace',
        icon: 'bx-cookie', // closest flame-like cozy icon, or bxs-hot
        url: 'https://cdn.freesound.org/previews/813/813328_11606594-lq.mp3'
    },
    {
        id: 'wind',
        name: 'Wind',
        icon: 'bx-wind',
        url: 'https://cdn.freesound.org/previews/830/830253_11606594-lq.mp3'
    },
    {
        id: 'waves',
        name: 'Waves',
        icon: 'bx-water',
        url: 'https://cdn.freesound.org/previews/157/157880_177850-lq.mp3'
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById('sound-grid');
    const masterPauseBtn = document.getElementById('master-pause');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // Store instances
    const soundCards = [];

    // Render Grid
    soundsData.forEach(data => {
        // Create audio element
        const audio = new Audio(data.url);
        audio.loop = true;
        audio.volume = 0.5;

        // Create card element
        const card = document.createElement('div');
        card.className = 'sound-card';
        card.id = `card-${data.id}`;

        card.innerHTML = `
            <i class='bx ${data.icon} sound-icon'></i>
            <span class="sound-name">${data.name}</span>
            <div class="volume-control">
                <input type="range" class="vol-slider" min="0" max="1" step="0.05" value="0.5">
            </div>
        `;

        const slider = card.querySelector('.vol-slider');

        // --- Event Listeners ---

        // Prevent slider click/drag from toggling the card
        slider.addEventListener('click', (e) => e.stopPropagation());
        slider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            // Optionally, if they set volume to 0, maybe fade/pause, but here it just lowers volume.
        });

        // Toggle play/pause
        card.addEventListener('click', () => {
            if (audio.paused) {
                // Ensure volume slider matches audio state when restarted just in case
                audio.volume = slider.value;
                audio.play()
                    .then(() => card.classList.add('active'))
                    .catch(err => console.log('Audio playback prevented:', err));
            } else {
                audio.pause();
                card.classList.remove('active');
            }
        });

        grid.appendChild(card);
        soundCards.push({ audio, card });
    });

    // Master Pause
    masterPauseBtn.addEventListener('click', () => {
        soundCards.forEach(s => {
            s.audio.pause();
            s.card.classList.remove('active');
        });
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
            fullscreenBtn.innerHTML = "<i class='bx bx-exit-fullscreen'></i>";
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerHTML = "<i class='bx bx-expand'></i>";
        }
    });

    // Handle escape key updating the icon
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.innerHTML = "<i class='bx bx-expand'></i>";
        }
    });
});
