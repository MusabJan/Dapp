import React, { useState } from 'react';

const SYSTEM = `You are an expert agricultural advisor for Pakistani farmers. You speak in a friendly Hinglish (Hindi + Urdu + English mix) tone. Keep answers concise, practical, and actionable. Focus on crops relevant to Pakistan: wheat (gehun), rice (chawal), cotton (kapas), sugarcane (ganna), maize (makkai), vegetables. Mention specific Pakistani regions (Punjab, Sindh, KPK, Balochistan) when relevant. Use bullet points where helpful. Always end with one actionable tip they can do today.`;

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
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
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
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error — dobara try karo.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: 12, fontFamily: 'sans-serif', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>🌾</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Smart Crop Advisor</div>
          <div style={{ fontSize: 12, color: '#888' }}>AI powered — apni fasal ke baare mein kuch bhi poocho</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {quickQuestions.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)} disabled={loading}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>
            {q.slice(0, 30)}...
          </button>
        ))}
      </div>

      <div style={{ height: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #eee' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#1a6b3a' : '#fff',
            color: m.role === 'user' ? '#fff' : '#222',
            padding: '10px 14px',
            borderRadius: 10,
            maxWidth: '82%',
            fontSize: 14,
            lineHeight: 1.6,
            border: m.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
            whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 13, color: '#888' }}>
            Soch raha hun...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Apna sawal likho — jaise: chawal ke liye pani kitna chahiye?"
          disabled={loading}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
        />
        <button onClick={() => sendMessage()} disabled={loading}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1a6b3a', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          Poocho
        </button>
      </div>
    </div>
  );
}
