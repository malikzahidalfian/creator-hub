import { useState } from 'react';
import Icon from './Icon';

export default function PasswordField({ id, label, ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className="input-group">
    <label htmlFor={id}>{label}</label>
    <div className="password-input-wrap">
      <input {...props} id={id} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <button type="button" className="icon-button password-toggle" onClick={() => setVisible(value => !value)} aria-label={`${visible ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`} aria-pressed={visible} disabled={props.disabled}><Icon name={visible ? 'eyeOff' : 'eye'} size={20} /></button>
    </div>
  </div>;
}
