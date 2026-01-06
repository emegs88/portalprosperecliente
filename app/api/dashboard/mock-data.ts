// Dados mock para desenvolvimento quando não há banco configurado
export const mockDashboardData = {
  totalCotas: 42,
  totalCredito: 4150000.00,
  parcelaMensalTotal: 16010.10,
  totalReceber: 4150000.00,
  topCotas: [
    { grupo: "000706", cota: "2011", vlBem: 100000.00, percentPago: 0.0398 },
    { grupo: "000706", cota: "2012", vlBem: 100000.00, percentPago: 0.0398 },
    { grupo: "000706", cota: "2013", vlBem: 100000.00, percentPago: 0.0398 },
    { grupo: "000706", cota: "2014", vlBem: 100000.00, percentPago: 0.0398 },
    { grupo: "000706", cota: "2015", vlBem: 100000.00, percentPago: 0.0398 },
  ],
  patrimonioAcumulado: Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const baseCredito = 4150000
    const aporteMensal = 16010.10
    const taxaIncc = 0.065 / 12 // INCC mensal
    return {
      mes: `Mês ${mes}`,
      atual: baseCredito * Math.pow(1 + taxaIncc, mes) + (aporteMensal * mes),
      projetado: baseCredito * Math.pow(1 + (0.08 / 12), mes) + (aporteMensal * mes * 1.1),
    }
  }),
}
