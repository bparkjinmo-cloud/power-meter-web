import Link from "next/link";
import React from "react";

export function CalcLayout(props: { title: string; desc?: string; children: React.ReactNode }) {
  const { title, desc, children } = props;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Link href="/">← 계산기 목록</Link>
      <h1 style={{ marginTop: 12 }}>{title}</h1>
      {desc ? <p>{desc}</p> : null}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
