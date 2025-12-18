"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function FieldCalc() {
  // Temperature correction (resistor-like)
  const [value25, setValue25] = useState(100.0);
  const [tempC, setTempC] = useState(60);
  const [tcr, setTcr] = useState(200); // ppm/°C
  const refTemp = 25;

  // Wiring correction (loop resistance)
  const [current, setCurrent] = useState(10); // A
  const [lengthM, setLengthM] = useState(50); // m (one-way)
  const [wireRPerM, setWireRPerM] = useState(0.005); // Ω/m (one conductor)
  const [useLoop, setUseLoop] = useState(1); // 1=yes (two conductors loop)

  // Noise/SNR
  const [signalRms, setSignalRms] = useState(1.0);
  const [noiseRms, setNoiseRms] = useState(0.01);

  const res = useMemo(() => {
    const dT = tempC - refTemp;
    const corrected = value25 * (1 + (tcr * 1e-6) * dT);

    // wiring loop resistance: if loop, multiply by 2 conductors
    const loopFactor = useLoop ? 2 : 1;
    const rWire = lengthM * wireRPerM * loopFactor;
    const vDrop = current * rWire;

    // SNR
    const snr = (signalRms > 0 && noiseRms > 0) ? 20 * Math.log10(signalRms / noiseRms) : NaN;

    let wiringNote = "정상 범위";
    if (vDrop > 2) wiringNote = "전압강하 큼(배선 단축/굵기 증가 권장)";
    else if (vDrop > 0.5) wiringNote = "주의(전압강하 고려 필요)";

    let snrNote = "정상";
    if (Number.isFinite(snr)) {
      if (snr < 20) snrNote = "노이즈 과다(차폐/접지/필터 필요 가능)";
      else if (snr < 40) snrNote = "주의(환경 노이즈 영향 가능)";
    } else {
      snrNote = "SNR 계산 불가(입력 확인)";
    }

    return { corrected, rWire, vDrop, snr, wiringNote, snrNote };
  }, [value25, tempC, tcr, current, lengthM, wireRPerM, useLoop, signalRms, noiseRms]);

  return (
    <CalcLayout
      title="설치·현장 조건 보정 (온도+배선+노이즈)"
      desc="현장 실전에서 자주 발생하는 오차 요인(온도/배선저항/노이즈)을 보수적으로 수치화합니다."
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>온도 보정</h3>
          <NumberField label="기준 값(25°C)" value={value25} onChange={setValue25} />
          <NumberField label="온도" unit="°C" value={tempC} onChange={setTempC} />
          <NumberField label="TCR" unit="ppm/°C" value={tcr} onChange={setTcr} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>배선 보정</h3>
          <NumberField label="전류" unit="A" value={current} onChange={setCurrent} />
          <NumberField label="길이(편도)" unit="m" value={lengthM} onChange={setLengthM} />
          <NumberField label="선저항" unit="Ω/m" value={wireRPerM} step={0.0001} min={0} onChange={setWireRPerM} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>루프(왕복) 적용</label>
            <select value={useLoop ? "1" : "0"} onChange={(e) => setUseLoop(e.target.value === "1" ? 1 : 0)} style={{ padding: 8 }}>
              <option value="1">예(왕복 2도체)</option>
              <option value="0">아니오(단일 도체)</option>
            </select>
          </div>
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>노이즈/SNR</h3>
          <NumberField label="신호 RMS" value={signalRms} step={0.001} min={0} onChange={setSignalRms} />
          <NumberField label="노이즈 RMS" value={noiseRms} step={0.001} min={0} onChange={setNoiseRms} />
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <p><b>온도 보정 값</b>: {res.corrected.toFixed(6)}</p>

        <hr />

        <p><b>배선 저항(근사)</b>: {res.rWire.toFixed(6)} Ω</p>
        <p><b>전압강하(근사)</b>: {res.vDrop.toFixed(6)} V</p>
        <p><b>판정</b>: {res.wiringNote}</p>

        <hr />

        <p><b>SNR</b>: {Number.isFinite(res.snr) ? res.snr.toFixed(2) : "—"} dB</p>
        <p><b>판정</b>: {res.snrNote}</p>
      </div>
    </CalcLayout>
  );
}
