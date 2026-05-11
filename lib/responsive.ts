export function isMobileFromUA(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return /Mobile|Android|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua);
}

export const MOBILE_BREAKPOINT_PX = 640;
