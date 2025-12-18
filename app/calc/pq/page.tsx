// app/calc/pq/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function PqCalc() {
  const [fund, setFund] = useState(100);
  const [h5, setH5] = useState(10);
  const [h7, setH7] = useState(5);

  const res = useMemo(() => {
    const thd = Math.sqrt(h5*h5 + h7*h7) / fund * 100;
    return { thd };
  }, [fund, h5, h7]);

  return (
    <CalcLayout title="전력품질(PQ) 계산">
      <NumberField label="기본파 RMS" value={fund} onChange={setFund} />
      <NumberField label="5차 고조파 RMS" value={h5} onChange={setH5} />
      <NumberField label="7차 고조파 RMS" value={h7} onChange={setH7} />

      <h3>결과</h3>
      <p>THD: {res.thd.toFixed(2)} %</p>
    </CalcLayout>
  );
}
