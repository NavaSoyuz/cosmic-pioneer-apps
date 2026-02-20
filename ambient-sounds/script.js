const soundsData = [
    {
        id: 'rain',
        name: 'Rain',
        icon: 'bx-cloud-rain',
        url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Rain_and_Thunder.ogg'
    },
    {
        id: 'cafe',
        name: 'Cafe',
        icon: 'bx-coffee',
        url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Small_crowd_talking.ogg'
    },
    {
        id: 'birds',
        name: 'Forest Birds',
        icon: 'bx-leaf',
        url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Birds_recording_2020.ogg'
    },
    {
        id: 'fire',
        name: 'Fireplace',
        icon: 'bx-cookie', // closest flame-like cozy icon, or bxs-hot
        url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Campfire.ogg'
    },
    {
        id: 'wind',
        name: 'Wind',
        icon: 'bx-wind',
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Wind-noise.ogg'
    },
    {
        id: 'waves',
        name: 'Waves',
        icon: 'bx-water',
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Waves_crashing_against_rocks.ogg'
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
