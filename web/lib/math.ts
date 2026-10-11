export const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export function summarize(crop: { sales: number; costs: number[] }) {
  const expenses = crop.costs.reduce((a, b) => a + b, 0);
  return { expenses, profit: crop.sales - expenses, bars: crop.costs.map(value => value / Math.max(1, ...crop.costs) * 100) };
}
export function validateContact(raw: string): { ok: true; kind: 'email' | 'phone' } | { ok: false; message: string } {
  const value = raw.trim();
  if (!value) return { ok: false, message: 'Enter your email or phone number.' };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { ok: true, kind: 'email' };
  if (/^\+?[\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15) return { ok: true, kind: 'phone' };
  return { ok: false, message: 'Enter a valid email or a phone number with 10–15 digits.' };
}
export function isLocalPreview(loc: { protocol: string; hostname: string }) {
  return loc.protocol === 'file:' || ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(loc.hostname) || loc.hostname.endsWith('.localhost');
}
export function cardTransform(d: number, spacing: number) {
  const a = Math.min(Math.abs(d), 3);
  return { transform: `translateX(${(d * spacing).toFixed(1)}px) translateZ(${-a * 140}px) rotateY(${Math.max(-55, Math.min(55, -d * 20))}deg) scale(${1-a*.08})`, opacity: Math.abs(d) > 3.5 ? '0' : (1-a*.22).toFixed(3), filter: a < .05 ? 'none' : `blur(${a*2.5}px)`, z: String(100-Math.round(a*10)) };
}
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const c = hex.replace('#', '').match(/../g)!.map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
    return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  };
  const x = lum(a), y = lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
