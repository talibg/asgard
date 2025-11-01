import { NextResponse } from 'next/server'
import { getAllPostsMeta } from '@/lib/blog'

export const dynamic = 'force-static'

export const GET = () => {
    const res = NextResponse.json(getAllPostsMeta())
    res.headers.set('X-Robots-Tag', 'noindex')
    return res
}
