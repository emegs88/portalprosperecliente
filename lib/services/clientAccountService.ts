/**
 * Serviço de Criação de Conta de Cliente
 *
 * Cria ou encontra conta de cliente a partir de dados extraídos do PDF.
 * Fluxo: PDF → extrair nome/CPF → criar User + ClientProfile → gerar token → enviar email
 */

import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface ClientData {
  nome: string
  cpf: string
  email?: string
}

interface FindOrCreateResult {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    isNew: boolean
  }
  clientProfile: {
    id: string
    cpf: string | null
  }
  /** Token para definir senha (só para novos usuários) */
  setPasswordToken?: string
}

/**
 * Normalizar CPF para formato sem pontos/traços (apenas dígitos)
 */
function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Gerar email placeholder a partir do CPF quando email real não disponível
 */
function generatePlaceholderEmail(cpf: string): string {
  const normalized = normalizeCpf(cpf)
  return `cliente.${normalized}@prospere.pendente`
}

/**
 * Encontrar ou criar conta de cliente a partir de dados do PDF
 */
export async function findOrCreateClientFromPDF(
  data: ClientData,
  importedById: string
): Promise<FindOrCreateResult> {
  const normalizedCpf = normalizeCpf(data.cpf)

  // 1. Tentar encontrar pelo CPF no ClientProfile
  const existingProfile = await prisma.clientProfile.findFirst({
    where: { cpf: normalizedCpf },
    include: { user: true },
  })

  if (existingProfile) {
    return {
      user: {
        id: existingProfile.user.id,
        email: existingProfile.user.email,
        name: existingProfile.user.name,
        role: existingProfile.user.role,
        isNew: false,
      },
      clientProfile: {
        id: existingProfile.id,
        cpf: existingProfile.cpf,
      },
    }
  }

  // 2. Tentar encontrar pelo email (se fornecido)
  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      include: { clientProfile: true },
    })

    if (existingUser) {
      // Criar ClientProfile se não existe
      let profile = existingUser.clientProfile
      if (!profile) {
        profile = await prisma.clientProfile.create({
          data: {
            userId: existingUser.id,
            cpf: normalizedCpf,
            importedById,
          },
        })
      } else if (!profile.cpf) {
        // Atualizar CPF se não tinha
        profile = await prisma.clientProfile.update({
          where: { id: profile.id },
          data: { cpf: normalizedCpf },
        })
      }

      return {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          isNew: false,
        },
        clientProfile: {
          id: profile.id,
          cpf: profile.cpf,
        },
      }
    }
  }

  // 3. Criar novo usuário + perfil
  const email = data.email || generatePlaceholderEmail(data.cpf)
  const setPasswordToken = randomUUID()
  const tokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 horas

  const newUser = await prisma.user.create({
    data: {
      email,
      name: data.nome,
      role: 'CLIENTE',
      // passwordHash fica null até o cliente definir
      clientProfile: {
        create: {
          cpf: normalizedCpf,
          importedById,
        },
      },
    },
    include: {
      clientProfile: true,
    },
  })

  // 4. Criar token de verificação para definir senha
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: setPasswordToken,
      expires: tokenExpires,
    },
  })

  console.log(`✅ Conta criada para cliente: ${data.nome} (${email})`)

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isNew: true,
    },
    clientProfile: {
      id: newUser.clientProfile!.id,
      cpf: newUser.clientProfile!.cpf,
    },
    setPasswordToken,
  }
}

/**
 * Atualizar email do cliente (quando vendedor fornece email real)
 */
export async function updateClientEmail(
  userId: string,
  newEmail: string
): Promise<{ setPasswordToken: string }> {
  // Verificar se email já está em uso
  const existing = await prisma.user.findUnique({
    where: { email: newEmail },
  })

  if (existing && existing.id !== userId) {
    throw new Error('Este email já está em uso por outro usuário')
  }

  // Atualizar email
  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  })

  // Gerar novo token
  const setPasswordToken = randomUUID()
  const tokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000)

  // Remover tokens antigos
  await prisma.verificationToken.deleteMany({
    where: { identifier: newEmail },
  })

  // Criar novo token
  await prisma.verificationToken.create({
    data: {
      identifier: newEmail,
      token: setPasswordToken,
      expires: tokenExpires,
    },
  })

  return { setPasswordToken }
}
