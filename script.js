// Music Player with YouTube Playlist Integration

// YouTube Playlist Configuration
// Your Premium Bhajan Playlist
const PLAYLIST_ID = "PLM74qOWImQUo";

let currentSongIndex = 0;
let isPlaying = false;
let player;
let progressInterval;
let playbackMode = 'order';
let shuffledOrder = [];

// DOM Elements
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const modeToggleBtn = document.getElementById('modeToggleBtn');
const soundTrigger = document.getElementById('soundTrigger');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const albumArt = document.getElementById('albumArt');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const progress = document.getElementById('progress');
const progressBar = document.querySelector('.progress-bar');

// YouTube IFrame API Ready
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
            'listType': 'playlist',
            'list': PLAYLIST_ID,
            'playsinline': 1,
            'controls': 0,
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'autoplay': 0,
            'loop': 1,
            'origin': window.location.origin,
            'enablejsapi': 1,
            'fs': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': function(e) {
                console.error('YouTube Player Error:', e.data);
            }
        }
    });
}

// Player ready
function onPlayerReady(event) {
    // Stop sankha sound if still playing when YouTube is ready
    if (sankhaSound && !sankhaSound.paused) {
        sankhaSound.pause();
        sankhaSound.currentTime = 0;
    }

    // Restore last position if available
    const savedIndex = parseInt(localStorage.getItem('bhajan_index') || '0');
    const savedTime = parseFloat(localStorage.getItem('bhajan_time') || '0');

    if (savedIndex > 0 && player.getPlaylist && player.getPlaylist()) {
        player.playVideoAt(savedIndex);
        setTimeout(() => {
            if (savedTime > 0) player.seekTo(savedTime, true);
            player.pauseVideo();
            updateSongInfo();
        }, 500);
    } else {
        updateSongInfo();
    }

    startProgressUpdates();

    // Poll until song info is actually available (mobile loads it late)
    const infoPoller = setInterval(() => {
        if (!player || !player.getVideoData) return;
        const data = player.getVideoData();
        if (data && data.video_id && data.title && data.title !== '') {
            updateSongInfo();
            clearInterval(infoPoller);
        }
    }, 200);

    // Stop polling after 10 seconds regardless
    setTimeout(() => clearInterval(infoPoller), 10000);
}

function shuffleArray(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function updatePlaybackModeButtons() {
    if (!modeToggleBtn) return;

    const icon = modeToggleBtn.querySelector('i');
    if (!icon) return;

    if (playbackMode === 'shuffle') {
        modeToggleBtn.dataset.mode = 'shuffle';
        modeToggleBtn.setAttribute('title', 'Shuffle songs');
        modeToggleBtn.setAttribute('aria-label', 'Shuffle songs');
        icon.classList.remove('fa-list-ul');
        icon.classList.add('fa-random');
    } else {
        modeToggleBtn.dataset.mode = 'order';
        modeToggleBtn.setAttribute('title', 'Normal playlist order');
        modeToggleBtn.setAttribute('aria-label', 'Normal playlist order');
        icon.classList.remove('fa-random');
        icon.classList.add('fa-list-ul');
    }
}

function getPlaybackTargetIndex(direction) {
    if (!player || !player.getPlaylist || !player.getPlaylist()) return 0;

    const playlist = player.getPlaylist();
    const total = playlist.length;

    if (!total) return 0;

    const currentIndex = player.getPlaylistIndex();

    if (playbackMode === 'single') {
        return currentIndex;
    }

    if (playbackMode === 'shuffle') {
        if (!shuffledOrder.length || shuffledOrder.length !== total) {
            shuffledOrder = shuffleArray(Array.from({ length: total }, (_, index) => index));
        }

        const currentPosition = shuffledOrder.indexOf(currentIndex);
        const nextPosition = currentPosition === -1
            ? 0
            : (currentPosition + direction + shuffledOrder.length) % shuffledOrder.length;

        return shuffledOrder[nextPosition];
    }

    let nextIndex = currentIndex + direction;
    if (nextIndex >= total) nextIndex = 0;
    if (nextIndex < 0) nextIndex = total - 1;
    return nextIndex;
}

function changeMode(mode) {
    playbackMode = mode === 'shuffle' ? 'shuffle' : 'order';
    updatePlaybackModeButtons();
    if (playbackMode === 'shuffle' && player && typeof player.getPlaylist === 'function') {
        const playlist = player.getPlaylist();
        if (playlist && playlist.length) {
            shuffledOrder = shuffleArray(Array.from({ length: playlist.length }, (_, index) => index));
        }
    }
}

// Player state changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        if (playbackMode === 'single') {
            player.seekTo(0, true);
            player.playVideo();
            return;
        }

        if (player && typeof player.playVideoAt === 'function') {
            const targetIndex = getPlaybackTargetIndex(1);
            player.playVideoAt(targetIndex);
            setTimeout(() => {
                updateSongInfo();
                if (isPlaying) {
                    player.playVideo();
                }
            }, 200);
        } else if (player && typeof player.nextVideo === 'function') {
            player.nextVideo();
            setTimeout(() => {
                updateSongInfo();
                if (isPlaying) {
                    player.playVideo();
                }
            }, 200);
        }
    } else if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayButton();
        updateSongInfo();
        startCDRotation();
        setupMediaSession();
        // Save current song index
        if (player.getPlaylistIndex) {
            localStorage.setItem('bhajan_index', player.getPlaylistIndex());
            localStorage.setItem('bhajan_time', '0');
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayButton();
        stopCDRotation();
    } else if (event.data === YT.PlayerState.BUFFERING) {
        // Song is loading/changing
        setTimeout(updateSongInfo, 300);
    }
}

