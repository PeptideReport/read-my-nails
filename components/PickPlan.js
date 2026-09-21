'use client';
// A "Choose" button on a pricing card: selects that plan in the checkout form below and scrolls to it.
export default function PickPlan({ plan, className = 'btn ghost sm', children }) {
  return <a className={className} href="#signup" style={{ alignSelf: 'flex-start' }} onClick={() => { try { window.dispatchEvent(new CustomEvent('rmn:plan', { detail: plan })); } catch (e) {} }}>{children}</a>;
}
