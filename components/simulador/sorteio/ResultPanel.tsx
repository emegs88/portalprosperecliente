'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Award, BookOpen, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MatchResult } from '@/types/simulador/sorteio'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import confetti from 'canvas-confetti'

interface ResultPanelProps {
  drawn: number[]
  results: MatchResult[]
  onSimulateAgain: () => void
}

export function ResultPanel({ drawn, results, onSimulateAgain }: ResultPanelProps) {
  const config = loadConfig()
  const hasWinner = results.some(r => r.isWinner)

  useEffect(() => {
    if (hasWinner && config.animation.enableConfetti) {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [hasWinner, config.animation.enableConfetti])

  return (
    <div className="space-y-6">
      {/* Números Sorteados */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center">
            Números Sorteados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 flex-wrap">
            {drawn.map((num, index) => (
              <div
                key={index}
                className="w-20 h-20 rounded-full bg-blue-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg"
              >
                {num.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">
            Resultados dos Trios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Trio</TableHead>
                <TableHead className="text-gray-300">Números</TableHead>
                <TableHead className="text-gray-300">Acertos</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow
                  key={result.trioId}
                  className={cn(
                    "border-gray-700",
                    result.isWinner && "bg-green-500/10"
                  )}
                >
                  <TableCell className="font-medium text-white">
                    Trio {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {result.trio.map((num, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2 py-1 rounded text-sm font-medium",
                            result.matchedNumbers.includes(num)
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300"
                          )}
                        >
                          {num.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold",
                      result.isWinner ? "text-green-500" : "text-gray-400"
                    )}>
                      {result.matches} / {result.trio.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    {result.isWinner ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Award className="w-5 h-5" />
                        <span>Ganhou!</span>
                      </div>
                    ) : result.matches > 0 ? (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <CheckCircle className="w-5 h-5" />
                        <span>Parcial</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <XCircle className="w-5 h-5" />
                        <span>Não acertou</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mensagem Resultado */}
      <Card className={cn(
        "border-2",
        hasWinner
          ? "bg-green-500/20 border-green-500"
          : "bg-gray-800 border-gray-700"
      )}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {hasWinner ? (
              <>
                <Award className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-2xl font-bold text-green-500">
                  Parabéns! Você acertou!
                </h3>
                <p className="text-gray-300">
                  Seu trio bateu na simulação! 🎉
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-gray-500 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-300">
                  Não foi dessa vez
                </h3>
                <p className="text-gray-400">
                  Simule novamente para testar sua sorte!
                </p>
              </>
            )}

            {/* Texto Educativo */}
            {config.features.enableEducativeText && (
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-sm text-gray-300">
                  <strong>Como funciona o sorteio em consórcios:</strong>
                  <br />
                  O sorteio é realizado mensalmente pela administradora, de forma transparente e auditada.
                  Cada participante pode escolher seus números preferidos para participar do sorteio.
                  Esta é apenas uma simulação educativa e não representa resultados reais.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={onSimulateAgain}
                className="text-lg px-8"
              >
                Simular Novamente
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20falar%20com%20um%20especialista%20Prospere', '_blank')
                }}
                className="text-lg px-8"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com Especialista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
