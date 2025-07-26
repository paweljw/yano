# Daily Reset Cron Job Setup

YaNo implements a lazy evaluation system that automatically resets tasks when users access the app each day. However, for a more precise midnight reset, you can set up a cron job.

## How the Daily Reset Works

At midnight (or first access of the day):
- **PAUSED** tasks → **TODAY** (user was actively working on them)
- **TODAY** tasks (not started) → **INBOX** (user didn't get to them)
- Expired **postponedUntil** dates are cleared

## Setting Up the Cron Job

### Option 1: Docker Deployment

Add this to your `docker-compose.yml`:

```yaml
services:
  cron:
    image: mcuadros/ofelia:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      ofelia.job-exec.daily-reset.schedule: "0 0 * * *"
      ofelia.job-exec.daily-reset.command: "curl -X POST http://yano-app:3000/api/cron/daily-reset -H 'x-cron-secret: ${CRON_SECRET}'"
```

### Option 2: System Cron (Linux/Mac)

Add to crontab:
```bash
0 0 * * * curl -X POST https://your-domain.com/api/cron/daily-reset -H "x-cron-secret: your-secret"
```

### Option 3: GitHub Actions

Create `.github/workflows/daily-reset.yml`:
```yaml
name: Daily Task Reset
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger daily reset
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/daily-reset \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

### Option 4: External Services

Services like [cron-job.org](https://cron-job.org) or [Upstash](https://upstash.com) can call the endpoint.

## Security

1. Set `CRON_SECRET` environment variable
2. Uncomment the security check in `/src/app/api/cron/daily-reset/route.ts`
3. Consider IP allowlisting for additional security

## Testing

Test the endpoint manually:
```bash
curl -X POST http://localhost:3000/api/cron/daily-reset
```