'use client'
export default function TestPage({ params }: { params: { id: string } }) {
  return <h1>ID: {params.id}</h1>
}
