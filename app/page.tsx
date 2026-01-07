'use client'

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0B0B0B 0%, #1a1a1a 100%)',
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '64px', marginBottom: '20px', textAlign: 'center' }}>
        Portal Prospere
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '40px', textAlign: 'center', color: '#ccc' }}>
        Portal do Cliente - Sistema de Gestão de Consórcios
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        maxWidth: '800px',
        width: '100%'
      }}>
        <a href="/dashboard" style={{
          display: 'block',
          background: 'rgba(220, 38, 38, 0.2)',
          border: '2px solid #dc2626',
          padding: '40px',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'white',
          textAlign: 'center',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        >
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>📊 Dashboard</h2>
          <p style={{ fontSize: '18px', color: '#ccc' }}>Acesse suas cotas e patrimônio</p>
        </a>

        <a href="/admin" style={{
          display: 'block',
          background: 'rgba(220, 38, 38, 0.2)',
          border: '2px solid #dc2626',
          padding: '40px',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'white',
          textAlign: 'center',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        >
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>⚙️ Admin</h2>
          <p style={{ fontSize: '18px', color: '#ccc' }}>Área administrativa</p>
        </a>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <a href="/login" style={{
          display: 'inline-block',
          background: '#E30613',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          marginRight: '10px'
        }}>
          Entrar
        </a>
        <a href="/cadastro" style={{
          display: 'inline-block',
          background: 'transparent',
          color: 'white',
          border: '2px solid #E30613',
          padding: '15px 30px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Criar Conta
        </a>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', color: '#888' }}>
        <p>Ou acesse: <a href="/teste" style={{ color: '#E30613' }}>Página de Teste</a></p>
      </div>
    </div>
  )
}
