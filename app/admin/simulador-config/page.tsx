'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Save, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { loadConfig, saveConfig, validateConfig } from '@/lib/simulador/sorteio/config'
import { DrawSimConfigSchema } from '@/schemas/drawSimConfig'
import defaultConfig from '@/config/drawSimConfig.json'

export default function AdminSimuladorConfigPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [configJson, setConfigJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Senha simples para MVP (em produção, usar auth real)
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'prospere2024'

  useEffect(() => {
    // Verificar se já está autenticado
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('admin_sim_config_auth')
      if (auth === 'true') {
        setIsAuthenticated(true)
        loadConfigForEdit()
      }
    }
  }, [])

  // Verificar se é admin
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setIsAuthenticated(true)
      loadConfigForEdit()
    }
  }, [session])

  const loadConfigForEdit = () => {
    try {
      const config = loadConfig()
      setConfigJson(JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Error loading config:', error)
      setConfigJson(JSON.stringify(defaultConfig, null, 2))
    }
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('admin_sim_config_auth', 'true')
      loadConfigForEdit()
      setPassword('')
    } else {
      setError('Senha incorreta')
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const parsed = JSON.parse(configJson)
      const validated = validateConfig(parsed)
      saveConfig(validated)
      setSuccess(true)
      
      setTimeout(() => {
        setSuccess(false)
        // Recarregar página para aplicar mudanças
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Erro ao validar configuração')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar a configuração padrão?')) {
      setConfigJson(JSON.stringify(defaultConfig, null, 2))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-white">Acesso Restrito</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Esta área é restrita a administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Senha de Administrador</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin()
                  }
                }}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Digite a senha"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Configuração do Simulador
            </h1>
            <p className="text-gray-400 mt-2">
              Edite a configuração do Simulador de Sorteio
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {success && (
          <Alert className="bg-green-500/20 border-green-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <AlertTitle className="text-green-500">Sucesso!</AlertTitle>
            <AlertDescription className="text-green-400">
              Configuração salva com sucesso. A página será recarregada.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Configuração JSON</CardTitle>
            <CardDescription className="text-gray-400">
              Edite o JSON abaixo. Validação automática será aplicada ao salvar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Config JSON</Label>
              <Textarea
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value)
                  setError(null)
                }}
                className="bg-gray-900 border-gray-700 text-white font-mono text-sm min-h-[500px]"
                spellCheck={false}
              />
              <p className="text-xs text-gray-400">
                Dica: Use Ctrl+Shift+L (ou Cmd+Shift+L no Mac) para formatar no editor
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 sm:flex-initial"
              >
                Restaurar Padrão
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <strong className="text-white">⚠️ Atenção:</strong> Alterações nesta página afetam apenas o simulador de sorteio.
              </p>
              <p>
                A configuração é salva no LocalStorage do navegador (MVP). Em produção, salvar em banco de dados.
              </p>
              <p>
                A validação usa Zod. Erros serão mostrados ao tentar salvar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
