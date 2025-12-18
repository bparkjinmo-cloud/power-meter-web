"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

type Mode = "non_inverting" | "inverting";

export default function OpampPage() {
  const [mode, setMode] = useState<Mode>("non_inverting");
  const [rin, setRin] = useState<number>(10000); // Ω
  const [rf, setRf] = useState<number>(100000);  // Ω

  const result = useMemo(() => {
    let gain: number;
    if (rin <= 0 || rf < 0) {
      return { gain: NaN, note: "Rin은 0보다 커야 합니다." };
    }

    if (mode === "non_inverting") {
      gain = 1 + rf / rin;
      return { gain, note: "비반전: Av = 1 + Rf/Rin" };
    }

    gain = -rf / rin;
    return { gain, note: "반전: Av = -Rf/Rin" };
  }, [mode, rin, rf]);

  return (
    <CalcLayout title="OPAMP 배율 계산" desc="비반전/반전 기본 이득을 계산합니다.">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>구성</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ padding: 8 }}>
              <option value="non_inverting">비반전(Non-inverting)</option>
              <option value="inverting">반전(Inverting)</option>
            </select>
          </div>

          <NumberField label="Rin" unit="Ω" value={rin} min={1} step={100} onChange={setRin} />
          <NumberField label="Rf" unit="Ω" value={rf} min={0} step={100} onChange={setRf} />
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>결과</h2>
          <p><b>Gain (Av)</b>: {Number.isFinite(result.gain) ? result.gain.toFixed(4) : "—"}</p>
          <p style={{ color: "#555" }}>{result.note}</p>
        </div>
      </div>
    </CalcLayout>
  );
}