// CD Rotation Control
function startCDRotation() {
    albumArt.classList.add('spinning');
}

function stopCDRotation() {
    albumArt.classList.remove('spinning');
}

// Update song information
function updateSongInfo() {
    if (!player || !player.getVideoData) return;
    
    const videoData = player.getVideoData();
    const title = videoData.title || "Loading...";
    const author = videoData.author || "Artist";
    const videoId = videoData.video_id;
    
    // Only update if we have valid data (not loading state)
    if (title && title !== "Loading..." && videoId) {
        // Parse title to separate song and artist if formatted as "Song - Artist"
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            songTitle.textContent = parts[0].trim();
            songArtist.textContent = parts[1].trim();
        } else {
            songTitle.textContent = title;
            songArtist.textContent = author;
        }
        
        // Update album art
        albumArt.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        currentSongIndex = player.getPlaylistIndex();
    }
}

// Convert seconds to time string
function convertSecondsToTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgress() {
    if (!player || !player.getCurrentTime) return;
    
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    
    if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = convertSecondsToTime(currentTime);
        durationEl.textContent = convertSecondsToTime(duration);

        // Save position every 5 seconds
        if (Math.floor(currentTime) % 5 === 0) {
            localStorage.setItem('bhajan_index', player.getPlaylistIndex());
            localStorage.setItem('bhajan_time', Math.floor(currentTime));
        }
    }
}

// Start progress updates
function startProgressUpdates() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 100);
}

// Update play button icon
function updatePlayButton() {
    const icon = playBtn.querySelector('i');
    if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

// Play/Pause toggle
function togglePlay() {
    if (!player) return;
    
    if (isPlaying) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// Previous song
function prevSong() {
    if (!player) return;

    if (playbackMode === 'single') {
        player.seekTo(0, true);
        if (isPlaying) player.playVideo();
        return;
    }

    const targetIndex = getPlaybackTargetIndex(-1);
    if (typeof player.playVideoAt === 'function') {
        player.playVideoAt(targetIndex);
    } else {
        player.previousVideo();
    }

    setTimeout(() => {
        updateSongInfo();
        if (isPlaying) {
            player.playVideo();
        }
    }, 200);
}

// Next song
function nextSong() {
    if (!player) return;

    if (playbackMode === 'single') {
        player.seekTo(0, true);
        if (isPlaying) player.playVideo();
        return;
    }

    const targetIndex = getPlaybackTargetIndex(1);
    if (typeof player.playVideoAt === 'function') {
        player.playVideoAt(targetIndex);
    } else {
        player.nextVideo();
    }

    setTimeout(() => {
        updateSongInfo();
        if (isPlaying) {
            player.playVideo();
        }
    }, 200);
}

// Seek functionality
function seek(e) {
    if (!player || !player.getDuration) return;
    
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = player.getDuration();
    const seekTime = (clickX / width) * duration;
    
    player.seekTo(seekTime, true);
}

const sankhaSound = new Audio('sankha.m4a');

// Auto-play sankha sound while YouTube API loads
window.addEventListener('load', () => {
    sankhaSound.play().catch(() => {
        // Autoplay blocked — user hasn't interacted yet, play on first click
        const playOnFirstInteraction = () => {
            if (!player) { // Only if YouTube isn't ready yet
                sankhaSound.play().catch(() => {});
            }
            document.removeEventListener('click', playOnFirstInteraction);
            document.removeEventListener('touchstart', playOnFirstInteraction);
        };
        document.addEventListener('click', playOnFirstInteraction, { once: true });
        document.addEventListener('touchstart', playOnFirstInteraction, { once: true });
    });
});

function playSankhaSound() {
    if (!sankhaSound) return;

    const wasPlaying = isPlaying && player && typeof player.pauseVideo === 'function';

    // Pause music if playing
    if (wasPlaying) {
        player.pauseVideo();
    }

    sankhaSound.currentTime = 0;

    const playPromise = sankhaSound.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Sound started — wait for it to finish then resume
            sankhaSound.addEventListener('ended', function resumeMusic() {
                sankhaSound.removeEventListener('ended', resumeMusic);
                if (wasPlaying && player && typeof player.playVideo === 'function') {
                    player.playVideo();
                }
            }, { once: true });
        }).catch(() => {
            // Playback failed — resume music anyway
            if (wasPlaying && player && typeof player.playVideo === 'function') {
                player.playVideo();
            }
        });
    }
}

// Media Session API — enables background playback controls (lock screen, notification)
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: songTitle.textContent || 'प्रिमियम भजन',
        artist: songArtist.textContent || 'Premium Bhajan',
        album: 'प्रिमियम भजन',
        artwork: [{ src: albumArt.src, sizes: '512x512', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('play', () => {
        if (player) player.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        if (player) player.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
}

// Event listeners
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
        const nextMode = playbackMode === 'shuffle' ? 'order' : 'shuffle';
        changeMode(nextMode);
    });
}
if (soundTrigger) {
    soundTrigger.addEventListener('click', playSankhaSound);
}
progressBar.addEventListener('click', seek);

// Update time
function updateTime() {
    const timeEl = document.querySelector('.time');
    if (!timeEl) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    timeEl.textContent = `${hours}:${minutes} ${ampm}`;
}

function refreshClock() {
    updateTime();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
        updateTime();
        setInterval(updateTime, 60000);
    }, msUntilNextMinute);
}

updateTime();
refreshClock();
