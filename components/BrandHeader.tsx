import { Logo } from './logo/Logo'

export function BrandHeader() {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <Logo size="md" />
      </div>
    </header>
  )
}
