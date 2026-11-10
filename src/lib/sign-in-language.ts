export const SITE_LANGUAGE_KEY = 'almedalskompassen:language';

export function signInLanguage(stored: string | null, languages: readonly string[]) {
  if (stored) return stored === 'en' ? 'en' : 'sv';
  return /^en\b/i.test(languages[0] || '') ? 'en' : 'sv';
}

export const signInCopy = {
  sv: {
    in: 'Logga in', up: 'Skapa konto', forgot: 'Glömt lösenord', organizer: 'Logga in som arrangör',
    intro: 'Spara programpunkter och bygg din Min Almedalsvecka på alla dina enheter.',
    organizerIntro: 'Logga in med e-postadressen och lösenordet ni fick tillsammans med fakturan.',
    google: 'Fortsätt med Google', or: 'eller', email: 'E-post', password: 'Lösenord', send: 'Skicka länk',
    account: 'Har du konto? Logga in', forgotten: 'Glömt lösenord?', back: 'Tillbaka',
    googleError: 'Inloggningen med Google misslyckades. Försök igen.',
    linkError: 'Det gick inte att skicka länken.',
    linkSent: 'Om adressen finns får du ett mejl med en länk för att välja nytt lösenord.',
    confirm: 'Kontrollera din e-post och klicka på länken för att bekräfta kontot.',
    credentials: 'Fel e-postadress eller lösenord.',
    signupError: 'Det gick inte att skapa kontot. Kontrollera dina uppgifter och försök igen.',
    requestError: 'Något gick fel. Försök igen.',
  },
  en: {
    in: 'Sign in', up: 'Create account', forgot: 'Forgot password', organizer: 'Sign in as organiser',
    intro: 'Save events and build My Almedalen Week across all your devices.',
    organizerIntro: 'Sign in with the email address and password you received with your invoice.',
    google: 'Continue with Google', or: 'or', email: 'Email', password: 'Password', send: 'Send link',
    account: 'Already have an account? Sign in', forgotten: 'Forgot password?', back: 'Back',
    googleError: 'Google sign-in failed. Please try again.',
    linkError: 'Could not send the link.',
    linkSent: 'If the address is registered, you will receive an email with a link to choose a new password.',
    confirm: 'Check your email and click the link to confirm your account.',
    credentials: 'Incorrect email address or password.',
    signupError: 'Could not create your account. Check your details and try again.',
    requestError: 'Something went wrong. Please try again.',
  },
};