import type { JiraConfig, JiraIssue, Priority, Status } from '../types'

export interface JiraIssueRaw {
  key: string
  fields: {
    summary: string
    status: { name: string; statusCategory: { key: string } }
    priority?: { name: string } | null
    duedate?: string | null
    assignee?: { emailAddress: string; displayName: string } | null
  }
}

function mapStatus(categoryKey: string, statusName: string): Status {
  const cat = categoryKey.toLowerCase()
  const name = statusName.toLowerCase()
  if (cat === 'done') return 'done'
  if (name.includes('block') || name.includes('impediment')) return 'blocked'
  if (name.includes('review') || name.includes('testing') || name.includes('qa')) return 'review'
  if (cat === 'indeterminate' || name.includes('progress') || name.includes('develop')) return 'inprogress'
  return 'todo'
}

function mapPriority(name?: string | null): Priority {
  if (!name) return 'medium'
  const n = name.toLowerCase()
  if (n === 'critical' || n === 'blocker') return 'critical'
  if (n === 'high' || n === 'major') return 'high'
  if (n === 'low' || n === 'minor' || n === 'trivial') return 'low'
  return 'medium'
}

export async function fetchJiraIssues(config: JiraConfig, jql: string): Promise<JiraIssueRaw[]> {
  const auth = btoa(`${config.email}:${config.token}`)
  const params = new URLSearchParams({
    jql,
    fields: 'summary,status,priority,duedate,assignee',
    maxResults: '100',
  })

  const directUrl = `${config.baseUrl.replace(/\/$/, '')}/rest/api/3/search?${params}`
  const url = config.proxyUrl
    ? `${config.proxyUrl.replace(/\/$/, '')}${encodeURIComponent(directUrl)}`
    : directUrl

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Jira ${res.status}: ${text.slice(0, 300) || res.statusText}`)
  }

  const data = (await res.json()) as { issues?: JiraIssueRaw[] }
  return data.issues ?? []
}

export function rawToJiraItem(issue: JiraIssueRaw, baseUrl: string): JiraIssue {
  return {
    url: `${baseUrl.replace(/\/$/, '')}/browse/${issue.key}`,
    name: `${issue.key} ${issue.fields.summary}`,
    status: mapStatus(issue.fields.status.statusCategory.key, issue.fields.status.name),
    priority: mapPriority(issue.fields.priority?.name),
    deadline: issue.fields.duedate ?? '',
    deadlineTime: '',
    prs: [],
    comment: '',
  }
}
