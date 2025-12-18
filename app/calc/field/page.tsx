// app/calc/field/page.tsx
"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function FieldCalc() {
  const [value, setValue] = useState(100);
  const [temp, setTemp] = useState(60);
  const [tcr, setTcr] = useState(200); // ppm/°C
  const [refTemp] = useState(25);

  const res = useMemo(() => {
    const delta = temp - refTemp;
    const corr = value * (1 + tcr * 1e-6 * delta);
    return { corr };
  }, [value, temp, tcr, refTemp]);

  return (
    <CalcLayout title="설치·현장 조건 보정">
      <NumberField label="기준 값" value={value} onChange={setValue} />
      <NumberField label="온도" unit="°C" value={temp} onChange={setTemp} />
      <NumberField label="TCR" unit="ppm/°C" value={tcr} onChange={setTcr} />

      <h3>결과</h3>
      <p>보정된 값: {res.corr.toFixed(3)}</p>
    </CalcLayout>
  );
}
