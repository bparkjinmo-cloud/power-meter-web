'use client';

import { useState } from 'react';

export default function Home() {
  const [vin, setVin] = useState(10);
  const [r1, setR1] = useState(1000);
  const [r2, setR2] = useState(1000);

  const vout = vin * r2 / (r1 + r2);

  return (
    <div style={{ padding: 20 }}>
      <h1>분압 회로 계산기</h1>

      <div>
        <label>Vin (V): </label>
        <input type="number" value={vin} onChange={e => setVin(Number(e.target.value))} />
      </div>

      <div>
        <label>R1 (Ω): </label>
        <input type="number" value={r1} onChange={e => setR1(Number(e.target.value))} />
      </div>

      <div>
        <label>R2 (Ω): </label>
        <input type="number" value={r2} onChange={e => setR2(Number(e.target.value))} />
      </div>

      <h2>Vout = {vout.toFixed(2)} V</h2>
    </div>
  );
}
