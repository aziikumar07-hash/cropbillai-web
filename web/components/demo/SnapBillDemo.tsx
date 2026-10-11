'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { bills } from '../../lib/content';
import { formatINR } from '../../lib/math';
import { useReducedMotion } from '../../lib/useMedia';
import Reveal from '../Reveal';
import Tilt from '../Tilt';
export default function SnapBillDemo() {
  const [selected,setSelected]=useState(0),[url,setUrl]=useState(''),[scanning,setScanning]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined),objectURL=useRef(''),reduced=useReducedMotion();
  useEffect(() => () => { clearTimeout(timer.current); if (objectURL.current) URL.revokeObjectURL(objectURL.current); },[]);
  function scan(index: number,photo?: File) {
    clearTimeout(timer.current); if (objectURL.current) URL.revokeObjectURL(objectURL.current); objectURL.current='';
    setError(''); setSelected(index); setScanning(true); setStatus('Scanning preview…');
    if (photo) { objectURL.current=URL.createObjectURL(photo); setUrl(objectURL.current); } else setUrl('');
    timer.current=setTimeout(() => { setScanning(false); setStatus(photo ? 'Simulation finished. Your photo was not read or uploaded. In the app, AI would fill these fields.' : `Simulation result: ${bills[index].category} bill, ${formatINR(bills[index].amount)}, filed under ${bills[index].crop} · ${bills[index].season}.`); },reduced ? 0 : 1600);
  }
  function fail(message: string) { clearTimeout(timer.current); if (objectURL.current) URL.revokeObjectURL(objectURL.current); objectURL.current=''; setScanning(false); setUrl(''); setError(message); setStatus(message); }
  function file(photo?: File) {
    if (!photo) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(photo.type)) return fail('Please choose a JPG, PNG, WebP or GIF image.');
    if (photo.size > 15*1024*1024) return fail('That image is over 15 MB. Try a smaller photo.');
    scan(selected,photo);
  }
  const bill=bills[selected];
  return <section id="demo" className="section light-section"><Reveal><div className="section-top"><p className="eyebrow">01 — LESS PAPERWORK</p><span className="section-tag">A LITTLE PREVIEW OF WHAT’S NEXT</span></div><div className="section-heading"><h2>One photo.<br/><span className="serif">One less thing to remember.</span></h2><p>From a crumpled receipt to a clearer season.<br/>Try a sample bill. See how simple it could feel.</p></div></Reveal>
    <div className="demo-grid"><div><div className="bill-samples" role="group" aria-label="Sample bills">{bills.map((b,i) => <Tilt key={b.id}><button className="receipt" aria-pressed={!url && selected === i} onClick={() => scan(i)}><span className="receipt-top">SAMPLE RECEIPT <span>↗</span></span><strong>{b.label}</strong><span>{b.crop} · {b.season}</span><b>{formatINR(b.amount)}</b><span className="receipt-barcode" aria-hidden="true"/></button></Tilt>)}</div><div className="dropzone" onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); file(e.dataTransfer.files[0]); }}><input id="bill-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e: ChangeEvent<HTMLInputElement>) => file(e.target.files?.[0])}/><label htmlFor="bill-file" className="button button-outline">Choose a photo <span>＋</span></label><p>or drop an image here</p></div><p className="privacy-note">↳ Your photo stays on this device. It’s shown only here and is never uploaded.</p><p id="bill-error" className="field-error">{error}</p></div>
    <div className={`demo-preview ${scanning ? 'is-scanning' : ''}`}><div className="preview-header"><span className="live-dot"/> CROPBILLAI / BILL PREVIEW <span>✦</span></div><div className="scan-paper">{url ? <img src={url} alt="Your bill photo (preview only)" onError={() => fail("This image can't be previewed in your browser.")}/> : <><p>{bill.vendor}</p><span className="paper-rule"/><h3>{bill.label}</h3><p>{bill.crop} / {bill.season} season</p><strong>{formatINR(bill.amount)}</strong><span className="paper-rule"/><p>Thank you. Here’s to a good harvest.</p></>}<div className="scan-line"/></div><div className="result-card" aria-busy={scanning}><div className="result-label"><span>✦ {scanning ? 'SCANNING PREVIEW' : 'A PLACE FOR EVERY DETAIL'}</span><span>↗</span></div><dl>{['Vendor','Amount','Category','Crop','Season'].map((label,i) => <div key={label}><dt>{label}</dt><dd>{url ? (i < 2 ? 'Not read in this preview' : 'Suggested by AI in the app') : [bill.vendor,formatINR(bill.amount),bill.category,bill.crop,bill.season][i]}</dd></div>)}</dl></div><p className="simulation-note">Simulation. No AI is running in this preview.</p></div></div><p role="status" aria-live="polite" className="sr-only">{status}</p>
  </section>;
}
