# E2E Analytics Test Setup

Some e2e coverage depends on the analytics configuration being documented and present
in the runtime environment. Currently the required secret key is missing from the setup
docs, so the analytics e2e suite is skipped.

## Required config for this e2e suite

Set the following values in your environment or `.env.local`:

- `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- `NEXT_PUBLIC_ANALYTICS_SITE_ID`
- `NEXT_PUBLIC_ANALYTICS_SCRIPT` when using a custom endpoint

Update this README section as those values are finalized/administered.
