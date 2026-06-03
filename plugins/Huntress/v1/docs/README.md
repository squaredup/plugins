# Before you start

To connect SquaredUp to Huntress, you will need to generate API credentials.

## Generate API credentials

1. Log in to your Huntress account at `https://<your_account_subdomain>.huntress.io`.
2. Open the dropdown menu at the top-right corner of the site header and select **API Credentials**.
3. Click on the **Setup** (or **Create API Credential**) button.
4. Click the **Generate** button to create a public and private key pair for Huntress API access.

You will receive a **Public Key** and a **Private Key**. These will act as your `publicKey` and `privateKey` in SquaredUp.
**Important:** Make sure to copy the private key immediately, as it may only be displayed once!

The default account-level credential is read-only, which is all this plugin needs.

## Configure the plugin

1. Add the **Huntress** plugin in SquaredUp.
2. Enter the **Public Key** and **Private Key** generated from Huntress.
3. Save the configuration to begin querying your agents, organizations, and incident reports.

## Rate limits

The Huntress API is limited to 60 requests per minute on a sliding window. Initial syncs of large environments (thousands of agents or many incident reports) may take longer to complete as the plugin paginates within this limit.