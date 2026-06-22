export type SignUpFormInput = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignUpFormErrors = Partial<Record<keyof SignUpFormInput, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUpForm(input: SignUpFormInput): SignUpFormErrors {
  const errors: SignUpFormErrors = {};
  const email = input.email.trim();

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = "auth.invalidEmail";
  }
  if (input.password.length < 8) {
    errors.password = "auth.passwordMinLength";
  }
  if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "auth.passwordMismatch";
  }

  return errors;
}
