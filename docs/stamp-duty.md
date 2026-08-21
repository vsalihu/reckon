# Stamp duty — three separate tax systems

Status: Phase 5. Implementation: `src/lib/stamp-duty/`.

## Why this isn't one calculator with a nation dropdown

England & Northern Ireland (Stamp Duty Land Tax), Scotland (Land and
Buildings Transaction Tax), and Wales (Land Transaction Tax) are three
genuinely separate taxes — different legislation, different bands,
different reliefs, administered by different bodies (HMRC, Revenue
Scotland, the Welsh Revenue Authority). They are **not** minor variations
on one formula, and treating them that way is exactly how this kind of
calculator gets subtly wrong. Each nation has its own rate config file
(`rates.sdlt.2025.ts`, `rates.lbtt.2024.ts`, `rates.ltt.2024.ts`) and its
own calculation function in `calculate.ts`; nothing is shared between
them except the generic "add up progressive bands" arithmetic, which is
genuinely identical shape everywhere (just different numbers).

All rates below were verified against the relevant government source
(gov.uk, revenue.scot, gov.wales) in August 2026, cross-checked against
at least one independent search per figure. None of these taxes are
organised by UK tax year (unlike Income Tax) — they apply to any
transaction from their effective date forward, until the next Budget
changes them. Revisit whenever a Budget (UK, Scottish, or Welsh) touches
property tax.

## England & Northern Ireland — SDLT

| Band | Rate |
|---|---|
| Up to £125,000 | 0% |
| £125,001–£250,000 | 2% |
| £250,001–£925,000 | 5% |
| £925,001–£1,500,000 | 10% |
| Above £1,500,000 | 12% |

**First-time buyer relief** (only if price ≤ £500,000 — above that,
standard bands apply in full instead):

| Band | Rate |
|---|---|
| Up to £300,000 | 0% |
| £300,001–£500,000 | 5% |

**Additional-property surcharge**: +5% of the **full price**, added to
whatever the standard bands produce (not the FTB bands — additional
property and first-time-buyer are mutually exclusive in practice; see
below).

## Scotland — LBTT

| Band | Rate |
|---|---|
| Up to £145,000 | 0% |
| £145,001–£250,000 | 2% |
| £250,001–£325,000 | 5% |
| £325,001–£750,000 | 10% |
| Above £750,000 | 12% |

**First-time buyer relief**: raises the nil-rate band ceiling from
£145,000 to £175,000 — everything above that uses the normal bands
unchanged. Worth up to £600.

**Additional Dwelling Supplement (ADS)**: 8% of the **full price**, from
£0 — there's no nil band for the supplement itself, unlike the standard
bands. Added on top of standard LBTT.

## Wales — LTT

| Band | Rate |
|---|---|
| Up to £225,000 | 0% |
| £225,001–£400,000 | 6% |
| £400,001–£750,000 | 7.5% |
| £750,001–£1,500,000 | 10% |
| Above £1,500,000 | 12% |

**First-time buyer relief: none.** Confirmed explicitly on gov.wales —
all buyers pay the same standard rates. The £225,000 nil band means many
first-time buyers happen to pay nothing, but that's the general
threshold doing the work, not a targeted relief. The app still asks the
first-time-buyer question for UI consistency across all three
calculators, but it has no effect on the Welsh result — and says so.

**Higher rates for additional properties — a genuinely separate band
table**, not a flat surcharge on the standard bands:

| Band | Rate |
|---|---|
| Up to £180,000 | 5% |
| £180,001–£250,000 | 8.5% |
| £250,001–£400,000 | 10% |
| £400,001–£750,000 | 12.5% |
| £750,001–£1,500,000 | 15% |
| Above £1,500,000 | 17% |

This is the one place where "just add a percentage" would actually give
a wrong answer with a wrong shape, not just a wrong number — the higher
rates aren't proportional to the standard ones. `calculate.ts` uses
`higherBands` directly rather than computing standard-plus-a-surcharge.

## First-time buyer vs additional property

The brief asks for both questions in every calculator. In reality these
are mutually exclusive — buying an additional property (a second home,
buy-to-let) implies you already own a home, so you can't simultaneously
be a first-time buyer. If a caller somehow sets both flags,
`calculateStampDuty()` treats `isAdditionalProperty` as authoritative,
since owning another property is the fact that actually governs tax
treatment in all three systems; first-time-buyer relief is designed for
people who don't already own anywhere.

## Estimate scope

This models the standard residential case only: single freehold
residential property, no shared ownership, no multiple-dwellings relief,
no non-resident surcharge (a further 2% in England/NI for non-UK
residents), no commercial/mixed-use rates. Labelled as an estimate in
the UI for the same reason every other calculator in this app is.
