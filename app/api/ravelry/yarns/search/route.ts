import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  const username = process.env.RAVELRY_USERNAME
  const password = process.env.RAVELRY_PASSWORD
  if (!username || !password) {
    return NextResponse.json({ error: "Ravelry credentials not configured" }, { status: 500 })
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const searchParams = new URLSearchParams([
      ['query', query],
      ['page', '1'],
      ['page_size', '5'],
      ['sort', 'best'],
    ]);
    const url = `https://api.ravelry.com/yarns/search.json?${searchParams.toString()}`;
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()

      return NextResponse.json(
        { error: `Ravelry API error: ${response.statusText}`, details: errorBody },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from Ravelry:", error)
    return NextResponse.json({ error: "Failed to fetch from Ravelry" }, { status: 500 })
  }
}
