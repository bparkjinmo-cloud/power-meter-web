"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

type PhaseMode = "single" | "three";

function pct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(2) + " %";
}

export default function PowerCalc() {
  const [mode, setMode] = useState<PhaseMode>("single");

  // Single-phase inputs
  const [vrms, setVrms] = useState(220);
  const [irms, setIrms] = useState(10);
  const [pf, setPf] = useState(0.9);

  // Three-phase inputs (per-phase)
  const [va, setVa] = useState(220);
  const [vb, setVb] = useState(220);
  const [vc, setVc] = useState(220);
  const [ia, setIa] = useState(10);
  const [ib, setIb] = useState(10);
  const [ic, setIc] = useState(10);
  const [pfa, setPfa] = useState(0.9);
  const [pfb, setPfb] = useState(0.9);
  const [pfc, setPfc] = useState(0.9);

  // Harmonic correction (very simplified)
  const [thdI, setThdI] = useState(0); // % current THD
  const [thdV, setThdV] = useState(0); // % voltage THD
  const [hours, setHours] = useState(24);

  const res = useMemo(() => {
    let p: number;
    let q: number;
    let s: number;

    let pa: number;
    let pb: number;
    let pc: number;
    let qa: number;
    let qb: number;
    let qc: number;
    let sa: number;
    let sb: number;
    let sc: number;

    let vAvg: number;
    let iAvg: number;
    let vImb: number;
    let iImb: number;

    let energyKwh: number;

    // Harmonic penalty factor (conservative heuristic)
    // This is NOT a standards-grade true-power calc; it discourages using fundamental-only formulas under high THD.
    const k = 0.03; // conservative penalty coefficient
    const thdIpu = thdI / 100;
    const thdVpu = thdV / 100;
    const penalty = 1 - k * (thdIpu * thdIpu + thdVpu * thdVpu);
    const penaltyClamped = penalty < 0.8 ? 0.8 : penalty; // don't over-penalize below 0.8 in this simple model

    if (mode === "single") {
      s = vrms * irms;
      p = s * pf;
      q = Math.sqrt(Math.max(0, s * s - p * p));

      // apply penalty as “true-power caution”
      const pAdj = p * penaltyClamped;
      const qAdj = q; // q handling in nonsinusoidal is more complex; keep basic
      const sAdj = s;

      energyKwh = (pAdj * hours) / 1000;

      return {
        mode,
        pFund: p,
        qFund: q,
        sFund: s,
        pAdj,
        qAdj,
        sAdj,
        energyKwh,
        vImb: NaN,
        iImb: NaN,
        note:
          (thdI > 0 || thdV > 0)
            ? "THD 입력이 0이 아니면 ‘기본식 기반 전력’을 보수적으로 감쇠해 표시합니다(간이 모델)."
            : "정현파 가정 기본식 결과입니다.",
      };
    }

    sa = va * ia;
    sb = vb * ib;
    sc = vc * ic;

    pa = sa * pfa;
    pb = sb * pfb;
    pc = sc * pfc;

    qa = Math.sqrt(Math.max(0, sa * sa - pa * pa));
    qb = Math.sqrt(Math.max(0, sb * sb - pb * pb));
    qc = Math.sqrt(Math.max(0, sc * sc - pc * pc));

    s = sa + sb + sc;
    p = pa + pb + pc;
    q = qa + qb + qc;

    vAvg = (va + vb + vc) / 3;
    iAvg = (ia + ib + ic) / 3;

    // simple imbalance metric: max deviation / average
    vImb = vAvg !== 0 ? (Math.max(Math.abs(va - vAvg), Math.abs(vb - vAvg), Math.abs(vc - vAvg)) / vAvg) * 100 : NaN;
    iImb = iAvg !== 0 ? (Math.max(Math.abs(ia - iAvg), Math.abs(ib - iAvg), Math.abs(ic - iAvg)) / iAvg) * 100 : NaN;

    const pAdj3 = p * penaltyClamped;
    energyKwh = (pAdj3 * hours) / 1000;

    return {
      mode,
      pFund: p,
      qFund: q,
      sFund: s,
      pAdj: pAdj3,
      qAdj: q,
      sAdj: s,
      energyKwh,
      vImb,
      iImb,
      note:
        (thdI > 0 || thdV > 0)
          ? "비정현파(THD) 입력이 있으면 ‘기본식 기반 전력’을 보수적으로 감쇠해 표시합니다(간이 모델)."
          : "정현파 가정의 상별 합산 결과입니다.",
    };
  }, [
    mode,
    vrms,
    irms,
    pf,
    va,
    vb,
    vc,
    ia,
    ib,
    ic,
    pfa,
    pfb,
    pfc,
    thdI,
    thdV,
    hours,
  ]);

  return (
    <CalcLayout
      title="전력 / 에너지 계산 (단상/삼상 + 간이 PQ 보정)"
      desc="정현파 기본식 + 불평형 지표 + THD 입력 시 보수 감쇠(간이 모델). 정밀 PQ 전력은 측정 알고리즘(샘플 기반)으로 계산해야 합니다."
    >
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>구성</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as PhaseMode)} style={{ padding: 8 }}>
          <option value="single">단상</option>
          <option value="three">삼상(상별 입력)</option>
        </select>
      </div>

      {mode === "single" ? (
        <>
          <NumberField label="Vrms" unit="V" value={vrms} onChange={setVrms} />
          <NumberField label="Irms" unit="A" value={irms} onChange={setIrms} />
          <NumberField label="PF" value={pf} step={0.01} min={-1} max={1} onChange={setPf} />
        </>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h4 style={{ marginTop: 0 }}>A상</h4>
            <NumberField label="Va" unit="V" value={va} onChange={setVa} />
            <NumberField label="Ia" unit="A" value={ia} onChange={setIa} />
            <NumberField label="PFa" value={pfa} step={0.01} min={-1} max={1} onChange={setPfa} />
          </div>
          <div>
            <h4 style={{ marginTop: 0 }}>B상</h4>
            <NumberField label="Vb" unit="V" value={vb} onChange={setVb} />
            <NumberField label="Ib" unit="A" value={ib} onChange={setIb} />
            <NumberField label="PFb" value={pfb} step={0.01} min={-1} max={1} onChange={setPfb} />
          </div>
          <div>
            <h4 style={{ marginTop: 0 }}>C상</h4>
            <NumberField label="Vc" unit="V" value={vc} onChange={setVc} />
            <NumberField label="Ic" unit="A" value={ic} onChange={setIc} />
            <NumberField label="PFc" value={pfc} step={0.01} min={-1} max={1} onChange={setPfc} />
          </div>
        </div>
      )}

      <hr />

      <NumberField label="전류 THD" unit="%" value={thdI} step={0.1} min={0} onChange={setThdI} />
      <NumberField label="전압 THD" unit="%" value={thdV} step={0.1} min={0} onChange={setThdV} />
      <NumberField label="사용 시간" unit="h" value={hours} onChange={setHours} />

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <p><b>P(기본식)</b>: {res.pFund.toFixed(2)} W</p>
        <p><b>Q(기본식)</b>: {res.qFund.toFixed(2)} var</p>
        <p><b>S(기본식)</b>: {res.sFund.toFixed(2)} VA</p>

        <hr />

        <p><b>P(보수 보정)</b>: {res.pAdj.toFixed(2)} W</p>
        <p><b>에너지</b>: {res.energyKwh.toFixed(4)} kWh</p>

        {res.mode === "three" ? (
          <>
            <hr />
            <p><b>전압 불평형(간이)</b>: {pct(res.vImb)}</p>
            <p><b>전류 불평형(간이)</b>: {pct(res.iImb)}</p>
          </>
        ) : null}

        <p style={{ color: "#666", marginTop: 12 }}>{res.note}</p>
      </div>
    </CalcLayout>
  );
}
