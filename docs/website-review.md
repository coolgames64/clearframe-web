# Clearframe Web reviewer guide

Review the exact version the publisher plans to release. Open the preview in a clean browser and record the preview URL and commit. Walk every page listed in the navigation and every template added or changed. Follow visitors’ main journeys from the first page to their confirmation, such as finding a café menu, making an enquiry, booking, or ordering. After a change, repeat the affected journeys and check the new commit.

| What to check | How to spot flaws |
| --- | --- |
| Content and navigation | Click menus, buttons, footer links, and page anchors. Compare business details, hours, prices and offers with the client’s approved copy. Look for placeholders, missing destinations, and demos that could be mistaken for real businesses. |
| Mobile layout | Resize the preview through narrow phone and tablet widths. On a real phone, try the menu, rotate the screen, and scroll to the footer. Check for clipped text, sideways scrolling, covers that obscure buttons, and small tap targets. |
| Accessibility | Go through the page with Tab, Shift+Tab, Enter and Esc where applicable. Check visible focus, usable menus, meaningful names for controls, useful alternative text, sensible headings, readable contrast and a layout that still works at 200% zoom. |
| Forms and bookings | Use staging test details to try a blank field, an invalid value and a valid submission. Confirm useful errors, the intended confirmation and actual delivery to the correct test inbox or booking system. |
| Shop or payment | In the provider’s test environment, exercise add-to-cart, prices, quantities, totals, success, decline, cancellation and confirmation. Check that the client’s Clearframe payment agreement, if applicable, says 20% deposit to start, 70% after preview approval and before publishing, and 10% after publishing. |
| Performance and errors | Reload on a throttled mobile connection. In developer tools, look for failed requests, missing images, layout shifts and errors while completing each core task. Run Lighthouse on the preview for diagnostic leads. |
| Search, privacy and release settings | Check page titles, descriptions and public indexing settings. Confirm test accounts, personal details and secrets stay out of the build. Verify privacy copy and tracking choices against the agreed requirements, using a clean session to exercise both choices and any consent withdrawal. |

## Where to learn the checks

- [W3C accessibility quick checks](https://www.w3.org/WAI/test-evaluate/preliminary/)
- [Chrome mobile simulation](https://developer.chrome.com/docs/devtools/device-mode)
- [Chrome Network panel](https://developer.chrome.com/docs/devtools/network/overview)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [MDN form validation guide](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- [Stripe testing guide](https://docs.stripe.com/testing)
- [ICO guidance on storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)

## Report the result

For each finding, include the affected page, browser and screen size if relevant, steps to reproduce, expected and actual behavior, severity, and a screenshot or other evidence when useful. Treat a broken core journey, wrong contact or payment details, unsafe exposure, or an accessibility issue that blocks a main task as a release blocker. Keep each blocker open until a retest passes. Mark untested items explicitly and request the access or evidence needed to finish. Record **Ready to publish** only after the automated checks pass, applicable manual checks have evidence, and blocking flaws are closed.
