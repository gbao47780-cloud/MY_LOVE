/* ===== CONFIG ===== */
const CONFIG = {
  herName: "Kim",
  myName: "Bảo",
  startDate: "2025-11-23", 
  siteUrl: window.location.href.split('#')[0],
  avatar: "",
  // Lyrics của bài "Only With You" từ Youtube đưa vào làm nội dung lá thư
  letter: "Every time you call my name\nThe world stands still, I feel the same\nIn your eyes I find my truth\nA love that blooms, forever you\n\nThrough quiet nights and skies of blue\nMy heart finds home in you...",
  photos: [], 
  catPhotos: [], 
  makeupFavorites: [],
  favorites: [],
  music: { 
    src: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", // Chỗ này sẽ đính kèm link thật ở phase âm thanh
    title: "Only With You", 
    artist: "Romantic Love Song", 
    cover: "", 
    youtubeId: "MN3_AnFLXcw" // ID bài hát bạn yêu cầu
  },
  voiceMessage: "", 
  places: [], 
  neonTexts: ["Anh yêu em"]
};

/* ===== UTILS ===== */
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function bindData() {
  $$('[data-bind]').forEach(el => {
    const key = el.getAttribute('data-bind');
    if (CONFIG[key]) el.textContent = CONFIG[key];
    if (key === 'startDateText') {
      const parts = CONFIG.startDate.split('-');
      el.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  });
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

// Tạo hạt bay lơ lửng cho nền sinh động hơn
function createParticles() {
  const bg = $('#bg-canvas');
  if (!bg) return;
  const colors = ['p-pink', 'p-blue'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('span');
    p.classList.add('particle', colors[Math.floor(Math.random() * colors.length)]);
    
    // Random vị trí, kích thước và tốc độ
    const size = Math.random() * 15 + 5;
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = Math.random() * 6 + 6;

    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${left}%`;
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;
    
    bg.appendChild(p);
  }
}

/* ===== AUDIO ===== */
const AudioFX = {
  ctx: null,
  bgm: $('#audio-music'),
  btnMusic: $('#btn-music'),
  isMuted: false,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.bgm.src && CONFIG.music.src) {
      this.bgm.src = CONFIG.music.src;
      this.bgm.volume = 0.5;
    }
  },

  async startMusic() {
    this.init();
    if (this.isMuted || !this.bgm.src) return;
    try {
      await this.bgm.play();
      this.btnMusic.setAttribute('aria-pressed', 'true');
    } catch (e) {
      console.log("Trình duyệt chặn autoplay.", e);
      this.btnMusic.setAttribute('aria-pressed', 'false');
    }
  },

  toggleMusic() {
    this.init();
    if (this.bgm.paused) {
      this.isMuted = false;
      this.startMusic();
    } else {
      this.bgm.pause();
      this.isMuted = true;
      this.btnMusic.setAttribute('aria-pressed', 'false');
    }
  },

  playSynth(type) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'meow') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }
};

/* ===== SCENE MANAGER ===== */
const Scenes = {
  current: 0,
  registry: {},
  isTransitioning: false,
  elTransition: $('#transition'),

  register(index, handlers) { this.registry[index] = handlers; },

  async go(index) {
    if (this.isTransitioning) return;
    const nextEl = $(`#scene-${index}`);
    if (!nextEl) return;

    this.isTransitioning = true;
    AudioFX.playSynth('pop');

    if (this.current !== index) {
      this.elTransition.classList.add('is-animating');
      await sleep(600);
    }

    const currEl = $(`#scene-${this.current}`);
    if (currEl && this.current !== index) {
      currEl.classList.remove('is-active');
      currEl.setAttribute('inert', '');
      currEl.setAttribute('aria-hidden', 'true');
      if (this.registry[this.current] && this.registry[this.current].leave) {
        this.registry[this.current].leave();
      }
    }

    nextEl.removeAttribute('inert');
    nextEl.setAttribute('aria-hidden', 'false');
    nextEl.classList.add('is-active');
    this.current = index;

    if (this.registry[index] && this.registry[index].enter) {
      this.registry[index].enter();
    }

    if (this.elTransition.classList.contains('is-animating')) {
      this.elTransition.style.transform = 'translateY(-100%)';
      await sleep(600);
      this.elTransition.classList.remove('is-animating');
      this.elTransition.style.transition = 'none';
      this.elTransition.style.transform = 'translateY(100%)';
      void this.elTransition.offsetWidth;
      this.elTransition.style.transition = 'transform 0.6s var(--ease-smooth)';
    }

    this.isTransitioning = false;
  }
};

/* ===== SCENE 0 ===== */
Scenes.register(0, {
  enter() {
    this.btn = $('#s0-start');
    this.onClick = () => {
      AudioFX.init();
      AudioFX.startMusic();
      AudioFX.playSynth('meow');
      Scenes.go(1);
    };
    this.btn.addEventListener('click', this.onClick);
  },
  leave() {
    if (this.btn) this.btn.removeEventListener('click', this.onClick);
  }
});

for (let i = 1; i <= 6; i++) { Scenes.register(i, { enter(){}, leave(){} }); }

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  bindData();
  createParticles(); // Bật hạt lơ lửng cho nền
  
  $('#btn-music').addEventListener('click', () => {
    AudioFX.toggleMusic();
    AudioFX.playSynth('pop');
  });

  $$('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      if (action === 'next') Scenes.go(Scenes.current + 1);
      else if (action === 'restart') Scenes.go(0);
    });
  });

  Scenes.registry[0].enter();
});
