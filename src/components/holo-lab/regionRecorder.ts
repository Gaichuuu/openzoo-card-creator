export interface Recording {
  blob: Blob;
  extension: 'mp4' | 'webm';
}

interface CropTargetApi { fromElement(el: Element): Promise<unknown> }
type CroppableTrack = MediaStreamTrack & { cropTo(target: unknown): Promise<void> };

const MIME_TYPES = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
const SETTLE_MS = 500;
const CAPTURE_LAG_MS = 40;

export function canRecordRegion(): boolean {
  return 'CropTarget' in window && !!navigator.mediaDevices?.getDisplayMedia;
}

export async function recordRegion(el: HTMLElement, durationMs: number, frame: (t: number) => void, fps = 60): Promise<Recording> {
  const cropApi = (window as unknown as { CropTarget?: CropTargetApi }).CropTarget;
  if (!cropApi) throw new Error('This browser cannot record part of a tab (needs Chrome region capture)');
  const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) throw new Error('This browser cannot record video');

  frame(-SETTLE_MS / durationMs);
  const target = await cropApi.fromElement(el);
  const box = el.getBoundingClientRect();
  const width = Math.round(box.width * devicePixelRatio);
  const height = Math.round(box.height * devicePixelRatio);
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: fps, width: { ideal: width, max: width }, height: { ideal: height, max: height } },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
  } as DisplayMediaStreamOptions);
  const [track] = stream.getVideoTracks() as CroppableTrack[];
  try {
    await track.cropTo(target);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Share this tab (not another tab or window) to record the gallery viewer');
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
  try {
    const start = performance.now() + SETTLE_MS;
    const end = 1 + CAPTURE_LAG_MS / durationMs;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = (performance.now() - start) / durationMs;
        if (t >= end) {
          resolve();
          return;
        }
        if (t >= 0 && recorder.state === 'inactive') recorder.start();
        frame(t);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (recorder.state === 'inactive') throw new Error('Recording was interrupted. Keep this tab in front while it records.');
    recorder.stop();
    await stopped;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
  return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), extension: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm' };
}
