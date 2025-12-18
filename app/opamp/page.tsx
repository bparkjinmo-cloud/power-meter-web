'use client';

import { useState } from 'react';

export default function OpAmpPage() {
  const [vin, setVin] = useState(1);
  const [rf, setRf] = useState(10000);
  const [rin, setRin] = useState(1000);

  const gain = 1 + rf / rin;
  const vout = vin * gain;

  return (
    <div style={{ padding: 20 }}>
      <h1>OP-AMP 배율 계산</h1>

      <label>Vin (V)</label>
      <input type="number" value={vin} onChange={e => setVin(+e.target.value)} />

      <label>Rf (Ω)</label>
      <input type="number" value={rf} onChange={e => setRf(+e.target.value)} />

      <label>Rin (Ω)</label>
      <input type="number" value={rin} onChange={e => setRin(+e.target.value)} />

      <h3>Gain: {gain.toFixed(2)}</h3>
      <h3>Vout: {vout.toFixed(2)} V</h3>

      <ExplanationButton
        context={{
          vin, rf, rin, gain, vout,
          type: 'opamp'
        }}
      />
    </div>
  );
}
