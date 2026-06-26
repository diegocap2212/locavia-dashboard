import React from 'react';

interface FieldShellProps {
  label?: string;
  help?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Envoltório com label uppercase + texto de ajuda/erro (padrão Venice). */
const FieldShell: React.FC<FieldShellProps> = ({ label, help, error, className = '', children }) => (
  <div className={`vds-field ${className}`.trim()}>
    {label && <label className="vds-label">{label}</label>}
    {children}
    {error
      ? <span className="vds-help vds-help-error">{error}</span>
      : help && <span className="vds-help">{help}</span>}
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  wrapClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, help, error, wrapClassName, className = '', ...rest }) => (
  <FieldShell label={label} help={help} error={error} className={wrapClassName}>
    <input className={`vds-input ${error ? 'vds-input-error' : ''} ${className}`.trim()} {...rest} />
  </FieldShell>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
  wrapClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, help, error, wrapClassName, className = '', ...rest }) => (
  <FieldShell label={label} help={help} error={error} className={wrapClassName}>
    <textarea className={`vds-textarea ${error ? 'vds-input-error' : ''} ${className}`.trim()} {...rest} />
  </FieldShell>
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  wrapClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, help, error, wrapClassName, className = '', children, ...rest }) => (
  <FieldShell label={label} help={help} error={error} className={wrapClassName}>
    <div style={{ position: 'relative' }}>
      <select className={`vds-select ${error ? 'vds-input-error' : ''} ${className}`.trim()} {...rest}>
        {children}
      </select>
      <svg
        width="16" height="16" viewBox="0 0 24 24" aria-hidden
        style={{ position: 'absolute', right: 13, top: 14, pointerEvents: 'none', stroke: 'var(--text-tertiary)', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </FieldShell>
);

export default Input;
