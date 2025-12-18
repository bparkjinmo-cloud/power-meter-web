"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

function clampNumber(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

export default function ScalingCalc() {
  // Nominal
  const [vin, setVin] = useState(220);
  const [r1, setR1] = useState(100000);
  const [r2, setR2] = useState(1000);
  const [gain, setGain] = useState(1);

  // Tolerance (percent)
  const [r1Tol, setR1Tol] = useState(1);   // %
  const [r2Tol, setR2Tol] = useState(1);   // %
  const [gainTol, setGainTol] = useState(0.5); // %

  // Temperature model for resistors (ppm/°C referenced to 25°C)
  const [tempC, setTempC] = useState(25);
  const [tcrR1, setTcrR1] = useState(50); // ppm/°C
  const [tcrR2, setTcrR2] = useState(50); // ppm/°C

  // ADC / Vref
  const [vref, setVref] = useState(3.3);
  const [vrefTol, setVrefTol] = useState(0.5); // %
  const [bits, setBits] = useState(12);
  const [adcInlLsb, setAdcInlLsb] = useState(2); // INL worst in LSB (datasheet)
  const [adcNoiseLsb, setAdcNoiseLsb] = useState(0.5); // effective noise / quantization margin in LSB

  const res = useMemo(() => {
    let deltaT: number;
    let r1Temp: number;
    let r2Temp: number;
    let vDivNom: number;
    let vAmpNom: number;

    let maxCode: number;
    let codeNom: number;

    let r1Min: number;
    let r1Max: number;
    let r2Min: number;
    let r2Max: number;
    let gainMin: number;
    let gainMax: number;
    let vrefMin: number;
    let vrefMax: number;

    let vAmpMin: number;
    let vAmpMax: number;
    let codeMin: number;
    let codeMax: number;

    let overNom: boolean;
    let overWorst: boolean;

    // Temperature-adjust nominal resistors
    deltaT = tempC - 25;
    r1Temp = r1 * (1 + (tcrR1 * 1e-6) * deltaT);
    r2Temp = r2 * (1 + (tcrR2 * 1e-6) * deltaT);

    vDivNom = vin * r2Temp / (r1Temp + r2Temp);
    vAmpNom = vDivNom * gain;

    maxCode = Math.pow(2, bits) - 1;
    codeNom = Math.round((vAmpNom / vref) * maxCode);

    // Worst-case corners (tolerance + same temperature model applied to corners too, conservatively)
    r1Min = r1 * (1 - r1Tol / 100) * (1 + (tcrR1 * 1e-6) * deltaT);
    r1Max = r1 * (1 + r1Tol / 100) * (1 + (tcrR1 * 1e-6) * deltaT);
    r2Min = r2 * (1 - r2Tol / 100) * (1 + (tcrR2 * 1e-6) * deltaT);
    r2Max = r2 * (1 + r2Tol / 100) * (1 + (tcrR2 * 1e-6) * deltaT);

    gainMin = gain * (1 - gainTol / 100);
    gainMax = gain * (1 + gainTol / 100);

    vrefMin = vref * (1 - vrefTol / 100);
    vrefMax = vref * (1 + vrefTol / 100);

    // For divider ratio: worst min/max occurs at corners; brute-force evaluate 4 corners
    // divider = R2/(R1+R2)
    const d11 = r2Min / (r1Min + r2Min);
    const d12 = r2Min / (r1Max + r2Min);
    const d21 = r2Max / (r1Min + r2Max);
    const d22 = r2Max / (r1Max + r2Max);

    const dMin = Math.min(d11, d12, d21, d22);
    const dMax = Math.max(d11, d12, d21, d22);

    vAmpMin = vin * dMin * gainMin;
    vAmpMax = vin * dMax * gainMax;

    // ADC code worst-case includes Vref tolerance and ADC INL/noise margin in LSB
    // Convert INL/noise to voltage margin:
    const lsbNom = vref / maxCode;
    const adcMarginV = (Math.abs(adcInlLsb) + Math.abs(adcNoiseLsb) + 0.5) * lsbNom; // include quantization half-LSB

    // codeMin: smallest code when numerator small and Vref large, minus margin
    codeMin = Math.floor(((vAmpMin - adcMarginV) / vrefMax) * maxCode);
    codeMax = Math.ceil(((vAmpMax + adcMarginV) / vrefMin) * maxCode);

    codeMin = clampNumber(codeMin, 0, maxCode);
    codeMax = clampNumber(codeMax, 0, maxCode);

    overNom = vAmpNom > vref;
    overWorst = vAmpMax > vrefMin;

    // Relative error in scaled voltage (using nominal as reference)
    const vErrPlusPct = vAmpNom !== 0 ? ((vAmpMax - vAmpNom) / vAmpNom) * 100 : NaN;
    const vErrMinusPct = vAmpNom !== 0 ? ((vAmpMin - vAmpNom) / vAmpNom) * 100 : NaN;

    return {
      vDivNom,
      vAmpNom,
      codeNom,
      vAmpMin,
      vAmpMax,
      codeMin,
      codeMax,
      overNom,
      overWorst,
      vErrPlusPct,
      vErrMinusPct,
    };
  }, [vin, r1, r2, gain, r1Tol, r2Tol, gainTol, tempC, tcrR1, tcrR2, vref, vrefTol, bits, adcInlLsb, adcNoiseLsb]);

  return (
    <CalcLayout
      title="전류·전압 계측 스케일링 (오차 예산)"
      desc="분압+증폭+ADC를 ‘최악조건(공차+온도+Vref+ADC INL/노이즈)’로 평가합니다. (보수 모델)"
    >
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>명목 값</h3>
          <NumberField label="입력 Vin" unit="V" value={vin} onChange={setVin} />
          <NumberField label="R1" unit="Ω" value={r1} onChange={setR1} />
          <NumberField label="R2" unit="Ω" value={r2} onChange={setR2} />
          <NumberField label="증폭 Gain" value={gain} step={0.01} onChange={setGain} />

          <h3>공차/온도</h3>
          <NumberField label="R1 공차" unit="%" value={r1Tol} step={0.1} min={0} onChange={setR1Tol} />
          <NumberField label="R2 공차" unit="%" value={r2Tol} step={0.1} min={0} onChange={setR2Tol} />
          <NumberField label="Gain 공차" unit="%" value={gainTol} step={0.1} min={0} onChange={setGainTol} />
          <NumberField label="온도" unit="°C" value={tempC} step={1} onChange={setTempC} />
          <NumberField label="R1 TCR" unit="ppm/°C" value={tcrR1} step={1} min={0} onChange={setTcrR1} />
          <NumberField label="R2 TCR" unit="ppm/°C" value={tcrR2} step={1} min={0} onChange={setTcrR2} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>ADC / 기준전압</h3>
          <NumberField label="Vref" unit="V" value={vref} step={0.01} onChange={setVref} />
          <NumberField label="Vref 공차" unit="%" value={vrefTol} step={0.1} min={0} onChange={setVrefTol} />
          <NumberField label="ADC 비트수" value={bits} step={1} min={8} max={24} onChange={setBits} />
          <NumberField label="ADC INL (worst)" unit="LSB" value={adcInlLsb} step={0.1} min={0} onChange={setAdcInlLsb} />
          <NumberField label="ADC 노이즈 여유" unit="LSB" value={adcNoiseLsb} step={0.1} min={0} onChange={setAdcNoiseLsb} />
        </div>

        <div style={{ flex: "1 1 740px", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>결과</h2>
          <p><b>분압 전압(명목)</b>: {res.vDivNom.toFixed(6)} V</p>
          <p><b>증폭 후 전압(명목)</b>: {res.vAmpNom.toFixed(6)} V</p>
          <p><b>ADC 코드(명목)</b>: {res.codeNom}</p>

          <hr />

          <p><b>증폭 후 전압(최악 최소)</b>: {res.vAmpMin.toFixed(6)} V</p>
          <p><b>증폭 후 전압(최악 최대)</b>: {res.vAmpMax.toFixed(6)} V</p>
          <p><b>ADC 코드 범위(최악)</b>: {res.codeMin} ~ {res.codeMax}</p>

          <hr />

          <p>
            <b>전압 오차(명목 대비)</b>: {Number.isFinite(res.vErrMinusPct) ? res.vErrMinusPct.toFixed(2) : "—"}% ~{" "}
            {Number.isFinite(res.vErrPlusPct) ? res.vErrPlusPct.toFixed(2) : "—"}%
          </p>

          {res.overNom ? <p style={{ color: "crimson" }}>⚠ 명목 조건에서 Vref 초과</p> : <p style={{ color: "green" }}>명목 조건에서 Vref 이내</p>}
          {res.overWorst ? <p style={{ color: "crimson" }}>⚠ 최악조건에서 Vref 초과 가능</p> : <p style={{ color: "green" }}>최악조건에서도 Vref 이내</p>}
        </div>
      </div>
    </CalcLayout>
  );
}
