"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

type Topology = "non_inverting" | "inverting";

type OpampResult = {
  ok: boolean;
  err: string;
  av: number;
  voutIdeal: number;
  voutMin: number;
  voutMax: number;
  voutClamped: number;
  saturated: boolean;
};

export default function OpampDcCalc() {
  const [topology, setTopology] = useState<Topology>("non_inverting");

  // Gain network
  const [rin, setRin] = useState(10000);   // Ω
  const [rf, setRf] = useState(100000);    // Ω

  // DC input
  const [vin, setVin] = useState(0.1);     // V

  // Supply
  const [vccP, setVccP] = useState(3.3);
  const [vccN, setVccN] = useState(0.0);
  const [headroomP, setHeadroomP] = useState(0.1);
  const [headroomN, setHeadroomN] = useState(0.1);

  const res: OpampResult = useMemo(() => {
    /* --- 기본 초기값 (에러 시에도 유지) --- */
    let av = 0;
    let voutIdeal = 0;
    let voutMin = vccN + headroomN;
    let voutMax = vccP - headroomP;
    let voutClamped = 0;
    let saturated = false;

    if (rin <= 0) {
      return {
        ok: false,
        err: "Rin은 0보다 커야 합니다.",
        av,
        voutIdeal,
        voutMin,
        voutMax,
        voutClamped,
        saturated,
      };
    }

    /* --- 이득 계산 --- */
    av =
      topology === "non_inverting"
        ? 1 + rf / rin
        : -rf / rin;

    /* --- 이상 출력 --- */
    voutIdeal = av * vin;

    /* --- 레일 범위 --- */
    voutMin = vccN + headroomN;
    voutMax = vccP - headroomP;

    /* --- 출력 보장 --- */
    if (voutIdeal > voutMax) {
      voutClamped = voutMax;
      saturated = true;
    } else if (voutIdeal < voutMin) {
      voutClamped = voutMin;
      saturated = true;
    } else {
      voutClamped = voutIdeal;
      saturated = false;
    }

    return {
      ok: true,
      err: "",
      av,
      voutIdeal,
      voutMin,
      voutMax,
      voutClamped,
      saturated,
    };
  }, [topology, rin, rf, vin, vccP, vccN, headroomP, headroomN]);

  return (
    <CalcLayout
      title="OPAMP 배율 계산 (DC 전용)"
      desc="직류 센서/계측 신호 기준. 이득과 출력 포화 여부만 판단합니다."
    >
      <div style={{ maxWidth: 600 }}>
        <label>토폴로지</label>
        <select
          value={topology}
          onChange={(e) => setTopology(e.target.value as Topology)}
        >
          <option value="non_inverting">비반전</option>
          <option value="inverting">반전</option>
        </select>

        <NumberField label="Rin" unit="Ω" value={rin} onChange={setRin} />
        <NumberField label="Rf" unit="Ω" value={rf} onChange={setRf} />
        <NumberField label="입력 Vin (DC)" unit="V" value={vin} onChange={setVin} />

        <NumberField label="VCC+" unit="V" value={vccP} onChange={setVccP} />
        <NumberField label="VCC-" unit="V" value={vccN} onChange={setVccN} />
        <NumberField label="상단 헤드룸" unit="V" value={headroomP} onChange={setHeadroomP} />
        <NumberField label="하단 헤드룸" unit="V" value={headroomN} onChange={setHeadroomN} />

        <hr />

        {res.ok ? (
          <>
            <p><b>이득 Av</b>: {res.av.toFixed(3)}</p>
            <p><b>이상 출력</b>: {res.voutIdeal.toFixed(4)} V</p>
            <p><b>출력 허용 범위</b>: {res.voutMin.toFixed(2)} ~ {res.voutMax.toFixed(2)} V</p>
            <p><b>보장 출력</b>: {res.voutClamped.toFixed(4)} V</p>
            {res.saturated ? (
              <p style={{ color: "crimson" }}>⚠ 출력 포화 발생</p>
            ) : (
              <p style={{ color: "green" }}>정상 동작 영역</p>
            )}
          </>
        ) : (
          <p style={{ color: "crimson" }}>⚠ {res.err}</p>
        )}
      </div>
    </CalcLayout>
  );
}
