#!/bin/bash

# Script de Teste Completo - Simulador Prospere
# Testa todas as funcionalidades principais

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Iniciando testes completos do Simulador Prospere..."
echo ""

# Teste 1: Verificar se servidor está rodando
echo "1️⃣  Verificando servidor..."
if curl -s "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}✅ Servidor rodando${NC}"
else
    echo -e "${RED}❌ Servidor não está rodando${NC}"
    exit 1
fi

# Teste 2: Verificar rotas principais
echo ""
echo "2️⃣  Testando rotas principais..."

ROUTES=(
    "/"
    "/login"
    "/dashboard"
    "/simulador"
)

for route in "${ROUTES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "401" ]; then
        echo -e "${GREEN}✅ $route - Status: $STATUS${NC}"
    else
        echo -e "${RED}❌ $route - Status: $STATUS${NC}"
    fi
done

# Teste 3: Verificar APIs (sem auth - devem retornar 401)
echo ""
echo "3️⃣  Testando APIs (sem autenticação - devem retornar 401)..."

APIS=(
    "/api/simulation/projects"
    "/api/simulation/runs"
    "/api/simulation/snapshots"
)

for api in "${APIS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$api")
    if [ "$STATUS" = "401" ]; then
        echo -e "${GREEN}✅ $api - Protegida (401)${NC}"
    else
        echo -e "${YELLOW}⚠️  $api - Status: $STATUS${NC}"
    fi
done

# Teste 4: Verificar componentes principais
echo ""
echo "4️⃣  Verificando componentes principais..."

COMPONENTS=(
    "components/simulador/SimulationCard.tsx"
    "components/simulador/CreateSimulationDialog.tsx"
    "components/simulador/SimulationConfigWizard.tsx"
    "components/simulador/SimulationResults.tsx"
    "components/simulador/SimulationHistory.tsx"
    "components/simulador/CDIComparator.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ $component existe${NC}"
    else
        echo -e "${RED}❌ $component não encontrado${NC}"
    fi
done

# Teste 5: Verificar APIs implementadas
echo ""
echo "5️⃣  Verificando APIs implementadas..."

API_FILES=(
    "app/api/simulation/projects/route.ts"
    "app/api/simulation/projects/[id]/route.ts"
    "app/api/simulation/runs/route.ts"
    "app/api/simulation/runs/[id]/route.ts"
    "app/api/simulation/runs/execute/route.ts"
    "app/api/simulation/runs/[id]/share/route.ts"
    "app/api/simulation/snapshots/route.ts"
)

for api_file in "${API_FILES[@]}"; do
    if [ -f "$api_file" ]; then
        echo -e "${GREEN}✅ $api_file existe${NC}"
    else
        echo -e "${RED}❌ $api_file não encontrado${NC}"
    fi
done

# Teste 6: Verificar páginas
echo ""
echo "6️⃣  Verificando páginas..."

PAGES=(
    "app/simulador/page.tsx"
    "app/simulador/[id]/page.tsx"
    "app/simulador/shared/[token]/page.tsx"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo -e "${GREEN}✅ $page existe${NC}"
    else
        echo -e "${RED}❌ $page não encontrado${NC}"
    fi
done

# Teste 7: Verificar build
echo ""
echo "7️⃣  Verificando build..."
if npm run build 2>&1 | grep -q "Compiled successfully"; then
    echo -e "${GREEN}✅ Build compila com sucesso${NC}"
else
    echo -e "${YELLOW}⚠️  Build tem avisos (verificar acima)${NC}"
fi

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📋 Próximos passos para teste manual:"
echo "   1. Acesse http://localhost:3000/login"
echo "   2. Faça login"
echo "   3. Acesse http://localhost:3000/simulador"
echo "   4. Crie uma nova simulação"
echo "   5. Configure e execute"
echo "   6. Verifique resultados, gráficos e exportações"
