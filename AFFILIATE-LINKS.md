# Affiliate Link Standard & Compliance Guidelines

## Overview
This document outlines the standard pattern for rendering external links and affiliate links on Prole Adventures. To protect the site from search engine penalties (Google Link Spam Guidelines) and ensure user security, all external links must adhere to strict attribute policies.

---

## Technical Link Attributes Standard

### 1. Affiliate / Commercial Links
Any link associated with an affiliate, referral, sponsored, or commercial partnership:
* **`rel="sponsored noopener noreferrer"`**:
  - `sponsored`: Explicitly signals to Google and other search engines that compensation/commission is associated with this link, ensuring compliance with Google Search Essentials.
  - `noopener`: Prevents cross-origin tab-jacking security vulnerabilities (`window.opener`).
  - `noreferrer`: Protects user privacy across browser contexts.
* **`target="_blank"`**: Opens link in a new browser tab.

### 2. Standard External Links
Any non-commercial external link (e.g., open-source docs, manufacturer specifications, research papers):
* **`rel="noopener noreferrer"`**: Security & privacy attributes without the `sponsored` flag.
* **`target="_blank"`**: Opens link in a new browser tab.

---

## Component Implementation (`<GearLink />`)

All gear item links are rendered via the centralized [`src/components/GearLink.tsx`](file:///c:/Users/Deano/Desktop/THE%20WEBSITE/web-main/src/components/GearLink.tsx) component.

### Data Model (`public/data/current_gear.json`)
When adding new gear items to `public/data/current_gear.json`, specify one of the following link fields:

```json
{
  "id": "gear_006",
  "name": "Example Adventure Item",
  "category": "protection",
  "price": "£49.99",
  "affiliateUrl": "https://example.com/refer/12345",
  "externalUrl": "https://manufacturer.com/specs"
}
```

| Field Name | Type | Behavior |
| :--- | :--- | :--- |
| `affiliateUrl` | `string` | **Primary key** for commercial referral links. Rendered with `rel="sponsored noopener noreferrer"`. |
| `affiliate_link` | `string` | **Legacy key fallback**. Automatically treated as an affiliate link for backward compatibility. |
| `externalUrl` | `string` | **Non-commercial key**. Rendered with `rel="noopener noreferrer"`. |
| `isAffiliate` | `boolean` | **Explicit override flag**. Set `true` or `false` if URL sponsorship status is ambiguous. |
