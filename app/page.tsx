import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 30 }}>
      <h1>전력계측 계산 도구</h1>

      <ul>
        <li><Link href="/opamp">OP-AMP 배율 계산</Link></li>
        <li><Link href="/scaling">전류·전압 계측 스케일링</Link></li>
        <li><Link href="/ct">CT 계산</Link></li>
        <li><Link href="/power">전력 / 에너지 계산</Link></li>
        <li><Link href="/protection">보호·임계값 계산</Link></li>
        <li><Link href="/pq">전력품질(PQ) 계산</Link></li>
        <li><Link href="/installation">설치·현장 보정 계산</Link></li>
      </ul>
    </div>
  );
}
