import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { home } from '~/content/home';
import { contactCopy } from '~/lib/contact';
import {
  charCount,
  FIELD_LIMITS,
  normalizeInput,
  validate,
  type AccessResult,
  type Field,
  type FieldErrors
} from '~/lib/access/rules';
import { clsx } from 'clsx';

const copy = home.access;

type Values = Record<Field, string> & { website: string };
type Phase = 'idle' | 'sending' | 'ok' | 'duplicate' | 'rate_limited' | 'failed';

const EMPTY: Values = { name: '', email: '', organization: '', intendedUse: '', website: '' };
const ORDER: Field[] = ['name', 'email', 'organization', 'intendedUse'];

/** Statuses passed back in the URL when the form is posted without JavaScript. */
export type FallbackStatus = AccessResult['status'];

export function AccessForm({ fallbackStatus }: { fallbackStatus?: FallbackStatus }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>(() => {
    if (fallbackStatus === 'ok' || fallbackStatus === 'duplicate' || fallbackStatus === 'rate_limited') {
      return fallbackStatus;
    }
    return fallbackStatus === 'error' ? 'failed' : 'idle';
  });
  const [sentTo, setSentTo] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  // Move focus to the outcome so keyboard and screen-reader users hear it.
  useEffect(() => {
    if (phase === 'ok' || phase === 'duplicate') resultRef.current?.focus();
  }, [phase]);

  const set = (field: keyof Values) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    if (field !== 'website' && errors[field]) {
      setErrors(({ [field]: _removed, ...rest }) => rest);
    }
    if (phase === 'failed' || phase === 'rate_limited') setPhase('idle');
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = ORDER.find((field) => errs[field]);
    if (first) document.getElementById(`${formId}-${first}`)?.focus();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'sending') return;
    const checked = validate(normalizeInput(values));
    if (!checked.ok && !values.website) {
      setErrors(checked.errors);
      focusFirstError(checked.errors);
      return;
    }
    setErrors({});
    setPhase('sending');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(values)
      });
      const result = (await response.json().catch(() => ({ status: 'error' }))) as AccessResult;
      switch (result.status) {
        case 'ok':
        case 'duplicate':
          setSentTo(normalizeInput(values).email);
          setPhase(result.status);
          break;
        case 'invalid':
          setErrors(result.errors);
          setPhase('idle');
          focusFirstError(result.errors);
          break;
        case 'rate_limited':
          setPhase('rate_limited');
          break;
        default:
          setPhase('failed');
      }
    } catch {
      setPhase('failed');
    }
  };

  if (phase === 'ok' || phase === 'duplicate') {
    const message = phase === 'ok' ? copy.success : copy.duplicate;
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role='status'
        className='border-t-2 border-accent bg-paper-deep px-6 py-8 outline-none md:px-8 md:py-10'
      >
        <p className='label text-accent'>{phase === 'ok' ? 'Received' : 'Already received'}</p>
        <p className='mt-3 text-[1.6rem] leading-tight md:text-[2rem]'>{message.title}</p>
        <p className='mt-3 max-w-[34rem] text-ink-soft'>
          {message.body.replace('{email}', sentTo || 'the address you gave')}
        </p>
      </div>
    );
  }

  const used = charCount(values.intendedUse);
  const over = used > FIELD_LIMITS.intendedUse;
  const sending = phase === 'sending';

  return (
    <form
      method='post'
      action='/api/access'
      noValidate
      onSubmit={onSubmit}
      aria-describedby={`${formId}-privacy`}
      className='relative'
    >
      {/* Honeypot: people never see or reach this field. */}
      <div aria-hidden='true' className='absolute -left-[10000px] h-px w-px overflow-hidden'>
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name='website'
          type='text'
          tabIndex={-1}
          autoComplete='off'
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <div className='grid gap-x-8 gap-y-7 md:grid-cols-2'>
        <TextField
          id={`${formId}-name`}
          name='name'
          label={copy.fields.name.label}
          autoComplete={copy.fields.name.autoComplete}
          value={values.name}
          onChange={set('name')}
          error={errors.name}
        />
        <TextField
          id={`${formId}-email`}
          name='email'
          type='email'
          inputMode='email'
          label={copy.fields.email.label}
          hint={copy.fields.email.hint}
          autoComplete={copy.fields.email.autoComplete}
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <div className='md:col-span-2'>
          <TextField
            id={`${formId}-organization`}
            name='organization'
            label={copy.fields.organization.label}
            hint={copy.fields.organization.hint}
            autoComplete={copy.fields.organization.autoComplete}
            value={values.organization}
            onChange={set('organization')}
            error={errors.organization}
          />
        </div>
        <div className='md:col-span-2'>
          <div className='flex items-baseline justify-between gap-4'>
            <label htmlFor={`${formId}-intendedUse`} className='text-[1.05rem]'>
              {copy.fields.intendedUse.label}
            </label>
            <span
              id={`${formId}-count`}
              className={clsx('mono text-[0.78rem] tabular-nums', over ? 'text-accent' : 'text-ink-soft')}
            >
              {used} / {FIELD_LIMITS.intendedUse}
              <span className='visually-hidden'> characters</span>
            </span>
          </div>
          <p id={`${formId}-intendedUse-hint`} className='mt-0.5 text-[0.92rem] text-ink-soft'>
            {copy.fields.intendedUse.hint}
          </p>
          <textarea
            id={`${formId}-intendedUse`}
            name='intendedUse'
            rows={5}
            value={values.intendedUse}
            onChange={set('intendedUse')}
            aria-invalid={errors.intendedUse || over ? true : undefined}
            aria-describedby={[
              `${formId}-intendedUse-hint`,
              `${formId}-count`,
              errors.intendedUse ? `${formId}-intendedUse-error` : ''
            ]
              .filter(Boolean)
              .join(' ')}
            className='field-input mt-2.5 min-h-36 resize-y border px-3.5 py-3 leading-normal'
          />
          <CountAnnouncer used={used} />
          <FieldError id={`${formId}-intendedUse-error`} error={errors.intendedUse} />
        </div>
      </div>

      <div className='mt-9 flex flex-col gap-5 sm:flex-row sm:items-center'>
        <button type='submit' className='btn btn-ink min-w-[15rem] text-[1.05rem]' disabled={sending} aria-disabled={sending}>
          {sending ? copy.sending : copy.submit}
          {!sending ? (
            <span className='arrow' aria-hidden='true'>
              →
            </span>
          ) : null}
        </button>
        <p id={`${formId}-privacy`} className='max-w-[26rem] text-[0.88rem] leading-snug text-ink-soft'>
          {copy.privacyNote.replace(' See the privacy notice.', '')}{' '}
          <Link to='/privacy' className='link'>
            Privacy notice
          </Link>
          .
        </p>
      </div>

      <div role='alert' aria-live='assertive' className='mt-5 empty:hidden'>
        {phase === 'failed' ? <FormNotice>{copy.failed}</FormNotice> : null}
        {phase === 'rate_limited' ? <FormNotice>{contactCopy(copy.rateLimited)}</FormNotice> : null}
      </div>
    </form>
  );
}

