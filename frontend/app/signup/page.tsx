"use client";

import { ArrowLeft, ArrowRight, BriefcaseBusiness, ChevronDown, Eye, EyeOff, Leaf, LockKeyhole, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { getAllStates, getDistricts } from "india-state-district";
import ThemeToggle from "@/components/theme-toggle";
import { signUp } from "@/lib/auth";

const indianStates = getAllStates();
const officerPositions = [
  "District Collector",
  "Land Acquisition Officer",
  "Revenue Officer",
  "Sub-Divisional Officer",
  "Tehsildar",
  "Survey Officer",
  "Project Officer",
  "Other",
];

function SignupSelect({
  id,
  label,
  value,
  placeholder,
  options,
  icon: Icon,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  icon: typeof MapPin;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    (selectedOption ?? menuRef.current?.querySelector<HTMLButtonElement>("button"))?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !selectRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === "ArrowDown"
      ? (currentIndex + 1) % buttons.length
      : (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }

  return (
    <div className="signup-select" ref={selectRef}>
      <button
        aria-controls={`${id}-options`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        aria-required="true"
        className="login-input-wrap signup-select-trigger"
        disabled={disabled}
        id={id}
        onClick={() => setOpen((isOpen) => !isOpen)}
        role="combobox"
        type="button"
      >
        <Icon aria-hidden="true" size={15} />
        <span className={value ? "" : "signup-select-placeholder"}>{value || placeholder}</span>
        <ChevronDown aria-hidden="true" className={`signup-select-chevron ${open ? "signup-select-chevron-open" : ""}`} size={14} />
      </button>
      {open && (
        <div
          aria-label={`${label} options`}
          className="signup-select-menu"
          id={`${id}-options`}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={value === option}
              className="signup-select-option"
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [otherPosition, setOtherPosition] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedState = indianStates.find((option) => option.name === state);
  const districts = selectedState ? getDistricts(selectedState.code) : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const officerPosition = position === "Other" ? otherPosition.trim() : position;
    if (!officerPosition) {
      setError("Please select or enter your position.");
      return;
    }
    if (!state || !district) {
      setError("Please select your state and district.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name, email, password, position: officerPosition, state, district });
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-topbar">
        <Link className="login-brand" href="/"><span className="login-brand-mark"><Leaf size={16} /></span><span>Bhoomi</span></Link>
        <ThemeToggle />
      </div>
      <section className="login-layout">
        <div className="login-story">
          <div className="login-story-kicker"><span /> A SHARED GROUND FOR PROGRESS</div>
          <h1>Bring your work<br />into <em>clear focus.</em></h1>
          <p>Create an account to join Bhoomi and see projects, places and people in one thoughtful view.</p>
          <div className="login-orbit-scene" aria-hidden="true">
            <div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><div className="orbit-ring orbit-ring-three" />
            <div className="orbit-core"><Leaf size={25} /></div>
            <span className="orbit-node orbit-node-one"><LockKeyhole size={13} /></span>
            <span className="orbit-node orbit-node-two"><ShieldCheck size={13} /></span>
            <span className="orbit-node orbit-node-three"><Leaf size={13} /></span>
            <span className="orbit-caption orbit-caption-one">SECURE BY DESIGN</span>
            <span className="orbit-caption orbit-caption-two">BUILT AROUND PEOPLE</span>
          </div>
          <div className="login-story-footer"><span><i /> ROLE-BASED ACCESS</span><span><i /> DISTRICT-AWARE</span><span><i /> MADE FOR INDIA</span></div>
        </div>
        <div className="login-form-side">
          <div className="login-form-card">
            <Link className="login-back" href="/"><ArrowLeft size={14} /> Back to overview</Link>
            <h2>Create your account<span>.</span></h2>
            <p>Set up your Bhoomi workspace profile.</p>
            <form onSubmit={handleSubmit}>
              <label className="login-label" htmlFor="name">Full name</label>
              <div className="login-input-wrap"><UserRound size={16} /><input autoComplete="name" id="name" maxLength={120} minLength={2} onChange={(event) => setName(event.target.value)} placeholder="Your name" required value={name} /></div>
              <label className="login-label signup-field-label" htmlFor="email">Work email</label>
              <div className="login-input-wrap"><Mail size={16} /><input autoComplete="email" id="email" maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="you@department.gov.in" required type="email" value={email} /></div>
              <label className="login-label signup-field-label" htmlFor="position">Position / designation</label>
              <div className="login-input-wrap"><BriefcaseBusiness size={16} /><select autoComplete="organization-title" id="position" onChange={(event) => setPosition(event.target.value)} required value={position}><option disabled value="">Select your position</option>{officerPositions.map((option) => <option key={option} value={option}>{option === "Other" ? "Other (enter position)" : option}</option>)}</select></div>
              {position === "Other" && <div className="login-input-wrap signup-other-position"><BriefcaseBusiness size={16} /><input autoComplete="organization-title" aria-label="Enter your position" maxLength={160} onChange={(event) => setOtherPosition(event.target.value)} placeholder="Enter your position" required value={otherPosition} /></div>}
              <div className="signup-field-row">
                <div>
                  <label className="login-label signup-field-label" htmlFor="state">State</label>
                  <SignupSelect
                    id="state"
                    icon={MapPin}
                    label="State"
                    onChange={(value) => {
                      setState(value);
                      setDistrict("");
                    }}
                    options={indianStates.map((option) => option.name)}
                    placeholder="Select state / UT"
                    value={state}
                  />
                </div>
                <div>
                  <label className="login-label signup-field-label" htmlFor="district">District</label>
                  <SignupSelect
                    disabled={!selectedState}
                    id="district"
                    icon={MapPin}
                    label="District"
                    onChange={setDistrict}
                    options={districts}
                    placeholder={selectedState ? "Select district" : "Select a state first"}
                    value={district}
                  />
                </div>
              </div>
              <label className="login-label signup-field-label" htmlFor="password">Password</label>
              <div className="login-input-wrap"><LockKeyhole size={16} /><input autoComplete="new-password" id="password" maxLength={128} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="password-visibility" onClick={() => setShowPassword(!showPassword)} type="button">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
              <label className="login-label signup-field-label" htmlFor="confirm-password">Confirm password</label>
              <div className="login-input-wrap"><LockKeyhole size={16} /><input autoComplete="new-password" id="confirm-password" maxLength={128} minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required type={showPassword ? "text" : "password"} value={confirmPassword} /></div>
              {error && <p className="login-error" role="alert">{error}</p>}
              <button className="button button-primary login-submit" disabled={submitting} type="submit">{submitting ? "Creating account…" : "Create account"} {!submitting && <ArrowRight size={15} />}</button>
            </form>
            <div className="login-security"><ShieldCheck size={15} /><span>Account access is secured and scoped to your role.</span></div>
            <div className="login-demo-note">Already have an account? <Link href="/login">Sign in <ArrowRight size={12} /></Link></div>
          </div>
        </div>
      </section>
      <footer className="login-footer"><span>© 2025 Bhoomi · Land, managed with care.</span><span>Designed for the people who move India forward.</span></footer>
    </main>
  );
}
