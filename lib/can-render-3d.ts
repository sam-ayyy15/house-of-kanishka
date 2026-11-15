/** Can this device and visitor have a live 3D scene? WebGL2 present, no Save-Data, not a very small device. */
export function canRender3d(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory && nav.deviceMemory <= 2) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
