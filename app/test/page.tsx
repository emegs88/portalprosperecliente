'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Teste de Sistema</h1>
      <div className="space-y-4">
        <div className="p-4 bg-green-900/30 border border-green-500 rounded">
          <h2 className="text-xl font-bold mb-2">✅ Sistema Funcionando</h2>
          <p>Esta página está acessível, o que significa que o Next.js está funcionando.</p>
        </div>
        
        <div className="p-4 bg-blue-900/30 border border-blue-500 rounded">
          <h2 className="text-xl font-bold mb-2">🔗 Teste de Rotas</h2>
          <div className="space-y-2 mt-4">
            <a href="/" className="block text-blue-300 hover:text-blue-200 underline">
              / - Home
            </a>
            <a href="/cadastro" className="block text-blue-300 hover:text-blue-200 underline">
              /cadastro - Cadastro
            </a>
            <a href="/login" className="block text-blue-300 hover:text-blue-200 underline">
              /login - Login
            </a>
            <a href="/dashboard" className="block text-blue-300 hover:text-blue-200 underline">
              /dashboard - Dashboard (protegido)
            </a>
            <a href="/admin" className="block text-blue-300 hover:text-blue-200 underline">
              /admin - Admin (protegido)
            </a>
          </div>
        </div>

        <div className="p-4 bg-yellow-900/30 border border-yellow-500 rounded">
          <h2 className="text-xl font-bold mb-2">📋 Status dos Componentes</h2>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Home: ✅ Criada</li>
            <li>Cadastro: ✅ Criada</li>
            <li>BrandHeader: ✅ Criado</li>
            <li>AccessCard: ✅ Criado</li>
            <li>Auth Mock: ✅ Criado</li>
            <li>Middleware: ✅ Criado</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
