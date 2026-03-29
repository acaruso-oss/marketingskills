#!/usr/bin/env node
/**
 * HubSpot MCP Server - stdio transport
 *
 * Zero-dependency Node.js 18+ MCP server for HubSpot CRM.
 * Implements the Model Context Protocol (MCP) over stdio using JSON-RPC 2.0.
 *
 * Setup:
 *   1. Create a Private App in HubSpot: Settings > Integrations > Private Apps
 *   2. Grant scopes: crm.objects.contacts.read, crm.objects.contacts.write,
 *      crm.objects.companies.read, crm.objects.deals.read, crm.objects.deals.write,
 *      crm.objects.tickets.read, crm.objects.owners.read
 *   3. Copy the access token
 *   4. Set HUBSPOT_API_TOKEN=<your_token> in your environment
 *
 * Claude Code claude_desktop_config.json entry:
 *   {
 *     "mcpServers": {
 *       "hubspot-business2": {
 *         "command": "node",
 *         "args": ["/path/to/marketingskills/tools/mcp/hubspot.js"],
 *         "env": { "HUBSPOT_API_TOKEN": "pat-na1-xxxx" }
 *       }
 *     }
 *   }
 */

const TOKEN = process.env.HUBSPOT_API_TOKEN
const BASE_URL = 'https://api.hubapi.com'

if (!TOKEN) {
  process.stderr.write(JSON.stringify({ error: 'HUBSPOT_API_TOKEN environment variable required' }) + '\n')
  process.exit(1)
}

// ── HubSpot API helper ────────────────────────────────────────────────────────

