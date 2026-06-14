export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Accept, Content-Type, X-Requested-With')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const target = req.query.url
  if (!target) return res.status(400).json({ error: 'Missing url param' })

  try {
    const jiraRes = await fetch(decodeURIComponent(target), {
      method: req.method,
      headers: {
        Authorization: req.headers['authorization'] ?? '',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const text = await jiraRes.text()
    res.setHeader('Content-Type', 'application/json')
    res.status(jiraRes.status).send(text)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
