import { NextResponse } from 'next/server'
import { getAllPostsMeta } from '@/lib/blog'

export const dynamic = 'force-static'

export const GET = () => NextResponse.json(getAllPostsMeta())
