"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

type PhaseMode = "single" | "three";

/* 퍼센트 표시 헬퍼 */
function pct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(2) + " %";
}

export default function PowerCalc() {
  /* ---------- 구성 ---------- */
  const [mode, setMode] = useState<PhaseMode>("three");

  /* ---------- 단상 ---------- */
  const [v, setV] = useState(220);
  const [i, setI] = useState(10);
  const [pf, setPf] = useState(0.9);

  /* ---------- 삼상 RST ---------- */
  const [vr, setVr] = useState(220);
  const [vs, setVs] = useState(220);
  const [vt, setVt] = useState(220);

  const [ir, setIr] = useState(10);
  const [is_, setIs] = useState(10);
  const [it, setIt] = useState(10);

  const [pfr, setPfr] = useState(0.9);
  const [pfs, setPfs] = useState(0.9);
  const [pft, setPft] = useState(0.9);

  /* ---------- 전력품질(간이) ---------- */
  const [thdV, setThdV] = useState(0); // %
  const [thdI, setThdI] = useState(0); // %
  const [hours, setHours] = useState(24);

  const res = useMemo(() => {
    /* 보수 보정 계수 (비정현파 간이 모델) */
    const k = 0.03;
    const penalty =
      1 - k * ((thdV / 100) ** 2 + (thdI / 100) ** 2);
    const penaltyClamped = penalty < 0.8 ? 0.8 : penalty;

    /* ---------- 단상 ---------- */
    if (mode === "single") {
      const s = v * i;
      const p = s * pf;
      const q = Math.sqrt(Math.max(0, s * s - p * p));

      const pAdj = p * penaltyClamped;
      const energy = (pAdj * hours) / 1000;

      return {
        mode,
        p,
        q,
        s,
        pAdj,
        energy,
        vImb: NaN,
        iImb: NaN,
        note:
          thdV > 0 || thdI > 0
            ? "THD 입력에 따라 유효전력을 보수적으로 감쇠했습니다."
            : "정현파 가정 기본 계산입니다.",
      };
    }

    /* ---------- 삼상 RST ---------- */
    const sr = vr * ir;
    const ss = vs * is_;
    const st = vt * it;

    const pr = sr * pfr;
    const ps = ss * pfs;
    const pt = st * pft;

    const qr = Math.sqrt(Math.max(0, sr * sr - pr * pr));
    const qs = Math.sqrt(Math.max(0, ss * ss - ps * ps));
    const qt = Math.sqrt(Math.max(0, st * st - pt * pt));

    const s = sr + ss + st;
    const p = pr + ps + pt;
    const q = qr + qs + qt;

    const pAdj = p * penaltyClamped;
    const energy = (pAdj * hours) / 1000;

    /* ---------- 불평형 ---------- */
    const vAvg = (vr + vs + vt) / 3;
    const iAvg = (ir + is_ + it) / 3;

    const vImb =
      vAvg > 0
        ? (Math.max(
            Math.abs(vr - vAvg),
            Math.abs(vs - vAvg),
            Math.abs(vt - vAvg)
          ) /
            vAvg) *
          100
        : NaN;

    const iImb =
      iAvg > 0
        ? (Math.max(
            Math.abs(ir - iAvg),
            Math.abs(is_ - iAvg),
            Math.abs(it - iAvg)
          ) /
            iAvg) *
          100
        : NaN;

    return {
      mode,
      p,
      q,
      s,
      pAdj,
      energy,
      vImb,
      iImb,
      note:
        thdV > 0 || thdI > 0
          ? "THD 입력에 따라 유효전력을 보수적으로 감쇠했습니다."
          : "정현파 가정 상별 합산 결과입니다.",
    };
  }, [
    mode,
    v,
    i,
    pf,
    vr,
    vs,
    vt,
    ir,
    is_,
    it,
    pfr,
    pfs,
    pft,
    thdV,
    thdI,
    hours,
  ]);

  return (
    <CalcLayout
      title="전력 / 에너지 계산 (RST)"
      desc="한국 전력 시스템(60Hz) 기준. 불평형 및 비정현파(간이 보정) 포함."
    >
      <label>구성</label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as PhaseMode)}
      >
        <option value="single">단상</option>
        <option value="three">삼상 (R/S/T)</option>
      </select>

      {mode === "single" ? (
        <>
          <NumberField label="V" unit="V" value={v} onChange={setV} />
          <NumberField label="I" unit="A" value={i} onChange={setI} />
          <NumberField label="PF" value={pf} onChange={setPf} />
        </>
      ) : (
        <>
          <h4>R상</h4>
          <NumberField label="Vr" unit="V" value={vr} onChange={setVr} />
          <NumberField label="Ir" unit="A" value={ir} onChange={setIr} />
          <NumberField label="PF_r" value={pfr} onChange={setPfr} />

          <h4>S상</h4>
          <NumberField label="Vs" unit="V" value={vs} onChange={setVs} />
          <NumberField label="Is" unit="A" value={is_} onChange={setIs} />
          <NumberField label="PF_s" value={pfs} onChange={setPfs} />

          <h4>T상</h4>
          <NumberField label="Vt" unit="V" value={vt} onChange={setVt} />
          <NumberField label="It" unit="A" value={it} onChange={setIt} />
          <NumberField label="PF_t" value={pft} onChange={setPft} />
        </>
      )}

      <hr />

      <NumberField label="전압 THD" unit="%" value={thdV} onChange={setThdV} />
      <NumberField label="전류 THD" unit="%" value={thdI} onChange={setThdI} />
      <NumberField label="사용 시간" unit="h" value={hours} onChange={setHours} />

      <hr />

      <p><b>P</b>: {res.p.toFixed(2)} W</p>
      <p><b>Q</b>: {res.q.toFixed(2)} var</p>
      <p><b>S</b>: {res.s.toFixed(2)} VA</p>
      <p><b>P(보수)</b>: {res.pAdj.toFixed(2)} W</p>
      <p><b>에너지</b>: {res.energy.toFixed(3)} kWh</p>

      {mode === "three" && (
        <>
          <p><b>전압 불평형</b>: {pct(res.vImb)}</p>
          <p><b>전류 불평형</b>: {pct(res.iImb)}</p>
        </>
      )}

      <p style={{ color: "#666" }}>{res.note}</p>
    </CalcLayout>
  );
}
