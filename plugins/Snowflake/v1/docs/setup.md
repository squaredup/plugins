# Before you start

## Creating an OAuth integration in Snowflake

The Snowflake data source authenticates using OAuth.

Before configuring the data source you will need to register SquaredUp with your Snowflake account by creating a custom integration.

Sample Snowflake commands for creating the integration are provided below.

For more information on creating a Snowflake integration see:
https://docs.snowflake.com/en/sql-reference/sql/create-security-integration-oauth-snowflake


If your SquaredUp account is in the US region (default):

```
CREATE SECURITY INTEGRATION oauth_squaredup
  TYPE = oauth
  OAUTH_CLIENT = custom
  OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
  OAUTH_REDIRECT_URI = 'https://app.squaredup.com/settings/pluginsoauth2'
  COMMENT = 'Used by SquaredUp to connect to this Snowflake account'
```

If your SquaredUp account is in the EU region:

```
CREATE SECURITY INTEGRATION oauth_squaredup
  TYPE = oauth
  OAUTH_CLIENT = custom
  OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
  OAUTH_REDIRECT_URI = 'https://eu.app.squaredup.com/settings/pluginsoauth2'
  COMMENT = 'Used by SquaredUp to connect to this Snowflake account'
```

Once your integration is created, run:

```
SELECT
    oauth:OAUTH_CLIENT_SECRET::STRING AS OAUTH_CLIENT_SECRET,
    oauth:OAUTH_CLIENT_ID::STRING AS OAUTH_CLIENT_ID
FROM (SELECT PARSE_JSON(SYSTEM$SHOW_OAUTH_CLIENT_SECRETS('oauth_squaredup')) AS oauth)

```

Use the values of the `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` columns in your configuration below. 


## Creating a read-only user

To connect to Snowflake you will need the credentials for a Snowflake user.

By default, it is NOT possible to connect via OAuth using an ACCOUNTADMIN role. Snowflake automatically adds privileged roles to the blocked role list used for OAuth authorization, see https://docs.snowflake.com/en/sql-reference/parameters#oauth-add-privileged-roles-to-blocked-list

We recommend a dedicated 'squaredup' user account that is assigned read only role. For more information on Snowflake users and roles, see https://docs.snowflake.com/en/user-guide/security-access-control-configure.

Ensure the user has a default role set, or specify the role when configuring the data source (see below). If the user does not have a default role and no role is specified, the connection will use the PUBLIC role, which typically does not have any permissions to databases.


# Configuration

## Snowflake account identifier

Enter your Snowflake account identifier.

This can be found in the Snowflake portal under 'Your Username' > Account > Account Identifier.

The account identifier is in the format <org_name>-<account_name>.

For example: `ABCDEFG-XYZ12345`

Alternatively, run the following Snowflake query:

```
SELECT CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME();
```

## Snowflake OAuth client ID

The client ID for your Snowflake OAuth application.

Enter the `OAUTH_CLIENT_ID` value from the integration you created above.

## Snowflake OAuth client secret

The client secret for your Snowflake OAuth application.

Enter the `OAUTH_CLIENT_SECRET` value from the integration you created above.

## Role (optional)

Restrict OAuth connection to a specific role. If not specified, the user's default role is used.

If you have created a custom role for your database, for example a read-only role, enter its name here.

## Authorize

Click the Sign-in button to authorize SquaredUp to access Snowflake.
