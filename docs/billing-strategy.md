# Billing strategy

## Launch approach

SpriteSmith will use credits for all generation. This avoids an unlimited plan whose API cost can grow without a cap, while still giving regular users a predictable monthly allowance.

- **Subscriptions** replenish credits every month and include saved-sprite storage.
- **Credit packs** let users top up for a busy project.
- Purchased credits do not expire.
- Subscription credits roll over for one additional month only.
- Payments and credit grants will be handled by Stripe Checkout and verified Stripe webhooks. The webhook, rather than the browser, must be the authority that adds credits.

## Generation credit costs

| Quality  | Credits | Purpose                        |
| -------- | ------: | ------------------------------ |
| Draft    |       1 | Quickly explore an idea.       |
| Standard |       4 | A polished, everyday sprite.   |
| High     |      16 | Final-detail asset generation. |

These values deliberately follow the approximate scaling between generation quality levels. Revisit the credit price whenever the configured image model, output size, or API pricing changes.

## Proposed public pricing

### Credit packs

| Pack          |  Price | Intended use         |
| ------------- | -----: | -------------------- |
| 100 credits   |  $4.99 | Occasional projects  |
| 400 credits   | $14.99 | Regular creation     |
| 1,000 credits | $29.99 | Larger asset batches |

### Monthly subscriptions

| Plan    |     Price | Monthly credits | Stored sprites |
| ------- | --------: | --------------: | -------------: |
| Hobby   |  $9/month |             250 |         250 MB |
| Creator | $19/month |             700 |           1 GB |
| Studio  | $49/month |           2,000 |           5 GB |

Credit packs remain available to subscribers.

## Safety and launch controls

- Keep the current 20-credit balance for private testing; reduce the public trial to 5–10 credits per verified new user.
- Do not enable checkout until actual image API, storage, egress, retry, support, payment-processing, and tax costs have been measured.
- Review margins monthly and change **future** pricing only; do not retroactively remove purchased credits.
- Require an account for every generation, enforce server-side credit reservations, and refund credits when a generation fails.
