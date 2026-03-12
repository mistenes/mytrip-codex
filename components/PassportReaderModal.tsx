import React, { useState } from 'react';
import { parseMrz, MrzResult } from '../utils/mrz';

interface Props {
  onClose: () => void;
  onResult: (data: MrzResult) => void;
}

export default function PassportReaderModal({ onClose, onResult }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    const result = parseMrz(lines);
    if (result) {
      onResult(result);
      onClose();
    } else {
      setError('Invalid MRZ.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content passport-modal" onClick={e => e.stopPropagation()}>
        <h2>Scan passport</h2>
        <div className="form-group">
          <label htmlFor="mrzInput">MRZ</label>
          <textarea id="mrzInput" value={text} onChange={e => setText(e.target.value)} placeholder={"Paste the two MRZ lines here"} />
          {error && <small className="error">{error}</small>}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Fill fields</button>
        </div>
      </div>
    </div>
  );
}
