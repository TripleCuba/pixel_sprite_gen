const normaliseEmail = (email: string) => email.trim().toLowerCase();

const getAllowedEmails = () =>
  new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map(normaliseEmail)
      .filter(Boolean),
  );

export const hasAllowedEmails = () => getAllowedEmails().size > 0;

export const isEmailAllowed = (email: string | null | undefined) =>
  Boolean(email && getAllowedEmails().has(normaliseEmail(email)));