async function hubspot(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    if (!res.ok) return { _error: true, status: res.status, ...data }
    return data
  } catch {
    return { _error: true, status: res.status, body: text }
  }
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_contacts',
    description: 'List contacts from HubSpot CRM with optional pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of contacts to return (max 100, default 10)' },
        after: { type: 'string', description: 'Pagination cursor from previous response' },
        properties: { type: 'string', description: 'Comma-separated list of properties to return (e.g. "email,firstname,lastname,company")' },
      },
    },
  },
  {
    name: 'search_contacts',
    description: 'Search contacts by email, name, or full-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text search query' },
        email: { type: 'string', description: 'Exact email match filter' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'get_contact',
    description: 'Get a single contact by HubSpot contact ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'HubSpot contact ID' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in HubSpot CRM.',
    inputSchema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', description: 'Contact email address' },
        firstname: { type: 'string', description: 'First name' },
        lastname: { type: 'string', description: 'Last name' },
        company: { type: 'string', description: 'Company name' },
        phone: { type: 'string', description: 'Phone number' },
        lifecyclestage: { type: 'string', description: 'Lifecycle stage (e.g. lead, customer, subscriber)' },
      },
    },
  },
  {
    name: 'update_contact',
    description: 'Update properties on an existing HubSpot contact.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'HubSpot contact ID' },
        email: { type: 'string' },
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        company: { type: 'string' },
        phone: { type: 'string' },
        lifecyclestage: { type: 'string' },
      },
    },
  },
  {
    name: 'get_companies',
    description: 'List companies from HubSpot CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of companies to return (max 100, default 10)' },
        after: { type: 'string', description: 'Pagination cursor' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'search_companies',
    description: 'Search companies by name, domain, or full-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text search query' },
        domain: { type: 'string', description: 'Exact domain match filter' },
        limit: { type: 'number', description: 'Max results (default 10)' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'get_deals',
    description: 'List deals from HubSpot CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of deals to return (max 100, default 10)' },
        after: { type: 'string', description: 'Pagination cursor' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'search_deals',
    description: 'Search deals by name, stage, or full-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text search query' },
        stage: { type: 'string', description: 'Deal stage filter (e.g. appointmentscheduled, closedwon)' },
        limit: { type: 'number', description: 'Max results (default 10)' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'get_deal',
    description: 'Get a single deal by HubSpot deal ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'HubSpot deal ID' },
        properties: { type: 'string', description: 'Comma-separated properties to return' },
      },
    },
  },
  {
    name: 'create_deal',
    description: 'Create a new deal in HubSpot CRM.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Deal name' },
        amount: { type: 'string', description: 'Deal value (numeric string)' },
        stage: { type: 'string', description: 'Pipeline stage ID' },
        pipeline: { type: 'string', description: 'Pipeline ID (default: "default")' },
        closedate: { type: 'string', description: 'Expected close date (ISO 8601)' },
      },
    },
  },
  {
    name: 'get_tickets',
    description: 'List support tickets from HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of tickets to return (max 100, default 10)' },
        after: { type: 'string', description: 'Pagination cursor' },
      },
    },
  },
  {
    name: 'get_owners',
    description: 'List HubSpot owners (users who can be assigned to CRM records).',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Filter by owner email' },
        limit: { type: 'number', description: 'Number of owners to return' },
      },
    },
  },
]

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function callTool(name, input = {}) {
  switch (name) {
    case 'get_contacts': {
      const params = new URLSearchParams()
      params.set('limit', input.limit || 10)
      if (input.after) params.set('after', input.after)
      if (input.properties) params.set('properties', input.properties)
      return hubspot('GET', `/crm/v3/objects/contacts?${params}`)
    }
    case 'search_contacts': {
      const body = { filterGroups: [], limit: input.limit || 10 }
      if (input.email) {
        body.filterGroups.push({ filters: [{ propertyName: 'email', operator: 'EQ', value: input.email }] })
      } else if (input.query) {
        body.query = input.query
      } else {
        return { error: 'query or email required' }
      }
      if (input.properties) body.properties = input.properties.split(',')
      return hubspot('POST', '/crm/v3/objects/contacts/search', body)
    }
    case 'get_contact': {
      const params = new URLSearchParams()
      if (input.properties) params.set('properties', input.properties)
      return hubspot('GET', `/crm/v3/objects/contacts/${input.id}?${params}`)
    }
    case 'create_contact': {
      const properties = { email: input.email }
      if (input.firstname) properties.firstname = input.firstname
      if (input.lastname) properties.lastname = input.lastname
      if (input.company) properties.company = input.company
      if (input.phone) properties.phone = input.phone
      if (input.lifecyclestage) properties.lifecyclestage = input.lifecyclestage
      return hubspot('POST', '/crm/v3/objects/contacts', { properties })
    }
    case 'update_contact': {
      const properties = {}
      if (input.email) properties.email = input.email
      if (input.firstname) properties.firstname = input.firstname
      if (input.lastname) properties.lastname = input.lastname
      if (input.company) properties.company = input.company
      if (input.phone) properties.phone = input.phone
      if (input.lifecyclestage) properties.lifecyclestage = input.lifecyclestage
      return hubspot('PATCH', `/crm/v3/objects/contacts/${input.id}`, { properties })
    }
    case 'get_companies': {
      const params = new URLSearchParams()
      params.set('limit', input.limit || 10)
      if (input.after) params.set('after', input.after)
      if (input.properties) params.set('properties', input.properties)
      return hubspot('GET', `/crm/v3/objects/companies?${params}`)
    }
    case 'search_companies': {
      const body = { filterGroups: [], limit: input.limit || 10 }
      if (input.domain) {
        body.filterGroups.push({ filters: [{ propertyName: 'domain', operator: 'EQ', value: input.domain }] })
      } else if (input.query) {
        body.query = input.query
      } else {
        return { error: 'query or domain required' }
      }
      if (input.properties) body.properties = input.properties.split(',')
      return hubspot('POST', '/crm/v3/objects/companies/search', body)
    }
    case 'get_deals': {
      const params = new URLSearchParams()
      params.set('limit', input.limit || 10)
      if (input.after) params.set('after', input.after)
      params.set('properties', input.properties || 'dealname,amount,dealstage,closedate')
      return hubspot('GET', `/crm/v3/objects/deals?${params}`)
    }
    case 'search_deals': {
      const body = { filterGroups: [], limit: input.limit || 10 }
      if (input.stage) {
        body.filterGroups.push({ filters: [{ propertyName: 'dealstage', operator: 'EQ', value: input.stage }] })
      } else if (input.query) {
        body.query = input.query
      } else {
        return { error: 'query or stage required' }
      }
      if (input.properties) body.properties = input.properties.split(',')
      return hubspot('POST', '/crm/v3/objects/deals/search', body)
    }
    case 'get_deal': {
      const params = new URLSearchParams()
      if (input.properties) params.set('properties', input.properties)
      return hubspot('GET', `/crm/v3/objects/deals/${input.id}?${params}`)
    }
    case 'create_deal': {
      const properties = { dealname: input.name }
      if (input.amount) properties.amount = input.amount
      if (input.stage) properties.dealstage = input.stage
      if (input.pipeline) properties.pipeline = input.pipeline
      if (input.closedate) properties.closedate = input.closedate
      return hubspot('POST', '/crm/v3/objects/deals', { properties })
    }
    case 'get_tickets': {
      const params = new URLSearchParams()
      params.set('limit', input.limit || 10)
      if (input.after) params.set('after', input.after)
      return hubspot('GET', `/crm/v3/objects/tickets?${params}`)
    }
    case 'get_owners': {
      const params = new URLSearchParams()
      if (input.email) params.set('email', input.email)
      if (input.limit) params.set('limit', input.limit)
      return hubspot('GET', `/crm/v3/owners?${params}`)
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── MCP JSON-RPC 2.0 over stdio ───────────────────────────────────────────────

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

async function handleMessage(msg) {
  // Notifications (no id) — no response needed
  if (msg.id === undefined) return

  try {
    switch (msg.method) {
      case 'initialize':
        send({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'hubspot', version: '1.0.0' },
          },
        })
        break

      case 'tools/list':
        send({
          jsonrpc: '2.0',
          id: msg.id,
          result: { tools: TOOLS },
        })
        break

      case 'tools/call': {
        const { name, arguments: input } = msg.params
        const data = await callTool(name, input)
        send({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
            isError: !!data._error,
          },
        })
        break
      }

      default:
        send({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32601, message: `Method not found: ${msg.method}` },
        })
    }
  } catch (err) {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: -32603, message: err.message },
    })
  }
}

// Read newline-delimited JSON from stdin
let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() // keep incomplete last line
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      handleMessage(JSON.parse(trimmed))
    } catch {
      // ignore malformed input
    }
  }
})

process.stdin.on('end', () => process.exit(0))
