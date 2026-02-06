## Overview

A plugin for Twilio SendGrid, a popular SMTP server.

The plugin provides email send stats and unsubscribes, allowing software and marketing teams to report on email performance.

## Setup

Authentication is via API key.

Create an API key in https://app.sendgrid.com/settings/api_keys

Select 'Custom Access' and configure the following permissions:
- Stats (read-only)
- Suppressions (read-only)

## Known limitations

Account credits cannot be monitored using this plugin. Although an API endpoint is available, it seems to require an API key with full admin access.