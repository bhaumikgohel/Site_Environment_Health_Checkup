# Project Constitution: Environment Health Checkup

## Data Schemas

### Health Check Configuration (JSON)
```json
{
  "url": "string",
  "credentials": {
    "username": "string",
    "password": "string"
  },
  "selectors": {
    "username": "string",
    "password": "string",
    "loginButton": "string"
  },
  "postLoginUrl": "string",
  "apiEndpoints": [
    {
      "name": "string",
      "url": "string",
      "method": "GET"
    }
  ]
}
```

### Health Check Result (JSON)
```json
{
  "status": "Healthy | Degraded | Broken",
  "checks": [
    {
      "name": "UI URL",
      "status": "Pass | Fail",
      "latency": "number (ms)",
      "notes": "string"
    },
    {
      "name": "Login",
      "status": "Pass | Fail",
      "latency": "number (ms)",
      "notes": "string"
    }
  ]
}
```

## Behavioral Rules
- **Non-Destructive**: Health checks must never modify data in the target environment.
- **Strict Timeouts**:
    - URL connectivity: 5s max.
    - API success: <= 3s.
    - API warning: >= 5s.
- **Silent Failures**: Log all errors but ensure the report is always generated even if a check fails.
- **No Placeholders**: Never use placeholder URLs or credentials in final tools.

## Architectural Invariants
- **Layered Logic**: Browser checks (Playwright) must be isolated from API/DB checks.
- **deterministic tools**: Scripts in `tools/` must return predictable JSON outputs.
- **Pre-execution validation**: Check connectivity before attempting login flows.
