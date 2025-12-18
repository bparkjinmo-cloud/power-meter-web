// app/calc/power/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function PowerCalc() {
  const [vrms, setVrms] = useState(220);
  const [irms, setIrms] = useState(10);
  const [pf, setPf] = useState(0.9);
  const [hours, setHours] = useState(24);

  const res = useMemo(() => {
    const s = vrms * irms;
    const p = s * pf;
    const q = Math.sqrt(s * s - p * p);
    const energy = (p * hours) / 1000;
    return { p, q, s, energy };
  }, [vrms, irms, pf, hours]);

  return (
    <CalcLayout title="전력 / 에너지 계산">
      <NumberField label="전압 RMS" unit="V" value={vrms} onChange={setVrms} />
      <NumberField label="전류 RMS" unit="A" value={irms} onChange={setIrms} />
      <NumberField label="역률" value={pf} step={0.01} onChange={setPf} />
      <NumberField label="사용 시간" unit="h" value={hours} onChange={setHours} />

      <h3>결과</h3>
      <p>유효전력 P: {res.p.toFixed(2)} W</p>
      <p>무효전력 Q: {res.q.toFixed(2)} var</p>
      <p>피상전력 S: {res.s.toFixed(2)} VA</p>
      <p>에너지: {res.energy.toFixed(3)} kWh</p>
    </CalcLayout>
  );
}
