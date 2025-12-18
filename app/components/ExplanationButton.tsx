'use client';

import { useState } from 'react';

export function ExplanationButton({ context }: { context: any }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  async function handleClick() {
    setLoading(true);
    const res = await fetch('/api/explain', {
      method: 'POST',
      body: JSON.stringify(context),
    });
    const data = await res.json();
    setText(data.explanation);
    setLoading(false);
  }

  return (
    <div>
      <button onClick={handleClick}>설명 표시</button>
      {loading && <p>설명 생성 중...</p>}
      {text && <p>{text}</p>}
    </div>
  );
}
