'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Disclaimer } from '@/components/simulador/sorteio/Disclaimer'
import { useRouter } from 'next/navigation'
import { ArrowRight, MessageCircle } from 'lucide-react'
import Image from 'next/image'

export default function SimuladorSorteioLanding() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Logo e Título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center mb-6">
            <Image
              src="/logo/logo-prospere.png"
              alt="Prospere Consórcios"
              width={200}
              height={80}
              className="object-contain"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Simulador de Sorteio Prospere
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Aprenda como funciona o sorteio em consórcios, de forma interativa e educativa.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Disclaimer />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={() => router.push('/simulador/sorteio/configuracao')}
            className="text-lg px-8 py-6"
          >
            Iniciar Simulação
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Link para WhatsApp ou formulário de contato
              window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20falar%20com%20um%20especialista%20Prospere', '_blank')
            }}
            className="text-lg px-8 py-6"
          >
            <MessageCircle className="mr-2 w-5 h-5" />
            Falar com Especialista
          </Button>
        </motion.div>

        {/* Informações Adicionais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-500 mb-2">🎲</div>
                  <h3 className="text-white font-semibold mb-1">Interativo</h3>
                  <p className="text-sm text-gray-400">
                    Monte seus trios e veja os resultados em tempo real
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500 mb-2">📚</div>
                  <h3 className="text-white font-semibold mb-1">Educativo</h3>
                  <p className="text-sm text-gray-400">
                    Aprenda como funciona o sorteio em consórcios
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500 mb-2">⚡</div>
                  <h3 className="text-white font-semibold mb-1">Rápido</h3>
                  <p className="text-sm text-gray-400">
                    Simule quantas vezes quiser, sem compromisso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
