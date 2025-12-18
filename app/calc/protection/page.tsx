// app/calc/protection/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function ProtectionCalc() {
  const [rated, setRated] = useState(100);
  const [load, setLoad] = useState(80);
  const [trip, setTrip] = useState(120);

  const res = useMemo(() => {
    const margin = ((trip - load) / load) * 100;
    return {
      margin,
      risk: load > trip ? "즉시 트립 위험" :
            margin < 10 ? "오동작 위험" : "정상",
    };
  }, [rated, load, trip]);

  return (
    <CalcLayout title="보호·임계값·마진 계산">
      <NumberField label="정격 전류" unit="A" value={rated} onChange={setRated} />
      <NumberField label="부하 전류" unit="A" value={load} onChange={setLoad} />
      <NumberField label="트립 설정 전류" unit="A" value={trip} onChange={setTrip} />

      <h3>결과</h3>
      <p>여유율: {res.margin.toFixed(2)} %</p>
      <p>판단: {res.risk}</p>
    </CalcLayout>
  );
}
