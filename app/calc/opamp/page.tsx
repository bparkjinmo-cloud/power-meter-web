"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

type Topology = "non_inverting" | "inverting";
type RunMode = "idle" | "active";

export default function OpampPage() {
  const [topology, setTopology] = useState<Topology>("non_inverting");
  const [runMode, setRunMode] = useState<RunMode>("active");

  // Gain network
  const [rin, setRin] = useState<number>(10000);   // Ω
  const [rf, setRf] = useState<number>(100000);    // Ω

  // Input signal (sine assumed for SR/GBW checks)
  const [vinPeak, setVinPeak] = useState<number>(0.2); // Vpk
  const [fSignal, setFSignal] = useState<number>(1000); // Hz

  // Op-amp non-ideal params (minimum practical set)
  const [vccP, setVccP] = useState<number>(3.3);   // V
  const [vccN, setVccN] = useState<number>(0.0);   // V
  const [vOutHeadroomP, setVOutHeadroomP] = useState<number>(0.1); // V
  const [vOutHeadroomN, setVOutHeadroomN] = useState<number>(0.1); // V
  const [gbw, setGbw] = useState<number>(1000000); // Hz (unity gain bandwidth)
  const [slewRateVus, setSlewRateVus] = useState<number>(0.5); // V/us

  const res = useMemo(() => {
    let avIdeal: number;
    let avGbwMax: number;
    let voutIdealPeak: number;
    let voutRailPeak: number;
    let voutGbwPeak: number;
    let voutSrPeak: number;
    let voutGuaranteedPeak: number;
    let srLimit: boolean;
    let gbwLimit: boolean;
    let railLimit: boolean;
    let notes: string[];

    notes = [];

    if (rin <= 0) {
      return {
        ok: false,
        err: "Rin은 0보다 커야 합니다.",
      } as const;
    }
    if (rf < 0) {
      return {
        ok: false,
        err: "Rf는 0 이상이어야 합니다.",
      } as const;
    }
    if (fSignal <= 0) {
      return {
        ok: false,
        err: "주파수는 0보다 커야 합니다.",
      } as const;
    }
    if (gbw <= 0) {
      return {
        ok: false,
        err: "GBW는 0보다 커야 합니다.",
      } as const;
    }
    if (slewRateVus <= 0) {
      return {
        ok: false,
        err: "Slew Rate는 0보다 커야 합니다.",
      } as const;
    }

    if (topology === "non_inverting") {
      avIdeal = 1 + rf / rin;
    } else {
      avIdeal = -rf / rin;
    }

    voutIdealPeak = Math.abs(avIdeal) * Math.abs(vinPeak);

    // Rail swing (peak allowable, assuming output centered at mid or around 0; here we enforce absolute peak limit by headroom)
    // Conservative: allowable positive peak relative to vccP, and negative peak relative to vccN; use smaller magnitude around 0.
    // If your output is biased at mid-supply, you can extend this model later.
    voutRailPeak = Math.min(
      Math.max(0, (vccP - vOutHeadroomP) - 0.0),
      Math.max(0, 0.0 - (vccN + vOutHeadroomN))
    );

    // GBW limit: Av_max ≈ GBW / f (for closed-loop gain magnitude)
    avGbwMax = gbw / fSignal;
    voutGbwPeak = Math.min(voutIdealPeak, Math.abs(vinPeak) * avGbwMax);

    // Slew rate limit for sine: Vpk_max ≈ SR / (2πf)
    // SR in V/us -> V/s
    voutSrPeak = (slewRateVus * 1e6) / (2 * Math.PI * fSignal);

    railLimit = voutIdealPeak > voutRailPeak + 1e-12;
    gbwLimit = Math.abs(avIdeal) > avGbwMax + 1e-12;
    srLimit = voutIdealPeak > voutSrPeak + 1e-12;

    if (railLimit) notes.push("레일 스윙 한계로 출력 포화 가능");
    if (gbwLimit) notes.push("GBW 한계로 고주파에서 이득 저하/위상여유 악화 가능");
    if (srLimit) notes.push("Slew Rate 한계로 파형 찌그러짐(삼각파화) 가능");

    if (runMode === "idle") {
      voutGuaranteedPeak = voutIdealPeak;
    } else {
      // Active: guarantee peak bounded by (rail, GBW-limited, SR-limited)
      voutGuaranteedPeak = Math.min(voutRailPeak, voutGbwPeak, voutSrPeak);
    }

    return {
      ok: true,
      avIdeal,
      voutIdealPeak,
      voutRailPeak,
      avGbwMax,
      voutGbwPeak,
      voutSrPeak,
      voutGuaranteedPeak,
      railLimit,
      gbwLimit,
      srLimit,
      notes,
    } as const;
  }, [
    topology,
    runMode,
    rin,
    rf,
    vinPeak,
    fSignal,
    vccP,
    vccN,
    vOutHeadroomP,
    vOutHeadroomN,
    gbw,
    slewRateVus,
  ]);

  return (
    <CalcLayout
      title="OPAMP 배율 계산 (Idle/Active)"
      desc="Idle=이상 이득만, Active=레일 스윙/GBW/Slew Rate 제한을 포함한 ‘보장 출력’ 추정(보수 모델)."
    >
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>토폴로지</label>
            <select value={topology} onChange={(e) => setTopology(e.target.value as Topology)} style={{ padding: 8 }}>
              <option value="non_inverting">비반전 (Av = 1 + Rf/Rin)</option>
              <option value="inverting">반전 (Av = -Rf/Rin)</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>모드</label>
            <select value={runMode} onChange={(e) => setRunMode(e.target.value as RunMode)} style={{ padding: 8 }}>
              <option value="idle">Idle (이상)</option>
              <option value="active">Active (실제 보장 추정)</option>
            </select>
          </div>

          <NumberField label="Rin" unit="Ω" value={rin} min={1} step={100} onChange={setRin} />
          <NumberField label="Rf" unit="Ω" value={rf} min={0} step={100} onChange={setRf} />

          <NumberField label="입력 Vin (피크)" unit="Vpk" value={vinPeak} step={0.01} min={0} onChange={setVinPeak} />
          <NumberField label="신호 주파수" unit="Hz" value={fSignal} step={10} min={1} onChange={setFSignal} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>OPAMP 파라미터 (Active용)</h3>
          <NumberField label="VCC+" unit="V" value={vccP} step={0.1} onChange={setVccP} />
          <NumberField label="VCC-" unit="V" value={vccN} step={0.1} onChange={setVccN} />
          <NumberField label="출력 상단 헤드룸" unit="V" value={vOutHeadroomP} step={0.01} min={0} onChange={setVOutHeadroomP} />
          <NumberField label="출력 하단 헤드룸" unit="V" value={vOutHeadroomN} step={0.01} min={0} onChange={setVOutHeadroomN} />
          <NumberField label="GBW" unit="Hz" value={gbw} step={1000} min={1} onChange={setGbw} />
          <NumberField label="Slew Rate" unit="V/µs" value={slewRateVus} step={0.1} min={0.001} onChange={setSlewRateVus} />
        </div>

        <div style={{ flex: "1 1 740px", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>결과</h2>

          {!res.ok ? (
            <p style={{ color: "red" }}>⚠ {res.err}</p>
          ) : (
            <>
              <p><b>이상 이득 Av</b>: {res.avIdeal.toFixed(4)}</p>
              <p><b>이상 출력 (피크)</b>: {res.voutIdealPeak.toFixed(4)} Vpk</p>

              <hr />

              <p><b>레일 허용 피크(보수)</b>: {res.voutRailPeak.toFixed(4)} Vpk</p>
              <p><b>GBW 기반 Av_max(f)</b>: {res.avGbwMax.toFixed(2)}</p>
              <p><b>GBW 제한 반영 출력 피크</b>: {res.voutGbwPeak.toFixed(4)} Vpk</p>
              <p><b>SR 제한 출력 피크</b>: {res.voutSrPeak.toFixed(4)} Vpk</p>

              <hr />

              <p style={{ fontSize: 18 }}>
                <b>보장 출력 (피크)</b>: {res.voutGuaranteedPeak.toFixed(4)} Vpk
              </p>

              {res.notes.length > 0 ? (
                <ul>
                  {res.notes.map((n, i) => <li key={i} style={{ color: "crimson" }}>⚠ {n}</li>)}
                </ul>
              ) : (
                <p style={{ color: "green" }}>제약(레일/GBW/SR) 관점에서 큰 문제 신호 없음</p>
              )}
            </>
          )}
        </div>
      </div>
    </CalcLayout>
  );
}
