// Music Player with YouTube Playlist Integration

// YouTube Playlist Configuration
// Your Premium Bhajan Playlist
const PLAYLIST_ID = "PLM74qOWImQUo";

let currentSongIndex = 0;
let isPlaying = false;
let player;
let progressInterval;
// Restore saved playback mode (shuffle/order) — defaults to 'order'
let playbackMode = localStorage.getItem('bhajan_mode') || 'order';
let shuffledOrder = [];
let _seekedOnLoad = false; // keep for safety, playerVars handle it natively now

// ── Inject YouTube IFrame API immediately — non-blocking dynamic script ────────
(function loadYouTubeAPI() {
    if (document.getElementById('yt-iframe-api')) return;
    const tag = document.createElement('script');
    tag.id  = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
})();
// ────────────────────────────────────────────────────────────────────────────

// ── Playlist Cache Helpers ──────────────────────────────────────────────────
// Saves the array of video IDs returned by player.getPlaylist()
function cachePlaylist(ids) {
    try { localStorage.setItem('bhajan_playlist', JSON.stringify(ids)); } catch (_) {}
}

// Returns cached playlist IDs array, or null if not available
function getCachedPlaylist() {
    try {
        const raw = localStorage.getItem('bhajan_playlist');
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

// Saves metadata for a specific playlist index
function cacheSongMeta(index, title, artist, videoId) {
    try {
        localStorage.setItem(`bhajan_song_${index}`, JSON.stringify({ title, artist, videoId }));
    } catch (_) {}
}

// Returns cached song metadata for an index, or null
function getCachedSongMeta(index) {
    try {
        const raw = localStorage.getItem(`bhajan_song_${index}`);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

// Immediately populate UI from cache (called before YT API is ready)
function restoreUIFromCache() {
    const savedIndex = parseInt(localStorage.getItem('bhajan_index') || '0');
    const meta = getCachedSongMeta(savedIndex);
    if (!meta) return;
    songTitle.textContent  = meta.title  || 'नया शुद्ध नेपाली भजन';
    songArtist.textContent = meta.artist || 'Bhajan';
    if (meta.videoId) albumArt.src = `https://img.youtube.com/vi/${meta.videoId}/mqdefault.jpg`;
}
// ────────────────────────────────────────────────────────────────────────────

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

// Restore cached UI immediately — before YouTube API loads
restoreUIFromCache();

// Restore playback mode button UI now that DOM elements exist
updatePlaybackModeButtons();

// YouTube IFrame API Ready
function onYouTubeIframeAPIReady() {
    // Read saved state once and pass directly as playerVars — zero extra round-trips
    const savedIndex = parseInt(localStorage.getItem('bhajan_index') || '0');
    const savedTime  = parseInt(localStorage.getItem('bhajan_time')  || '0');

    player = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
            'listType':      'playlist',
            'list':          PLAYLIST_ID,
            'index':         savedIndex,             // start at saved song natively
            'start':         savedTime > 5 ? savedTime : 0, // start at saved time natively
            'playsinline':   1,
            'controls':      0,
            'rel':           0,
            'showinfo':      0,
            'modestbranding':1,
            'autoplay':      1,
            'loop':          1,
            'origin':        window.location.origin,
            'enablejsapi':   1,
            'fs':            0
        },
        events: {
            'onReady':       onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': function(e) {
                console.error('YouTube Player Error:', e.data);
            }
        }
    });
}


