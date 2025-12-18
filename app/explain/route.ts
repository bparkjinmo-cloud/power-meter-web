import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const data = await req.json();

  const prompt = `
다음은 전력계측 계산 결과이다.

종류: ${data.type}
입력값 및 계산 결과:
${JSON.stringify(data, null, 2)}

이 결과가 왜 나왔는지
전기·전자 엔지니어에게 설명하듯
간단하고 정성적으로 설명하라.
새로운 수치 계산은 하지 말 것.
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return Response.json({
    explanation: response.choices[0].message.content,
  });
}
