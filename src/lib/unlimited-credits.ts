const normaliseEmail = (email: string) => email.trim().toLowerCase();

const getUnlimitedCreditEmails = () =>
  new Set(
    (process.env.UNLIMITED_CREDIT_EMAILS ?? "")
      .split(",")
      .map(normaliseEmail)
      .filter(Boolean),
  );

// This is deliberately separate from ALLOWED_EMAILS. Access to the private app
// must never automatically grant unlimited paid usage to every tester.
export const hasUnlimitedCredits = (email: string | null | undefined) =>
  Boolean(email && getUnlimitedCreditEmails().has(normaliseEmail(email)));
