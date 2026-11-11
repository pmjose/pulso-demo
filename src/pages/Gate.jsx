import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startPulse } from '../lib/pulseCanvas.js';
import '../styles/gate.css';

// SHA-256 of the accepted access codes, so the codes are not readable in the bundle.
const CODE_HASHES = [
  'aa34a746bceaaf9935bdf902a13b7e1f61f11f40493e74e5cabcb2e623f26d39',
  '73127f27c66a28d8041e7acffa1934f149f91cbd9ee530e61047a9ff21fc1d58',
];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Gate() {
  const canvas = useRef(null);
  const pulse = useRef(null);
  const form = useRef(null);
  const input = useRef(null);
  const navigate = useNavigate();
  const [shown, setShown] = useState(false);
  const [flash, setFlash] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  useEffect(() => {
    pulse.current = startPulse(canvas.current);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setShown(true), reduce ? 0 : 900);
    input.current?.focus();
    return () => { clearTimeout(t); pulse.current.stop(); };
  }, []);

  async function submit(e) {
    e.preventDefault();
    const v = input.current.value.trim().toUpperCase();
    if (CODE_HASHES.includes(await sha256(v))) {
      setMsg({ text: 'Acesso concedido.', ok: true });
      sessionStorage.setItem('pulso-access', '1');
      pulse.current.unlock();
      setTimeout(() => setFlash(true), 900);
      setTimeout(() => navigate('/valor'), 1800);
    } else {
      setMsg({ text: 'Código inválido. Verifique o código e tente novamente.', ok: false });
      const f = form.current;
      f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    }
  }

  return (
    <div className="gate">
      <canvas ref={canvas} aria-hidden="true" />
      <div className="vignette" />
      <main>
        <div className={`stack${shown ? ' on' : ''}`}>
          <h1>PULSO</h1>
          <p className="sub">Plataforma de inteligência clínica e operacional. Dados, previsão e IA ao serviço de quem cuida.</p>
          <form ref={form} onSubmit={submit} autoComplete="off">
            <div className="field">
              <input ref={input} type="password" autoComplete="off" spellCheck="false" aria-label="Código de acesso" placeholder="Código de acesso" maxLength={16} />
            </div>
            <button type="submit">Entrar</button>
          </form>
          <div className="msg" role="status" style={msg.ok ? { color: '#9fe8e4' } : undefined}>{msg.text}</div>
        </div>
      </main>
      <div className={`flash${flash ? ' go' : ''}`} />
      <footer>Acesso reservado a utilizadores autorizados. Todos os dados apresentados são fictícios.</footer>
    </div>
  );
}
