import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const email = credentials.email.trim().toLowerCase()

          // Buscar usuário no banco
          const user = await prisma.user.findUnique({
            where: { email },
            include: { clientProfile: true },
          })

          if (!user) {
            return null
          }

          // Verificar senha
          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!passwordMatch) {
            console.error('❌ Senha incorreta para:', email)
            return null
          }

          console.log('✅ Login bem-sucedido para:', email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Erro no authorize:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role // Incluir role no token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as any).role = token.role // Incluir role na sessão
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'prospere-temp-secret',
  debug: process.env.NODE_ENV === 'development',
}
