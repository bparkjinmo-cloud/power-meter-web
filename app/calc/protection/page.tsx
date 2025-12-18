"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function ProtectionCalc() {
  // Base ratings
  const [rated25, setRated25] = useState(100);  // A at 25°C
  const [ambient, setAmbient] = useState(40);   // °C
  const [kTemp, setKTemp] = useState(0.004);    // per °C derating coefficient (example)

  // Load / trip
  const [load, setLoad] = useState(80);         // A
  const [trip, setTrip] = useState(120);        // A

  // Start/inrush event
  const [iStart, setIStart] = useState(400);    // A
  const [tStart, setTStart] = useState(0.2);    // s

  // Thermal limit (I^2 t)
  const [i2tLimit, setI2tLimit] = useState(50000); // A^2·s (example; must come from device/cable/relay spec)

  const res = useMemo(() => {
    const dT = ambient - 25;
    const ratedT = rated25 * (1 - kTemp * dT); // simplistic linear derating
    const ratedTClamped = ratedT < 0 ? 0 : ratedT;

    const marginTripVsLoad = load > 0 ? ((trip - load) / load) * 100 : NaN;
    const marginLoadVsRated = ratedTClamped > 0 ? ((ratedTClamped - load) / ratedTClamped) * 100 : NaN;

    const i2tUsed = iStart * iStart * tStart;
    const i2tRemain = i2tLimit - i2tUsed;

    let status: string;
    if (load > trip) status = "즉시 트립 위험(설정 재검토)";
    else if (trip < ratedTClamped) status = "트립 설정이 디레이팅 정격보다 낮음(오동작 가능)";
    else if (load > ratedTClamped) status = "온도 디레이팅 정격 대비 과부하 위험";
    else status = "기본 조건 정상(추가 곡선/기동 패턴 검토 권장)";

    let startStatus: string;
    if (i2tUsed > i2tLimit) startStatus = "기동 이벤트만으로 I²t 한계 초과(위험)";
    else if (i2tRemain < 0.2 * i2tLimit) startStatus = "I²t 여유 부족(누적 열 위험)";
    else startStatus = "I²t 관점에서 기동 이벤트 허용 범위";

    return {
      ratedT: ratedTClamped,
      marginTripVsLoad,
      marginLoadVsRated,
      i2tUsed,
      i2tRemain,
      status,
      startStatus,
    };
  }, [rated25, ambient, kTemp, load, trip, iStart, tStart, i2tLimit]);

  return (
    <CalcLayout
      title="보호·임계값·마진 (온도+I²t)"
      desc="선형 디레이팅 + 기동(I²t) 이벤트를 포함한 보수 점검. 실제 보호계전은 곡선/표준(IEC/IEEE)과 장비 스펙 기반으로 확장해야 합니다."
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>정격/온도</h3>
          <NumberField label="정격(25°C)" unit="A" value={rated25} onChange={setRated25} />
          <NumberField label="주변 온도" unit="°C" value={ambient} onChange={setAmbient} />
          <NumberField label="디레이팅 계수 k" unit="1/°C" value={kTemp} step={0.0001} min={0} onChange={setKTemp} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>부하/트립</h3>
          <NumberField label="부하 전류" unit="A" value={load} onChange={setLoad} />
          <NumberField label="트립 설정" unit="A" value={trip} onChange={setTrip} />
        </div>

        <div style={{ flex: "1 1 360px" }}>
          <h3 style={{ marginTop: 0 }}>기동 이벤트(I²t)</h3>
          <NumberField label="기동 전류" unit="A" value={iStart} onChange={setIStart} />
          <NumberField label="기동 시간" unit="s" value={tStart} step={0.01} min={0} onChange={setTStart} />
          <NumberField label="I²t 한계" unit="A²·s" value={i2tLimit} step={100} min={0} onChange={setI2tLimit} />
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <p><b>온도 디레이팅 정격</b>: {res.ratedT.toFixed(2)} A</p>
        <p><b>트립-부하 여유율</b>: {Number.isFinite(res.marginTripVsLoad) ? res.marginTripVsLoad.toFixed(2) : "—"} %</p>
        <p><b>디레이팅 정격 대비 부하 여유율</b>: {Number.isFinite(res.marginLoadVsRated) ? res.marginLoadVsRated.toFixed(2) : "—"} %</p>

        <hr />

        <p><b>I²t 사용량(기동)</b>: {res.i2tUsed.toFixed(2)} A²·s</p>
        <p><b>I²t 잔여</b>: {res.i2tRemain.toFixed(2)} A²·s</p>

        <hr />

        <p><b>판정</b>: {res.status}</p>
        <p><b>기동 판정</b>: {res.startStatus}</p>

        <p style={{ color: "#666", marginTop: 12 }}>
          참고: kTemp, I²t 한계는 보호소자/케이블/차단기/릴레이 스펙을 근거로 입력해야 의미가 있습니다.
        </p>
      </div>
    </CalcLayout>
  );
}
