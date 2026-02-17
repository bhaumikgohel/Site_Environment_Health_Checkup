# SOP: Automated Health Check Logic

## Overview
This SOP defines the logic for validating the health of the QA environment. The execution is split into UI validation and backend handshake.

## Layer Sequence
1.  **URL Ping**: Verify HTTP 200.
2.  **UI Element Check**: Verify input fields and buttons are visible.
3.  **Auth Handshake**: 
    - Attempt login with invalid credentials to verify error handling.
    - Attempt login with valid credentials (from `.env`) to verify dashboard access.
4.  **Post-Login Validation**: Verify URL transition and key dashboard elements.
5.  **Console Error Log**: Capture and report any critical browser console errors.

## Input Requirements
- `BASE_URL`: Target site root.
- `LOGIN_USERNAME`: Valid user.
- `LOGIN_PASSWORD`: Valid password.
- Selectors for username, password, login button, and error message.

## Edge Cases
- **Network Timeout**: If the site takes > 30s to load, fail with a "Network Timeout" status.
- **Maintenance Page**: If the page loads but login fields are missing, fail with "Maintenance Mode/UI Layout Change".
- **Invalid Auth**: If invalid credentials *do not* produce an error, mark as "Security/Validation Warning".

## Reporting
- results must be aggregated into a JSON object for Layer 3 processing.
