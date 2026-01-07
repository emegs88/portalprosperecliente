export default function TestePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0B0B0B 0%, #1a1a1a 100%)',
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ TESTE - Sistema Funcionando!</h1>
      <p style={{ fontSize: '24px', marginBottom: '40px' }}>Se você está vendo isso, o Next.js está funcionando!</p>
      
      <div style={{ 
        background: 'rgba(220, 38, 38, 0.2)', 
        border: '1px solid #dc2626',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>🎯 Dashboard</h2>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          <a href="/dashboard" style={{ color: '#E30613', textDecoration: 'underline' }}>
            Clique aqui para ir ao Dashboard
          </a>
        </p>
      </div>

      <div style={{ 
        background: 'rgba(0, 0, 0, 0.5)', 
        border: '1px solid #666',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>📋 Links Rápidos:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <a href="/" style={{ color: '#E30613', textDecoration: 'underline', fontSize: '18px' }}>/ - Home</a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/login" style={{ color: '#E30613', textDecoration: 'underline', fontSize: '18px' }}>/login - Login</a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/dashboard" style={{ color: '#E30613', textDecoration: 'underline', fontSize: '18px' }}>/dashboard - Dashboard</a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a href="/admin" style={{ color: '#E30613', textDecoration: 'underline', fontSize: '18px' }}>/admin - Admin</a>
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>🔐 Credenciais de Teste:</h3>
        <p><strong>ADMIN:</strong> admin@prospere.com / Admin@12345</p>
        <p><strong>CLIENT:</strong> cliente@prospere.com / Cliente@12345</p>
      </div>
    </div>
  )
}
