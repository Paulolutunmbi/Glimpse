import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getApiErrorMessage } from '../utils/errors';

const CODE_LENGTH = 6;

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || localStorage.getItem('pendingEmail') || '';
  const initialNotice = location.state?.notice || '';
  const codeInputs = useRef([]);
  const [email] = useState(initialEmail);
  const [codeDigits, setCodeDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const focusInput = (index) => {
    const input = codeInputs.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const fillCodeFrom = (startIndex, value) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH - startIndex).split('');
    if (digits.length === 0) {
      return;
    }

    setCodeDigits((prev) => {
      const next = [...prev];
      digits.forEach((digit, offset) => {
        next[startIndex + offset] = digit;
      });
      return next;
    });

    focusInput(Math.min(startIndex + digits.length, CODE_LENGTH - 1));
  };

  const handleCodeChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    setError('');
    setSuccess('');

    if (digits.length === 0) {
      setCodeDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (digits.length === 1) {
      setCodeDigits((prev) => {
        const next = [...prev];
        next[index] = digits;
        return next;
      });

      if (index < CODE_LENGTH - 1) {
        focusInput(index + 1);
      }
      return;
    }

    fillCodeFrom(index, digits);
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key !== 'Backspace' || codeDigits[index] !== '' || index === 0) {
      return;
    }

    focusInput(index - 1);
  };

  const handleCodePaste = (index, event) => {
    event.preventDefault();
    fillCodeFrom(index, event.clipboardData.getData('text'));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { email: email.trim(), code: codeDigits.join('').trim() };
      await API.post('/api/auth/verify', payload);
      setSuccess('Email verified. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            email: payload.email,
            notice: 'Verification complete. Please log in.',
          },
        });
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center p-md text-on-surface antialiased selection:bg-primary-container selection:text-white">
      <main className="w-full max-w-[400px] bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-xl flex flex-col items-center">
        <div className="mb-xl text-center">
          <img
            src="/images/glimpse-logo.png"
            alt="Glimpse"
            className="mx-auto h-8 w-auto object-contain"
          />
        </div>

        <h2 className="font-h2 text-h2 text-on-surface mb-sm text-center">Verify your email</h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center mb-xl">
          We sent a 6-digit code to your email. Enter it below.
        </p>

        <form className="w-full flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="flex justify-between w-full gap-xs sm:gap-sm mb-xl">
            {codeDigits.map((digit, index) => (
              <input
                key={`code-${index}`}
                ref={(input) => {
                  codeInputs.current[index] = input;
                }}
                className="w-[45px] h-[56px] sm:w-[50px] sm:h-[60px] border border-outline-variant rounded-xl text-center font-h2 text-h2 text-on-surface bg-surface-bright focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors shadow-sm"
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                placeholder="·"
                aria-label={`Verification code digit ${index + 1}`}
                value={digit}
                onChange={(event) => handleCodeChange(index, event.target.value)}
                onKeyDown={(event) => handleCodeKeyDown(index, event)}
                onPaste={(event) => handleCodePaste(index, event)}
              />
            ))}
          </div>

          {error ? (
            <div className="w-full mb-lg rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="w-full mb-lg rounded-xl border border-secondary/20 bg-secondary-container px-4 py-3 text-body-sm text-on-secondary-container">
              {success}
            </div>
          ) : null}

          <button
            className="w-full bg-primary-container text-on-primary font-label-md text-label-md py-md rounded-xl hover:bg-primary transition-all active:scale-[0.98] border-b-2 border-primary-fixed-dim shadow-sm flex justify-center items-center gap-sm disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="mt-lg flex flex-col items-center gap-md w-full">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Didn't get a code?{' '}
            <button
              className="text-primary-container font-label-md text-label-md hover:underline"
              type="button"
            >
              Resend
            </button>
          </p>
          <Link
            className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-xs transition-colors"
            to="/login"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Verify;
