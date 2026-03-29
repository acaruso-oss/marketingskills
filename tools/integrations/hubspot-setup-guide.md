# HubSpot AI Assistant — Setup Guide

This guide connects your HubSpot account to Claude so you can ask questions about your CRM data in plain English.

---

## Step 1 — Get your HubSpot API token

1. Log in to your HubSpot account at **app.hubspot.com**
2. Click the **Settings** gear icon in the top-right corner
3. In the left sidebar, go to **Integrations → Private Apps**
4. Click **Create a private app**
5. Give it a name (e.g. "Claude AI Assistant")
6. Go to the **Scopes** tab and enable:
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
   - `crm.objects.tickets.read`
   - `crm.objects.owners.read`
7. Click **Create app** → **Continue creating**
8. Copy the token shown (starts with `pat-na1-...`) — save it somewhere safe

---

## Step 2 — Configure Claude

1. Open the **Claude desktop app**
2. Open the file `/home/user/.config/Claude/claude_desktop_config.json`
   - If it doesn't exist, create it
3. Paste the following, replacing `YOUR_TOKEN_HERE` with the token from Step 1:

```json
{
  "mcpServers": {
    "hubspot": {
      "command": "node",
      "args": ["/home/user/marketingskills/tools/mcp/hubspot.js"],
      "env": {
        "HUBSPOT_API_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

4. Save the file and **restart Claude**

---

## Step 3 — Start using it

Once restarted, just talk to Claude naturally. Example prompts to get started:

> "How many contacts do I have in HubSpot?"

> "Show me all open deals and their values"

> "Find the contact record for john@example.com"

> "List all companies in my CRM"

> "What deals are in the closing stage?"

> "How many contacts were added this month?"

---

## Troubleshooting

**Claude doesn't seem to know about my HubSpot data**
→ Make sure you restarted the Claude desktop app after saving the config file

**Error about the token**
→ Double-check that the token was copied in full from HubSpot (it's long — easy to miss characters)

**Can't find the config file location**
→ Send the token to Anthony and he can set it up for you

---

*Setup takes about 5 minutes. Once connected, all your HubSpot contacts, companies, deals, and tickets are queryable directly in Claude.*
