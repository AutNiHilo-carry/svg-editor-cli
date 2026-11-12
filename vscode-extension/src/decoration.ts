/** UI-only policy: badge files whose path ends in .svg (case-insensitive). */
export function isSvgPath(path: string): boolean {
  return path.toLowerCase().endsWith('.svg');
}