function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className='border-l-2 border-accent bg-accent-wash px-4 py-3 text-[0.98rem] text-ink'>
      {children}
    </p>
  );
}

function TextField({
  id,
  label,
  hint,
  error,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ');
  return (
    <div>
      <div className='flex items-baseline justify-between gap-4'>
        <label htmlFor={id} className='text-[1.05rem]'>
          {label}
        </label>
        {hint ? (
          <span id={`${id}-hint`} className='text-[0.88rem] text-ink-soft'>
            {hint}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        type='text'
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className='field-input mt-1.5 h-12 border-b px-0.5'
        {...input}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className='mt-2 flex gap-2 text-[0.92rem] text-accent'>
      <span aria-hidden='true' className='mono'>
        ✕
      </span>
      {error}
    </p>
  );
}

/** Announces the remaining characters only at a few thresholds, not every keystroke. */
function CountAnnouncer({ used }: { used: number }) {
  const left = FIELD_LIMITS.intendedUse - used;
  const message =
    left < 0
      ? `Over the ${FIELD_LIMITS.intendedUse}-character limit`
      : left <= 20
        ? '20 or fewer characters left'
        : left <= 50
          ? '50 or fewer characters left'
          : left <= 100
            ? '100 or fewer characters left'
            : '';
  return (
    <span className='visually-hidden' aria-live='polite'>
      {message}
    </span>
  );
}
