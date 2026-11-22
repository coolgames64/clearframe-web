# Clearframe Web release review

Before publishing or merging work intended for release, run `python3 scripts/review_site.py .` and follow [the reviewer guide](docs/website-review.md). Use its references when checking accessibility, mobile behaviour, performance, forms, checkout, privacy and search.

Review the exact release candidate. Check every page and exercise the main visitor journeys. Record automated results and manual evidence, including any applicable checks you could not verify. Describe each flaw with severity, location, reproduction steps, expected and observed behaviour, and what to retest.

Hold publication while applicable checks remain unverified or flaws are unresolved. Retest fixes on the candidate and record the reviewed commit. For paid client work, verify that the 20% start deposit and 70% after preview approval are complete before publication. The final 10% follows publication.
