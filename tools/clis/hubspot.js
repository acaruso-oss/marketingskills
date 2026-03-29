#!/usr/bin/env node

const TOKEN = process.env.HUBSPOT_API_TOKEN
const BASE_URL = 'https://api.hubapi.com'

if (!TOKEN) {
  console.error(JSON.stringify({ error: 'HUBSPOT_API_TOKEN environment variable required' }))
  process.exit(1)
}

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }
  if (args['dry-run']) {
    return { _dry_run: true, method, url, headers: { ...headers, Authorization: 'Bearer ***' }, body: body || undefined }
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { status: res.status, body: text }
  }
}

function parseArgs(argv) {
  const result = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        result[key] = next
        i++
      } else {
        result[key] = true
      }
    } else {
      result._.push(arg)
    }
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
const [cmd, sub] = args._

async function main() {
  let result

  switch (cmd) {
    case 'contacts':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.limit) params.set('limit', args.limit)
          if (args.after) params.set('after', args.after)
          if (args.properties) params.set('properties', args.properties)
          result = await api('GET', `/crm/v3/objects/contacts?${params}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          const params = new URLSearchParams()
          if (args.properties) params.set('properties', args.properties)
          result = await api('GET', `/crm/v3/objects/contacts/${args.id}?${params}`)
          break
        }
        case 'search': {
          if (!args.query && !args.email) { result = { error: '--query or --email required' }; break }
          const body = {
            filterGroups: [],
            limit: parseInt(args.limit) || 10,
          }
          if (args.email) {
            body.filterGroups.push({ filters: [{ propertyName: 'email', operator: 'EQ', value: args.email }] })
          } else {
            body.query = args.query
          }
          if (args.properties) body.properties = args.properties.split(',')
          result = await api('POST', '/crm/v3/objects/contacts/search', body)
          break
        }
        case 'create': {
          if (!args.email) { result = { error: '--email required' }; break }
          const properties = { email: args.email }
          if (args.firstname) properties.firstname = args.firstname
          if (args.lastname) properties.lastname = args.lastname
          if (args.company) properties.company = args.company
          if (args.phone) properties.phone = args.phone
          result = await api('POST', '/crm/v3/objects/contacts', { properties })
          break
        }
        case 'update': {
          if (!args.id) { result = { error: '--id required' }; break }
          const properties = {}
          if (args.email) properties.email = args.email
          if (args.firstname) properties.firstname = args.firstname
          if (args.lastname) properties.lastname = args.lastname
          if (args.company) properties.company = args.company
          if (args.phone) properties.phone = args.phone
          if (args.lifecyclestage) properties.lifecyclestage = args.lifecyclestage
          result = await api('PATCH', `/crm/v3/objects/contacts/${args.id}`, { properties })
          break
        }
        default:
          result = { error: 'Unknown contacts subcommand. Use: list, get, search, create, update' }
      }
      break

    case 'companies':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.limit) params.set('limit', args.limit)
          if (args.after) params.set('after', args.after)
          if (args.properties) params.set('properties', args.properties)
          result = await api('GET', `/crm/v3/objects/companies?${params}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          const params = new URLSearchParams()
          if (args.properties) params.set('properties', args.properties)
          result = await api('GET', `/crm/v3/objects/companies/${args.id}?${params}`)
          break
        }
        case 'search': {
          if (!args.query && !args.domain) { result = { error: '--query or --domain required' }; break }
          const body = { filterGroups: [], limit: parseInt(args.limit) || 10 }
          if (args.domain) {
            body.filterGroups.push({ filters: [{ propertyName: 'domain', operator: 'EQ', value: args.domain }] })
          } else {
            body.query = args.query
          }
          if (args.properties) body.properties = args.properties.split(',')
          result = await api('POST', '/crm/v3/objects/companies/search', body)
          break
        }
        case 'create': {
          if (!args.name) { result = { error: '--name required' }; break }
          const properties = { name: args.name }
          if (args.domain) properties.domain = args.domain
          if (args.industry) properties.industry = args.industry
          if (args.phone) properties.phone = args.phone
          result = await api('POST', '/crm/v3/objects/companies', { properties })
          break
        }
        default:
          result = { error: 'Unknown companies subcommand. Use: list, get, search, create' }
      }
      break

    case 'deals':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.limit) params.set('limit', args.limit)
          if (args.after) params.set('after', args.after)
          if (args.properties) params.set('properties', args.properties || 'dealname,amount,dealstage,closedate')
          result = await api('GET', `/crm/v3/objects/deals?${params}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          const params = new URLSearchParams()
          if (args.properties) params.set('properties', args.properties)
          result = await api('GET', `/crm/v3/objects/deals/${args.id}?${params}`)
          break
        }
        case 'search': {
          if (!args.query && !args.stage) { result = { error: '--query or --stage required' }; break }
          const body = { filterGroups: [], limit: parseInt(args.limit) || 10 }
          if (args.stage) {
            body.filterGroups.push({ filters: [{ propertyName: 'dealstage', operator: 'EQ', value: args.stage }] })
          } else {
            body.query = args.query
          }
          if (args.properties) body.properties = args.properties.split(',')
          result = await api('POST', '/crm/v3/objects/deals/search', body)
          break
        }
        case 'create': {
          if (!args.name) { result = { error: '--name required' }; break }
          const properties = { dealname: args.name }
          if (args.amount) properties.amount = args.amount
          if (args.stage) properties.dealstage = args.stage
          if (args.pipeline) properties.pipeline = args.pipeline
          if (args.closedate) properties.closedate = args.closedate
          result = await api('POST', '/crm/v3/objects/deals', { properties })
          break
        }
        default:
          result = { error: 'Unknown deals subcommand. Use: list, get, search, create' }
      }
      break

    case 'tickets':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.limit) params.set('limit', args.limit)
          if (args.after) params.set('after', args.after)
          result = await api('GET', `/crm/v3/objects/tickets?${params}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/crm/v3/objects/tickets/${args.id}`)
          break
        }
        default:
          result = { error: 'Unknown tickets subcommand. Use: list, get' }
      }
      break

    case 'owners':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.email) params.set('email', args.email)
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/crm/v3/owners?${params}`)
          break
        }
        default:
          result = { error: 'Unknown owners subcommand. Use: list' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          contacts: 'contacts [list|get|search|create|update] [--id <id>] [--email <email>] [--query <q>] [--firstname <n>] [--lastname <n>] [--company <c>] [--phone <p>] [--lifecyclestage <s>] [--limit <n>] [--after <cursor>] [--properties <p1,p2>]',
          companies: 'companies [list|get|search|create] [--id <id>] [--query <q>] [--domain <d>] [--name <n>] [--industry <i>] [--limit <n>] [--after <cursor>]',
          deals: 'deals [list|get|search|create] [--id <id>] [--query <q>] [--stage <s>] [--name <n>] [--amount <a>] [--pipeline <p>] [--closedate <d>] [--limit <n>] [--after <cursor>]',
          tickets: 'tickets [list|get] [--id <id>] [--limit <n>] [--after <cursor>]',
          owners: 'owners list [--email <email>] [--limit <n>]',
        }
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
