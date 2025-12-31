(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const GRADES = {
    초등: [1, 2, 3, 4, 5, 6],
    중등: [1, 2, 3],
  };

  const TRACK_REGISTRY = {
    '중등1-1': [{ title: '피타고라스1', jsonFile: '피타고라스1.json' }],
    '중등2-1': [{ title: '곱셈공식', jsonFile: '곱셈공식.json' }],
    '중등3-1': [{ title: '근의공식', jsonFile: '근의공식.json' }],
  };

  const els = {
    container: $('mv-container'),
    audio: $('audio-player'),
    playBtn: $('play-btn'),
    prevBtn: $('prev-btn'),
    nextBtn: $('next-btn'),
    songSelect: $('song-select'),
    loadSongBtn: $('load-song-btn'),
    trackTitle: $('track-title'),
    trackArtist: $('track-artist'),
    barTrackName: $('bar-track-name'),
    barTrackGrade: $('bar-track-grade'),
    lyrics: $('lyrics-display'),
    math: $('math-display'),
    progressContainer: $('progress-container'),
    progressBar: $('progress-bar'),
    timeCurrent: $('time-current'),
    timeDuration: $('time-duration'),
    gradeButtons: $('grade-buttons'),
    semesterButtons: $('semester-buttons'),
    navPanel: $('nav-panel'),
    toggleBtn: $('toggle-btn'),
    volumeContainer: $('volume-container'),
    volumeBar: $('volume-bar'),
    muteBtn: $('mute-btn'),
    maxVolumeBtn: $('max-volume-btn'),
    recordCard: $('record-card'),
    flipHint: $('flip-hint'),
    playerMeta: document.querySelector('.player-meta'),
  };

  const state = {
    isPlaying: false,
    rafId: null,
    currentIdx: -1,
    slides: [],
    songData: null,
    school: '초등',
    grade: 1,
    semester: 1,
    navOpen: false,
    currentTrackIndex: 0,
  };

  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '--:--';
    const m = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  function animateEnter(el) {
    el.classList.remove('enter');
    void el.offsetWidth;
    el.classList.add('enter');
  }

  function animatePop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function resetDisplay() {
    els.lyrics.textContent = '준비 완료!\n곡을 선택하고 재생하세요.';
    els.math.innerHTML =
      '<span class="placeholder">수식이 여기에 표시됩니다</span>';
    els.math.classList.remove('active');
    state.currentIdx = -1;
  }

  function setPlayButtonUI(isPlaying) {
    const playIcon = document.getElementById('play-icon');
    if (playIcon) {
      playIcon.setAttribute(
        'icon',
        isPlaying ? 'solar:pause-bold' : 'solar:play-bold'
      );
    }
    els.container?.classList.toggle('is-playing', isPlaying);
  }

  function updateNowPlaying() {
    const title = state.songData?.title || '음원 미선택';
    const artist = state.songData
      ? `${state.songData.artist} · ${state.songData.grade}`
      : '곡을 선택해주세요';
    els.trackTitle.textContent = title;
    els.trackArtist.textContent = artist;
    els.barTrackName.textContent = title;
    els.barTrackGrade.textContent =
      state.songData?.grade || '곡을 선택해주세요';
  }

  function updateTimeReadout() {
    els.timeCurrent.textContent = fmtTime(els.audio.currentTime);
    els.timeDuration.textContent = fmtTime(els.audio.duration);
  }

  function updateVolumeBar() {
    const vol = els.audio.volume;
    els.volumeBar.style.width = `${vol * 100}%`;
  }

  function renderMathLatex(latex) {
    try {
      if (window.katex && latex) {
        katex.render(latex, els.math, {
          throwOnError: false,
          displayMode: true,
          strict: 'ignore',
        });
        return;
      }
    } catch (e) {
      console.warn('KaTeX render failed:', e);
    }
    els.math.textContent = latex || '';
  }

  function renderSlide(slide) {
    els.lyrics.textContent = slide.text;
    animateEnter(els.lyrics);

    if (slide.mathLatex) {
      renderMathLatex(slide.mathLatex);
      els.math.classList.add('active');
      animateEnter(els.math);
    } else {
      els.math.innerHTML =
        '<span class="placeholder">수식이 여기에 표시됩니다</span>';
      els.math.classList.remove('active');
    }
  }

  function getActiveSlideIndex(audioTime) {
    for (let i = state.slides.length - 1; i >= 0; i--) {
      if (audioTime >= state.slides[i].time) return i;
    }
    return -1;
  }

  function updateContent(audioTime) {
    const active = getActiveSlideIndex(audioTime);
    if (active !== -1 && active !== state.currentIdx) {
      state.currentIdx = active;
      renderSlide(state.slides[state.currentIdx]);
    }
  }

  function updateProgressBar(currentTime, duration) {
    if (Number.isFinite(duration) && duration > 0) {
      els.progressBar.style.width = `${((currentTime / duration) * 100).toFixed(
        2
      )}%`;
    } else {
      els.progressBar.style.width = '0%';
    }
  }

  function tick() {
    if (!state.isPlaying) return;
    updateProgressBar(els.audio.currentTime, els.audio.duration);
    updateContent(els.audio.currentTime);
    updateTimeReadout();
    if (els.audio.ended) {
      stop();
      return;
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(tick);
  }

  function pause() {
    els.audio.pause();
    state.isPlaying = false;
    setPlayButtonUI(false);
    if (state.rafId) cancelAnimationFrame(state.rafId);
  }

  function stop() {
    pause();
    els.audio.currentTime = 0;
    els.progressBar.style.width = '0%';
    resetDisplay();
    updateTimeReadout();
  }

  function play() {
    // 음원이 선택되지 않았으면 재생하지 않음
    if (
      !state.songData ||
      !els.audio.src ||
      els.audio.src === window.location.href
    ) {
      return;
    }

    const p = els.audio.play();
    const onPlay = () => {
      state.isPlaying = true;
      setPlayButtonUI(true);
      startLoop();
    };
    if (p?.then) {
      p.then(onPlay).catch((e) => {
        console.error('Play failed:', e);
      });
    } else {
      onPlay();
    }
  }

  function togglePlayPause() {
    state.isPlaying ? pause() : play();
  }

  function seekTo(newTime) {
    els.audio.currentTime = newTime;
    updateProgressBar(newTime, els.audio.duration);
    updateContent(newTime);
    updateTimeReadout();
  }

  async function fetchSongData(grade, jsonFile) {
    try {
      // Explicitly encode components for Korean path support
      const encodedGrade = encodeURIComponent(grade);
      const encodedFile = encodeURIComponent(jsonFile);
      const url = `music/${encodedGrade}/${encodedFile}`;
      console.log('Fetching song data:', url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('Failed to load song:', e);
      return null;
    }
  }

  function getFullGrade() {
    return `${state.school}${state.grade}-${state.semester}`;
  }

  function getCurrentTracks() {
    return TRACK_REGISTRY[getFullGrade()] || [];
  }

  async function loadTrack(track, trackIndex = 0) {
    if (!track) {
      state.songData = null;
      state.slides = [];
      els.audio.src = '';
      state.currentTrackIndex = 0;
      updateNowPlaying();
      resetDisplay();

      // 음원 미선택시 재생 버튼 비활성화
      els.playBtn.disabled = true;
      return;
    }

    state.currentTrackIndex = trackIndex;
    const fullGrade = getFullGrade();
    const songData = await fetchSongData(fullGrade, track.jsonFile);

    if (songData) {
      state.songData = songData;
      state.slides = songData.slides || [];

      const encodedGrade = encodeURIComponent(fullGrade);
      const encodedAudio = encodeURIComponent(songData.audioFile);
      els.audio.src = `music/${encodedGrade}/${encodedAudio}`;

      // 음원 로드 성공시 재생 버튼 활성화
      els.playBtn.disabled = false;
    } else {
      state.songData = null;
      state.slides = [];
      els.audio.src = '';
      els.playBtn.disabled = true;
    }

    els.audio.load();
    updateNowPlaying();
    stop();
  }

  function updateSongOptions() {
    const tracks = getCurrentTracks();
    els.songSelect.innerHTML = '';

    if (tracks.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '준비 중...';
      els.songSelect.appendChild(opt);
      // Only disable the load button - don't stop current playback
      if (els.loadSongBtn) els.loadSongBtn.disabled = true;
      return;
    }

    tracks.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = t.title;
      els.songSelect.appendChild(opt);
    });

    // Enable load song button when tracks exist
    if (els.loadSongBtn) els.loadSongBtn.disabled = false;
    // Don't auto-load the first track, wait for user to click play button
  }

  // Get all available tracks across all grades
  function getAllAvailableTracks() {
    const allTracks = [];
    for (const [gradeKey, tracks] of Object.entries(TRACK_REGISTRY)) {
      tracks.forEach((track, idx) => {
        allTracks.push({
          ...track,
          gradeKey,
          originalIndex: idx,
        });
      });
    }
    return allTracks;
  }

  // Find current track in all available tracks
  function getCurrentGlobalTrackIndex() {
    const allTracks = getAllAvailableTracks();
    const currentGradeKey = getFullGrade();
    return allTracks.findIndex(
      (t) =>
        t.gradeKey === currentGradeKey &&
        t.originalIndex === state.currentTrackIndex
    );
  }

  // Load track by global index
  async function loadTrackByGlobalIndex(globalIndex) {
    const allTracks = getAllAvailableTracks();
    if (allTracks.length === 0) return;

    // Wrap around
    if (globalIndex < 0) globalIndex = allTracks.length - 1;
    if (globalIndex >= allTracks.length) globalIndex = 0;

    const track = allTracks[globalIndex];

    // Parse gradeKey to update state (e.g., "중등1-1")
    const match = track.gradeKey.match(/^(초등|중등)(\d)-(\d)$/);
    if (match) {
      state.school = match[1];
      state.grade = Number(match[2]);
      state.semester = Number(match[3]);

      // Update UI to reflect new selection
      document
        .querySelectorAll('.nav-tab')
        .forEach((t) =>
          t.classList.toggle('active', t.dataset.school === state.school)
        );
      renderGradeButtons();
      updateSongOptions();

      // Set the song select value
      els.songSelect.value = String(track.originalIndex);
    }

    await loadTrack(track, track.originalIndex);
  }

  function playPrevTrack() {
    // If current time is 1 second or more, restart current track
    if (els.audio.currentTime >= 1) {
      els.audio.currentTime = 0;
      if (!state.isPlaying) play();
      return;
    }

    // Otherwise, go to previous track
    const allTracks = getAllAvailableTracks();
    if (allTracks.length === 0) return;

    const currentGlobalIdx = getCurrentGlobalTrackIndex();
    const newGlobalIdx =
      currentGlobalIdx <= 0 ? allTracks.length - 1 : currentGlobalIdx - 1;

    loadTrackByGlobalIndex(newGlobalIdx).then(() => {
      play();
    });
  }

  function playNextTrack() {
    const allTracks = getAllAvailableTracks();
    if (allTracks.length === 0) return;

    const currentGlobalIdx = getCurrentGlobalTrackIndex();
    const newGlobalIdx =
      currentGlobalIdx < 0 || currentGlobalIdx >= allTracks.length - 1
        ? 0
        : currentGlobalIdx + 1;

    loadTrackByGlobalIndex(newGlobalIdx).then(() => {
      play();
    });
  }

  function renderGradeButtons() {
    const grades = GRADES[state.school] || [];
    els.gradeButtons.innerHTML = '';

    grades.forEach((g) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (g === state.grade ? ' active' : '');
      btn.dataset.grade = g;
      btn.textContent = `${g}학년`;
      btn.addEventListener('click', () => {
        state.grade = g;
        document
          .querySelectorAll('#grade-buttons .filter-btn')
          .forEach((b) =>
            b.classList.toggle('active', Number(b.dataset.grade) === g)
          );
        updateSongOptions();
      });
      els.gradeButtons.appendChild(btn);
    });
  }

  function toggleNavPanel() {
    state.navOpen = !state.navOpen;
    els.navPanel.classList.toggle('visible', state.navOpen);
    els.toggleBtn.classList.toggle('expanded', state.navOpen);
  }

  function handleKeydown(e) {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'SELECT'
    )
      return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        playPrevTrack();
        break;
      case 'ArrowRight':
        e.preventDefault();
        playNextTrack();
        break;
    }
  }

  function init() {
    resetDisplay();
    setPlayButtonUI(false);
    updateTimeReadout();
    updateVolumeBar();

    // Initial disabled state
    els.playBtn.disabled = true;

    // Toggle nav panel
    els.toggleBtn.addEventListener('click', toggleNavPanel);

    // Player meta click - toggle nav panel
    if (els.playerMeta) {
      els.playerMeta.style.cursor = 'pointer';
      els.playerMeta.addEventListener('click', () => {
        toggleNavPanel();
      });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (
        state.navOpen &&
        !els.navPanel.contains(e.target) &&
        !els.toggleBtn.contains(e.target) &&
        !(els.playerMeta && els.playerMeta.contains(e.target))
      ) {
        toggleNavPanel();
      }
    });

    // School tabs
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document
          .querySelectorAll('.nav-tab')
          .forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.school = tab.dataset.school;
        state.grade = 1;
        renderGradeButtons();
        updateSongOptions();
      });
    });

    // Semester buttons
    document
      .querySelectorAll('#semester-buttons .filter-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          document
            .querySelectorAll('#semester-buttons .filter-btn')
            .forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.semester = Number(btn.dataset.semester);
          updateSongOptions();
        });
      });

    // Song select - don't auto-load on change, wait for play button
    // Load song button in nav panel
    if (els.loadSongBtn) {
      els.loadSongBtn.addEventListener('click', () => {
        const tracks = getCurrentTracks();
        const idx = Number(els.songSelect.value);
        if (tracks[idx]) {
          loadTrack(tracks[idx], idx).then(() => {
            play();
            // Close nav panel after starting playback
            if (state.navOpen) toggleNavPanel();
          });
        }
      });
    }

    // Player controls
    els.audio.addEventListener('timeupdate', updateTimeReadout);
    els.audio.addEventListener('ended', playNextTrack);
    els.playBtn.addEventListener('click', togglePlayPause);
    els.prevBtn.addEventListener('click', playPrevTrack);
    els.nextBtn.addEventListener('click', playNextTrack);

    els.progressContainer.addEventListener('click', (e) => {
      const dur = els.audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const rect = els.progressContainer.getBoundingClientRect();
      seekTo(
        Math.max(0, Math.min(dur, ((e.clientX - rect.left) / rect.width) * dur))
      );
    });

    // Volume control
    els.volumeContainer.addEventListener('click', (e) => {
      const rect = els.volumeContainer.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      els.audio.volume = ratio;
      updateVolumeBar();
    });

    // Mute button
    els.muteBtn.addEventListener('click', () => {
      els.audio.volume = 0;
      updateVolumeBar();
    });

    // Flip interaction with dark mode toggle
    if (els.recordCard) {
      els.recordCard.addEventListener('click', () => {
        els.recordCard.classList.toggle('flipped');
        document.body.classList.toggle('dark-mode');
      });
    }

    // Flip hint click handler
    if (els.flipHint) {
      els.flipHint.addEventListener('click', () => {
        if (els.recordCard) {
          els.recordCard.classList.toggle('flipped');
          document.body.classList.toggle('dark-mode');
        }
      });
    }

    // Max volume button
    els.maxVolumeBtn.addEventListener('click', () => {
      els.audio.volume = 1;
      updateVolumeBar();
    });

    document.addEventListener('keydown', handleKeydown);

    renderGradeButtons();
    updateSongOptions();
  }

  init();
})();
