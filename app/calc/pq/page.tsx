"use client";

import { useMemo, useState } from "react";
import { CalcLayout } from "../../components/CalcLayout";
import { NumberField } from "../../components/NumberField";

export default function PqCalc() {
  const [fund, setFund] = useState(100); // V1 or I1 RMS
  const [h3, setH3] = useState(0);
  const [h5, setH5] = useState(10);
  const [h7, setH7] = useState(5);
  const [h11, setH11] = useState(0);

  const res = useMemo(() => {
    const sumSq = h3 * h3 + h5 * h5 + h7 * h7 + h11 * h11;
    const thd = fund > 0 ? (Math.sqrt(sumSq) / fund) * 100 : NaN;

    const totalRms = Math.sqrt(fund * fund + sumSq);
    const share3 = totalRms > 0 ? (h3 / totalRms) * 100 : NaN;
    const share5 = totalRms > 0 ? (h5 / totalRms) * 100 : NaN;
    const share7 = totalRms > 0 ? (h7 / totalRms) * 100 : NaN;
    const share11 = totalRms > 0 ? (h11 / totalRms) * 100 : NaN;

    return { thd, totalRms, share3, share5, share7, share11 };
  }, [fund, h3, h5, h7, h11]);

  return (
    <CalcLayout
      title="전력품질(PQ) – THD"
      desc="THD 정의는 충분히 정확합니다. 실전 보강은 ‘어떤 고조파 RMS를 어떻게 얻는가(FFT/윈도우/동기)’와 ‘몇 차까지 관리할 것인가’가 핵심입니다."
    >
      <NumberField label="기본파 RMS" value={fund} onChange={setFund} />
      <NumberField label="3차 고조파 RMS" value={h3} onChange={setH3} />
      <NumberField label="5차 고조파 RMS" value={h5} onChange={setH5} />
      <NumberField label="7차 고조파 RMS" value={h7} onChange={setH7} />
      <NumberField label="11차 고조파 RMS" value={h11} onChange={setH11} />

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <p><b>THD</b>: {Number.isFinite(res.thd) ? res.thd.toFixed(2) : "—"} %</p>
        <p><b>총 RMS(근사)</b>: {Number.isFinite(res.totalRms) ? res.totalRms.toFixed(3) : "—"}</p>

        <hr />

        <p><b>성분 기여(총 RMS 대비)</b></p>
        <p>3차: {Number.isFinite(res.share3) ? res.share3.toFixed(2) : "—"} %</p>
        <p>5차: {Number.isFinite(res.share5) ? res.share5.toFixed(2) : "—"} %</p>
        <p>7차: {Number.isFinite(res.share7) ? res.share7.toFixed(2) : "—"} %</p>
        <p>11차: {Number.isFinite(res.share11) ? res.share11.toFixed(2) : "—"} %</p>

        <p style={{ color: "#666", marginTop: 12 }}>
          실전 보강이 필요하다면: (1) 샘플링 동기(정확히 60Hz), (2) IEC 61000-4-7 그룹화,
          (3) 창 함수/누설 보정, (4) 인터하모닉 처리입니다. 이건 “계산식”이 아니라 “측정 알고리즘” 영역입니다.
        </p>
      </div>
    </CalcLayout>
  );
}
