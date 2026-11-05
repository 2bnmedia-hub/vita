/** Server-side validation for the public contact form (the browser `required` attrs are not a control). */
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

export type ContactInput = { name: string; email: string; phone: string | null; message: string };
export type ContactResult = { ok: true; value: ContactInput } | { ok: false; error: string; spam?: true };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateContact(body: any): ContactResult {
  // Honeypot: a field real users never see or fill.
  if (str(body?.website)) return { ok: false, error: "spam", spam: true };
  const name = str(body?.name);
  const email = str(body?.email).toLowerCase();
  const phone = str(body?.phone);
  const message = str(body?.message);
  if (name.length < 2 || name.length > 100) return { ok: false, error: "נא למלא שם מלא תקין" };
  if (email.length > 200 || !EMAIL_RE.test(email)) return { ok: false, error: "נא למלא כתובת אימייל תקינה" };
  if (phone && !PHONE_RE.test(phone)) return { ok: false, error: "מספר הטלפון אינו תקין" };
  if (message.length < 2 || message.length > 5000) return { ok: false, error: "נא לכתוב הודעה (עד 5000 תווים)" };
  return { ok: true, value: { name, email, phone: phone || null, message } };
}
