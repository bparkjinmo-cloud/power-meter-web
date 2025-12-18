// app/calc/ct/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function CtCalc() {
  const [ip, setIp] = useState(100);   // 1차 전류
  const [ratioP, setRatioP] = useState(100);
  const [ratioS, setRatioS] = useState(5);
  const [burden, setBurden] = useState(10); // Ω
  const [ratedVA, setRatedVA] = useState(5);

  const res = useMemo(() => {
    const isec = ip * (ratioS / ratioP);
    const vout = isec * burden;
    const va = vout * isec;
    return {
      isec,
      vout,
      va,
      saturated: va > ratedVA,
    };
  }, [ip, ratioP, ratioS, burden, ratedVA]);

  return (
    <CalcLayout title="CT 계산">
      <NumberField label="1차 전류" unit="A" value={ip} onChange={setIp} />
      <NumberField label="CT 1차 정격" unit="A" value={ratioP} onChange={setRatioP} />
      <NumberField label="CT 2차 정격" unit="A" value={ratioS} onChange={setRatioS} />
      <NumberField label="Burden 저항" unit="Ω" value={burden} onChange={setBurden} />
      <NumberField label="CT 정격 VA" unit="VA" value={ratedVA} onChange={setRatedVA} />

      <h3>결과</h3>
      <p>2차 전류: {res.isec.toFixed(3)} A</p>
      <p>Burden 전압: {res.vout.toFixed(3)} V</p>
      <p>부하 VA: {res.va.toFixed(3)} VA</p>
      {res.saturated && <p style={{ color: "red" }}>⚠ CT 포화 위험</p>}
    </CalcLayout>
  );
}
