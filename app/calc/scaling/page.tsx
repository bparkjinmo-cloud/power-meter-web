// app/calc/scaling/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function ScalingCalc() {
  const [vin, setVin] = useState(220);
  const [r1, setR1] = useState(100000);
  const [r2, setR2] = useState(1000);
  const [gain, setGain] = useState(1);
  const [vref, setVref] = useState(3.3);
  const [bits, setBits] = useState(12);

  const res = useMemo(() => {
    const vdiv = vin * r2 / (r1 + r2);
    const vamp = vdiv * gain;
    const maxCode = Math.pow(2, bits) - 1;
    const adc = Math.round((vamp / vref) * maxCode);
    return {
      vdiv,
      vamp,
      adc,
      over: vamp > vref,
    };
  }, [vin, r1, r2, gain, vref, bits]);

  return (
    <CalcLayout title="전류·전압 계측 스케일링">
      <NumberField label="입력 전압" unit="V" value={vin} onChange={setVin} />
      <NumberField label="R1" unit="Ω" value={r1} onChange={setR1} />
      <NumberField label="R2" unit="Ω" value={r2} onChange={setR2} />
      <NumberField label="증폭 이득" value={gain} onChange={setGain} />
      <NumberField label="ADC 기준전압" unit="V" value={vref} onChange={setVref} />
      <NumberField label="ADC 비트수" value={bits} onChange={setBits} />

      <h3>결과</h3>
      <p>분압 전압: {res.vdiv.toFixed(3)} V</p>
      <p>증폭 후 전압: {res.vamp.toFixed(3)} V</p>
      <p>ADC 코드: {res.adc}</p>
      {res.over && <p style={{ color: "red" }}>⚠ ADC 입력 범위 초과</p>}
    </CalcLayout>
  );
}
