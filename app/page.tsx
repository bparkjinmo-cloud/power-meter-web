import Link from "next/link";

const CALCS = [
  { title: "OPAMP 배율 계산", href: "/calc/opamp", desc: "비반전/반전/가산 등 기본 이득" },
  { title: "전류·전압 스케일링", href: "/calc/scaling", desc: "분압/증폭/ADC 환산" },
  { title: "CT 계산", href: "/calc/ct", desc: "비율·burden·포화·여유" },
  { title: "전력 / 에너지", href: "/calc/power", desc: "P/Q/S/PF, kWh 누적" },
  { title: "보호·임계값·마진", href: "/calc/protection", desc: "트립 설정·여유율·동작시간" },
  { title: "전력품질(PQ)", href: "/calc/pq", desc: "THD·고조파·불평형 등" },
  { title: "설치·현장 보정", href: "/calc/field", desc: "온도/배선/노이즈 보정" },
];

export default function Home() {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>전력계측 계산기 모음</h1>
      <p>원하시는 항목을 선택하세요.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {CALCS.map((c) => (
          <div key={c.href} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h2 style={{ margin: "0 0 8px 0" }}>{c.title}</h2>
            <p style={{ margin: "0 0 12px 0" }}>{c.desc}</p>
            <Link href={c.href}>👉 계산기로 이동</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
