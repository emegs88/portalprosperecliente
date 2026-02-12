/**
 * POST /api/auth/set-password
 *
 * Define a senha de um usuário a partir de um token de verificação.
 * Usado quando o vendedor importa cotas e cria conta para o cliente.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token de verificação
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: email,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido ou já utilizado' },
        { status: 400 }
      )
    }

    // Verificar expiração
    if (verificationToken.expires < new Date()) {
      // Limpar token expirado
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      })
      return NextResponse.json(
        { error: 'Token expirado. Solicite um novo link ao seu consultor.' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Definir senha
    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    })

    // Remover token usado
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    })

    console.log(`✅ Senha definida para: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso! Você já pode fazer login.',
    })
  } catch (error: any) {
    console.error('❌ Set password error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao definir senha' },
      { status: 500 }
    )
  }
}
