import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource.
 *
 * The app uses email sign-in and verification. This configuration enables
 * email as the sign-in alias and instructs the generated Cognito User Pool
 * to auto-verify email addresses. Adjust the options below if you want to
 * enable phone sign-in, social providers, or change password policy.
 *
 * See: https://docs.amplify.aws/react/build-a-backend/auth/
 */
export const auth = defineAuth({
  // Allow users to sign in using their email address.
  loginWith: {
    email: true,
  },
  // NOTE: email sign-in is enabled above. Advanced User Pool settings such
  // as auto-verified attributes, password policy, or identity pool wiring
  // can be adjusted via the Amplify CLI or by extending this file with the
  // exact properties accepted by `defineAuth` in your installed
  // `@aws-amplify/backend` version. Keeping the config minimal here avoids
  // typing mismatches while still enabling a standard email-based login
  // flow for the React frontend. See:
  // https://docs.amplify.aws/react/build-a-backend/auth/
});