// Player ready
function onPlayerReady(event) {
    startProgressUpdates();
    // index + start playerVars already put the player at the right song/time —
    // no playVideoAt() or seekTo() calls needed here.

    // Cache playlist IDs as soon as available — fast 80 ms poll, 5 s max
    const playlistCachePoller = setInterval(() => {
        if (!player || !player.getPlaylist) return;
        const ids = player.getPlaylist();
        if (ids && ids.length) {
            cachePlaylist(ids);
            clearInterval(playlistCachePoller);
        }
    }, 80);
    setTimeout(() => clearInterval(playlistCachePoller), 5000);
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
    // Use live playlist; fall back to cached playlist IDs if player not ready yet
    const livePlaylist = player && player.getPlaylist && player.getPlaylist();
    const playlist = livePlaylist || getCachedPlaylist();
    if (!playlist || !playlist.length) return 0;

    const total = playlist.length;

    if (!total) return 0;

    const currentIndex = player && player.getPlaylistIndex ? player.getPlaylistIndex() : parseInt(localStorage.getItem('bhajan_index') || '0');

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
    // Persist so it survives page close / browser switch
    try { localStorage.setItem('bhajan_mode', playbackMode); } catch (_) {}
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

        const targetIndex = getPlaybackTargetIndex(1);
        if (typeof player.playVideoAt === 'function') {
            player.playVideoAt(targetIndex);
        } else if (typeof player.nextVideo === 'function') {
            player.nextVideo();
        }
    } else if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayButton();
        updateSongInfo();
        startCDRotation();
        setupMediaSession();
        if (player.getPlaylistIndex) {
            localStorage.setItem('bhajan_index', player.getPlaylistIndex());
            localStorage.setItem('bhajan_time', '0');
        }

        // Seek to saved time — only on very first PLAYING event after load
        if (!_seekedOnLoad) {
            _seekedOnLoad = true;
            const savedTime = parseFloat(localStorage.getItem('bhajan_time') || '0');
            if (savedTime > 5) player.seekTo(savedTime, true);
        }

        // Fast poll for video metadata (fires quickly since we're already PLAYING)
        const infoPoller = setInterval(() => {
            if (!player || !player.getVideoData) { clearInterval(infoPoller); return; }
            const data = player.getVideoData();
            if (data && data.video_id && data.title && data.title !== '') {
                updateSongInfo();
                clearInterval(infoPoller);
            }
        }, 50);
        setTimeout(() => clearInterval(infoPoller), 5000);

    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayButton();
        stopCDRotation();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    } else if (event.data === YT.PlayerState.BUFFERING) {
        // Song is buffering/changing — poll for updated info
        const bufferPoller = setInterval(() => {
            if (!player || !player.getVideoData) { clearInterval(bufferPoller); return; }
            const data = player.getVideoData();
            if (data && data.video_id && data.title && data.title !== '') {
                updateSongInfo();
                clearInterval(bufferPoller);
            }
        }, 50);
        setTimeout(() => clearInterval(bufferPoller), 5000);
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
        let displayTitle = title;
        let displayArtist = author;

        // Parse title to separate song and artist if formatted as "Song - Artist"
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            displayTitle  = parts[0].trim();
            displayArtist = parts[1].trim();
        }

        songTitle.textContent  = displayTitle;
        songArtist.textContent = displayArtist;

        // Update album art
        albumArt.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        currentSongIndex = player.getPlaylistIndex();

        // Persist metadata so next page load shows it instantly
        cacheSongMeta(currentSongIndex, displayTitle, displayArtist, videoId);

        // Also refresh the playlist ID cache whenever we have a live playlist
        if (player.getPlaylist) {
            const ids = player.getPlaylist();
            if (ids && ids.length) cachePlaylist(ids);
        }
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
    // playVideo() called automatically via PLAYING state if already playing
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
    // playVideo() called automatically via PLAYING state if already playing
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
        artwork: [
            { src: albumArt.src, sizes: '96x96',   type: 'image/jpeg' },
            { src: albumArt.src, sizes: '128x128',  type: 'image/jpeg' },
            { src: albumArt.src, sizes: '256x256',  type: 'image/jpeg' },
            { src: albumArt.src, sizes: '512x512',  type: 'image/jpeg' }
        ]
    });

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.setActionHandler('play', () => {
        if (player) player.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        if (player) player.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
    navigator.mediaSession.setActionHandler('nexttrack',     () => nextSong());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (player && details.seekTime != null) player.seekTo(details.seekTime, true);
    });

    // Keep OS seek bar in sync
    try {
        const duration = player && player.getDuration ? player.getDuration() : 0;
        const position = player && player.getCurrentTime ? player.getCurrentTime() : 0;
        if (duration > 0) {
            navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position });
        }
    } catch (_) {}
}

// ── Background Audio Focus ─────────────────────────────────────────────────
// A tiny silent audio loop keeps the browser's audio session alive so
// Chrome on Android does not suspend the YouTube iframe when the screen locks.
(function initSilentAudioKeepAlive() {
    try {
        // Build a 1-second silent WAV as a data-URI (44 bytes header, no PCM data)
        const silentWav = 'data:audio/wav;base64,' +
            'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        const silent = new Audio(silentWav);
        silent.loop   = true;
        silent.volume = 0;       // completely inaudible
        // Start only after first user gesture (autoplay policy)
        const start = () => {
            silent.play().catch(() => {});
            document.removeEventListener('click',      start);
            document.removeEventListener('touchstart', start);
        };
        document.addEventListener('click',      start, { once: true });
        document.addEventListener('touchstart', start, { once: true });
    } catch (_) {}
})();

// Resume YouTube playback when the tab comes back to the foreground
// (handles Android Chrome backgrounding the tab or locking the screen)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPlaying && player) {
        // Give the iframe a moment to re-activate then ensure it's playing
        setTimeout(() => {
            try {
                if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
                    player.playVideo();
                }
                setupMediaSession(); // refresh OS controls with latest position
            } catch (_) {}
        }, 400);
    }
});
// ─────────────────────────────────────────────────────────────────────

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
