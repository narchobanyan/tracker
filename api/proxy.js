export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const target = req.query.url
  if (!target) return res.status(400).json({ error: 'Missing url param' })

  try {
    const jiraRes = await fetch(decodeURIComponent(target), {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization ?? '',
        Accept: req.headers.accept ?? 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await jiraRes.json()
    res.status(jiraRes.status).json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
