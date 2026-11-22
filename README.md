# clearframe-web
Clearframe Web designs and builds websites, online stores, and landing pages for small businesses.

## Review before publishing

Open a pull request to `main` for the version you plan to publish. The **Website review** workflow checks each HTML page and stylesheet for broken local references and duplicate IDs. It also flags items to check by hand, including missing page titles, image descriptions, form labels and fragment targets. Find the results under the pull request’s **Checks** tab or run `python3 scripts/review_site.py .` from the repository root with Python 3.9 or newer.

Fix each error and rerun the checks. For each new website version, inspect the changed pages and work through the [reviewer guide](docs/website-review.md). Leave a written decision on the pull request with the exact commit reviewed, preview URL, and the outcome of manual checks. Repeat the relevant review after changes. Merge for release after the checks pass, blocking flaws are fixed, and the preview is approved.

GitHub reports the workflow result on the pull request. To make the check a requirement for merging, add **Static website checks** to the required status checks for `main` in the repository ruleset and require pull requests for changes to `main`.
