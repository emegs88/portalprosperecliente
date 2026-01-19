# 📁 Estrutura de Domínios - Ecossistema Prospere TURBO

## 🚨 REGRA ABSOLUTA: SEPARAÇÃO SANDBOX vs REAL

**NUNCA misturar dados entre domínios!**

### Domínios Criados:

1. **`simulation/`** - SIMULAÇÕES (SANDBOX)
   - ❌ **NÃO** importa de `core/`, `commission/`
   - ✅ Dados salvos em `simulation_*` tables
   - ✅ Rotas em `/api/simulation/*`

2. **`core/`** - CORE REAL
   - ✅ Dados reais: cotas, vendas, clientes
   - ✅ Rotas em `/api/core/*`, `/api/cotas/*`

3. **`commission/`** - COMISSÕES
   - ✅ Regras, entradas, repasses
   - ✅ Rotas em `/api/commission/*`

4. **`experience/`** - EXPERIÊNCIAS/CLUBE
   - ✅ Eventos, reservas, níveis
   - ✅ Rotas em `/api/experience/*`, `/api/club/*`

5. **`admin/`** - ADMIN
   - ✅ KPIs, funil, relatórios
   - ✅ Rotas em `/api/admin/*`

---

## 📂 Estrutura de Cada Domínio:

```
domain/
└── {nome}/
    ├── services/     # Lógica de negócio
    ├── types/        # Types TypeScript
    └── validators/   # Schemas Zod
```

---

## 🔒 Validações:

- ✅ Cada domínio tem seus próprios types
- ✅ Validators Zod para inputs
- ✅ Services isolados (sem import cross-domain)

---

## 📝 Próximos Passos:

1. Mover services existentes para domínios
2. Criar services novos conforme necessário
3. Atualizar imports em todo projeto
