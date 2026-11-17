/* Minimal in-memory Web Audio graph for Node tests. Only the calls AudioManager makes are modelled;
 * the cast isolates the fake from the DOM types used by the engine. */

export class FakeParam {
  value = 0;
  readonly events: { kind: string; value: number; time: number }[] = [];

  setValueAtTime(value: number, time: number): this {
    this.value = value;
    this.events.push({ kind: "set", value, time });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this.value = value;
    this.events.push({ kind: "linear", value, time });
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    this.value = value;
    this.events.push({ kind: "exponential", value, time });
    return this;
  }

  cancelScheduledValues(time: number): this {
    this.events.push({ kind: "cancel", value: 0, time });
    return this;
  }
}

export class FakeNode {
  readonly outputs: unknown[] = [];

  connect(destination: unknown): unknown {
    this.outputs.push(destination);
    return destination;
  }

  disconnect(): void {
    this.outputs.length = 0;
  }
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

export class FakeOscillator extends FakeNode {
  type = "sine";
  readonly frequency = new FakeParam();
  readonly started: number[] = [];
  readonly stopped: number[] = [];

  start(at = 0): void { this.started.push(at); }
  stop(at = 0): void { this.stopped.push(at); }
}

export class FakeBufferSource extends FakeNode {
  buffer: FakeBuffer | null = null;
  loop = false;
  readonly started: number[] = [];
  readonly stopped: number[] = [];

  start(at = 0): void { this.started.push(at); }
  stop(at = 0): void { this.stopped.push(at); }
}

export class FakeFilter extends FakeNode {
  type = "lowpass";
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

export class FakeBuffer {
  readonly data: Float32Array;

  constructor(readonly length: number, readonly sampleRate: number) {
    this.data = new Float32Array(length);
  }

  get duration(): number { return this.length / this.sampleRate; }
  getChannelData(channel: number): Float32Array {
    void channel; // fake buffer has a single channel
    return this.data;
  }
}

export class FakeAudioContext {
  currentTime = 0;
  state = "suspended";
  readonly sampleRate = 44100;
  readonly destination = new FakeNode();
  readonly gains: FakeGain[] = [];
  readonly oscillators: FakeOscillator[] = [];
  readonly sources: FakeBufferSource[] = [];
  readonly filters: FakeFilter[] = [];
  readonly buffers: FakeBuffer[] = [];
  resumeCalls = 0;
  closeCalls = 0;

  createGain(): FakeGain {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }

  createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }

  createBufferSource(): FakeBufferSource {
    const node = new FakeBufferSource();
    this.sources.push(node);
    return node;
  }

  createBiquadFilter(): FakeFilter {
    const node = new FakeFilter();
    this.filters.push(node);
    return node;
  }

  createBuffer(_channels: number, length: number, sampleRate: number): FakeBuffer {
    const buffer = new FakeBuffer(length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;
    this.state = "running";
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = "closed";
    return Promise.resolve();
  }
}

export function fakeContextFactory(context: FakeAudioContext): () => AudioContext | null {
  return () => context as unknown as AudioContext;
}
