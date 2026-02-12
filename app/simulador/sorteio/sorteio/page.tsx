import dynamic from 'next/dynamic'

const SorteioClient = dynamic(
  () => import('./SorteioClient'),
  { ssr: false }
)

export default function SorteioPage() {
  return <SorteioClient />
}
