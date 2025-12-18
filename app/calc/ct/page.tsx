"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function CtCalc() {
  // CT rating
  const [ratioP, setRatioP] = useState(100); // A
  const [ratioS, setRatioS] = useState(5);   // A

  // Operating currents
  const [ip, setIp] = useState(80);          // A normal
  const [ifault, setIfault] = useState(1000); // A fault (for protection scenario)

  // Burden network
  const [rb, setRb] = useState(1.0);         // Ω burden resistor
  const [rs, setRs] = useState(0.2);         // Ω CT secondary winding resistance
  const [rwire, setRwire] = useState(0.05);  // Ω cable loop resistance

  // CT magnetization characteristic (simplified)
  const [vk, setVk] = useState(20);          // V knee voltage (datasheet)
  const [freq, setFreq] = useState(60);      // Hz (for notes; not used directly in this simplified knee check)

  const res = useMemo(() => {
    let isec: number;
    let isecFault: number;
    let zTotal: number;
    let vReq: number;
    let vReqFault: number;
    let margin: number;
    let marginFault: number;

    let risk: string;
    let riskFault: string;

    if (ratioP <= 0 || ratioS <= 0) {
      return { ok: false, err: "CT 비율은 0보다 커야 합니다." } as const;
    }
    if (vk <= 0) {
      return { ok: false, err: "Knee Voltage는 0보다 커야 합니다." } as const;
    }

    isec = ip * (ratioS / ratioP);
    isecFault = ifault * (ratioS / ratioP);

    zTotal = rb + rs + rwire;
    vReq = isec * zTotal;
    vReqFault = isecFault * zTotal;

    // Conservative: consider saturation risk when Vreq exceeds 80% of Vk
    margin = (0.8 * vk) - vReq;
    marginFault = (0.8 * vk) - vReqFault;

    if (vReq <= 0.6 * vk) risk = "OK(여유 충분)";
    else if (vReq <= 0.8 * vk) risk = "주의(여유 감소)";
    else risk = "포화 위험(계측/보호 신뢰도 저하)";

    if (vReqFault <= 0.6 * vk) riskFault = "OK(고장전류에서도 여유)";
    else if (vReqFault <= 0.8 * vk) riskFault = "주의(고장전류 여유 감소)";
    else riskFault = "포화 매우 유력(보호 오동작/미동작 위험)";

    return {
      ok: true,
      isec,
      isecFault,
      zTotal,
      vReq,
      vReqFault,
      margin,
      marginFault,
      risk,
      riskFault,
    } as const;
  }, [ratioP, ratioS, ip, ifault, rb, rs, rwire, vk, freq]);

  return (
    <CalcLayout
      title="CT 계산 (Knee Voltage 기반)"
      desc="CT 2차 요구전압 Vreq = Is × (Rb+Rs+Rwire). Vreq가 0.8·Vk를 넘으면 포화 위험(보수적)."
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>CT 비율/전류</h3>
          <NumberField label="CT 1차 정격" unit="A" value={ratioP} onChange={setRatioP} />
          <NumberField label="CT 2차 정격" unit="A" value={ratioS} onChange={setRatioS} />
          <NumberField label="운전 전류 Ip" unit="A" value={ip} onChange={setIp} />
          <NumberField label="고장 전류 Ifault" unit="A" value={ifault} onChange={setIfault} />
          <NumberField label="주파수" unit="Hz" value={freq} onChange={setFreq} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>부하/권선/배선</h3>
          <NumberField label="Burden Rb" unit="Ω" value={rb} step={0.01} min={0} onChange={setRb} />
          <NumberField label="권선저항 Rs" unit="Ω" value={rs} step={0.01} min={0} onChange={setRs} />
          <NumberField label="케이블 루프 Rwire" unit="Ω" value={rwire} step={0.01} min={0} onChange={setRwire} />
          <NumberField label="Knee Voltage Vk" unit="V" value={vk} step={0.1} min={0.1} onChange={setVk} />
        </div>

        <div style={{ flex: "1 1 740px", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>결과</h2>

          {!res.ok ? (
            <p style={{ color: "crimson" }}>⚠ {res.err}</p>
          ) : (
            <>
              <p><b>2차 전류(운전)</b>: {res.isec.toFixed(4)} A</p>
              <p><b>2차 전류(고장)</b>: {res.isecFault.toFixed(4)} A</p>
              <p><b>Ztotal</b>: {res.zTotal.toFixed(4)} Ω</p>

              <hr />

              <p><b>Vreq(운전)</b>: {res.vReq.toFixed(4)} V</p>
              <p><b>판정</b>: {res.risk}</p>
              <p><b>여유(0.8Vk - Vreq)</b>: {res.margin.toFixed(4)} V</p>

              <hr />

              <p><b>Vreq(고장)</b>: {res.vReqFault.toFixed(4)} V</p>
              <p><b>판정(고장)</b>: {res.riskFault}</p>
              <p><b>여유(고장)</b>: {res.marginFault.toFixed(4)} V</p>

              <p style={{ color: "#666", marginTop: 12 }}>
                참고: 실제 포화는 파형(DC 성분), 주파수, 코어 특성에 좌우됩니다. 본 모델은 datasheet의 Vk를 이용한 보수 판정입니다.
              </p>
            </>
          )}
        </div>
      </div>
    </CalcLayout>
  );
}
