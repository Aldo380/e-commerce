# Specification

## Summary
**Goal:** Add donation functionality to the store, allowing users to make custom donations using Stripe or Coinbase ICP payment methods.

**Planned changes:**
- Add a donation button to the store header navigation
- Create a donation page with custom amount input and payment method selection (Stripe/Coinbase ICP)
- Implement backend donation processing endpoint that creates donation records and handles payments
- Add React Query hooks for donation operations (useDonation, useDonationHistory)
- Add donation history section to the Orders page showing past donations with amount, date, and payment method

**User-visible outcome:** Users can click a donation button in the header, enter a custom donation amount, select their preferred payment method (Stripe or Coinbase ICP), complete the donation, and view their donation history on the Orders page.
