/**
 * NextAuth Configuration - VERSÃO TURBO
 * Suporta Credentials e OAuth (futuro)
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credenciais faltando')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log(`❌ Usuário não encontrado: ${credentials.email}`)
            return null
          }

          // Verificar se tem senha (pode ser OAuth user)
          if (!user.passwordHash) {
            console.log(`❌ Usuário sem senha (OAuth): ${credentials.email}`)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isValid) {
            console.log(`❌ Senha incorreta para: ${credentials.email}`)
            return null
          }

          console.log(`✅ Login bem-sucedido para: ${credentials.email}`)
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role || 'USER',
          }
        } catch (error) {
          console.error('❌ Erro no authorize:', error)
          return null
        }
      },
    }),
    // TODO: Adicionar OAuth providers no futuro (Google, GitHub)
  ],
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout',
    // error: '/auth/error',
    // verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt', // Usar JWT mesmo com adapter (mais simples)
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'USER'
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
