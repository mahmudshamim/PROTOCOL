// All sound is generated: no audio files.
export const audio = {
  ctx: null, sirenGain: null, engGain: null, engOsc: null, engOsc2: null, engFilter: null, noise: null,
  start() {
    if (this.ctx) return;
    const c = (this.ctx = new AudioContext());
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // wind
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    const g = c.createGain(); g.gain.value = 0.09; n.connect(f).connect(g).connect(c.destination); n.start();
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13; const lg = c.createGain(); lg.gain.value = 160; lfo.connect(lg).connect(f.frequency); lfo.start();
    // siren
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 520;
    const sl = c.createOscillator(); sl.frequency.value = 0.9; const sg = c.createGain(); sg.gain.value = 170; sl.connect(sg).connect(o.frequency); sl.start();
    const sf = c.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 1400;
    this.sirenGain = c.createGain(); this.sirenGain.gain.value = 0; o.connect(sf).connect(this.sirenGain).connect(c.destination); o.start();
    // engine
    this.engOsc = c.createOscillator(); this.engOsc.type = 'sawtooth';
    this.engOsc2 = c.createOscillator(); this.engOsc2.type = 'square';
    this.engFilter = c.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 500;
    this.engGain = c.createGain(); this.engGain.gain.value = 0;
    this.engOsc.connect(this.engFilter); this.engOsc2.connect(this.engFilter);
    this.engFilter.connect(this.engGain).connect(c.destination);
    this.engOsc.start(); this.engOsc2.start();
  },
  siren(on) { this.sirenLevel(on ? 1 : 0); },
  sirenLevel(v) { if (this.sirenGain) this.sirenGain.gain.setTargetAtTime(0.035 * v, this.ctx.currentTime, 0.2); },
  /** rpm 0..1, volume 0..1 (0 turns the engine off) */
  engine(rpm, vol) {
    if (!this.engGain) return;
    const t = this.ctx.currentTime, hz = 38 + rpm * 120;
    this.engOsc.frequency.setTargetAtTime(hz, t, 0.05); this.engOsc2.frequency.setTargetAtTime(hz * 0.5, t, 0.05);
    this.engFilter.frequency.setTargetAtTime(300 + rpm * 1400, t, 0.05);
    this.engGain.gain.setTargetAtTime(vol * 0.045, t, 0.1);
  },
  burst(dur = 0.2, vol = 0.2, cutoff = 1200) {
    if (!this.ctx) return;
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(0, Math.random()); s.stop(c.currentTime + dur);
  },
  /** Punch impact: a low thump plus a sharp smack. heavy = knockout blow. */
  punch(heavy = false) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(heavy ? 150 : 180, t); o.frequency.exponentialRampToValueAtTime(heavy ? 38 : 55, t + (heavy ? 0.22 : 0.12));
    g.gain.setValueAtTime(heavy ? 0.8 : 0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (heavy ? 0.3 : 0.16));
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.32);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), sg = c.createGain();
    s.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = heavy ? 1400 : 2200; f.Q.value = 0.8;
    sg.gain.setValueAtTime(heavy ? 0.5 : 0.35, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(f).connect(sg).connect(c.destination); s.start(t, Math.random()); s.stop(t + 0.08);
  },
  /** Fist cutting the air just before a punch lands. */
  whoosh() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(f).connect(g).connect(c.destination); s.start(t, Math.random()); s.stop(t + 0.13);
  },
  ping(freq, dur = 0.5, vol = 0.08) {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  },
};
