import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest, ctx: RouteContext<'/api/ravelry/yarns/[id]'>
) {
  const { id } = await ctx.params

  if (!id) {
    return NextResponse.json({ error: "Yarn ID is required" }, { status: 400 })
  }

  const username = process.env.RAVELRY_USERNAME
  const password = process.env.RAVELRY_PASSWORD

  if (!username || !password) {
    return NextResponse.json({ error: "Ravelry credentials not configured" }, { status: 500 })
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const searchParams = new URLSearchParams([
      ['include', 'colorways']
    ])
    const response = await fetch(`https://api.ravelry.com/yarns/${id}.json?${searchParams.toString()}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
        return NextResponse.json(
            { error: `Ravelry API error: ${response.statusText}` },
            { status: response.status }
        )
    }

    const data = await response.json()
    console.log('data', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching yarn details from Ravelry:", error)
    return NextResponse.json({ error: "Failed to fetch yarn details" }, { status: 500 })
  }
}
