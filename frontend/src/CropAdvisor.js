import React, { useState } from 'react';

const SYSTEM = `You are an expert agricultural advisor for Pakistani farmers. Speak in friendly Hinglish. Focus on Pakistani crops: wheat, rice, cotton, sugarcane. Mention Punjab, Sindh, KPK, Balochistan regions. Keep answers short and practical. End with one actionable tip.`;

export default function CropAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Assalamu Alaikum! Main tumhara Smart Crop Advisor hun. Apni fasal ke baare mein kuch bhi poocho!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    'Punjab mein is mausam mein konsi fasal lagaun?',
    'Gehun ki bimari ka ilaj batao',
    'Cotton ki paidawar kaise badhain?',
    'Organic farming kaise shuru karun?'
  ];

  const sendMessage = async (text) => {
    const q = text || input;
    if (!q.trim()) return;
    setInput('');
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: newMessages
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || '').join('') || 'Kuch masla hua, dobara try karo.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error — dobara try karo.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: 12, fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: 20 }}>🌾 Smart Crop Advisor</h2>
      <p style={{ margin: '0 0 1rem', color: '#666', fontSize: 13 }}>AI powered — apni fasal ke baare mein kuch bhi poocho</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {quickQuestions.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>
            {q.slice(0, 28)}...
          </button>
        ))}
      </div>

      <div style={{ height: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, padding: 8, background: '#fafafa', borderRadius: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#0066cc' : '#fff',
            color: m.role === 'user' ? '#fff' : '#222',
            padding: '10px 14px', borderRadius: 10, maxWidth: '80%', fontSize: 14, lineHeight: 1.6,
            border: m.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 13, color: '#888' }}>Soch raha hun...</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Apna sawal likho..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
        <button onClick={() => sendMessage()} disabled={loading}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0066cc', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
          Poocho
        </button>
      </div>
    </div>
  );
}