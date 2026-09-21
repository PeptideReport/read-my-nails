import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';

// GET ?id=cs_... → { email }  (only the email, so the welcome page can prefill the login form)
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({});
  try {
    const s = await stripe().checkout.sessions.retrieve(id);
    return NextResponse.json({ email: s.customer_details?.email || s.customer_email || '' });
  } catch (e) { return NextResponse.json({}); }
}
