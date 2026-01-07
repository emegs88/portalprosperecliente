import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'client' } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role === 'admin' ? 'admin' : 'client', // Usar role recebido ou default 'client'
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso',
      userId: user.id,
    })
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar usuário' },
      { status: 500 }
    )
  }
}
