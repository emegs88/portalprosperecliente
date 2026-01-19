/**
 * Serviço para exportar resultados de simulação para PDF
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatPercent } from '@/lib/utils'

export interface SimulationRunData {
  id: string
  name?: string
  executedAt: string
  patrimonioFinal: number
  totalPagoParcelas: number
  totalPagoBolso: number
  totalRecebidoVendas: number
  caixaFinalInvestido: number
  custoPatrimonio: number
  roi: number
  multiplicadorPatrimonial: number
  custoPorReal: number
  numContemplacoes: number
  numVendas: number
  cotasAtivasFinal: number
}

export interface MonthlySnapshot {
  mes: number
  mesLabel: string
  parcelasPagas: number
  valorParcelas: number
  contemplacoes: number
  vendas: number
  valorVendas: number
  caixa: number
  caixaInvestido: number
  patrimonio: number
  totalPago: number
  totalPagoBolso: number
}

export interface SimulationEvent {
  mes: number
  tipo: string
  cotaGrupo?: string
  cotaNumero?: string
  valor: number
  descricao: string
}

export interface ProjectInfo {
  name: string
  simulatorType: string
  description?: string
}

/**
 * Gerar PDF completo da simulação
 */
export async function generateSimulationPDF(
  projectInfo: ProjectInfo,
  runData: SimulationRunData,
  snapshots: MonthlySnapshot[],
  events: SimulationEvent[]
): Promise<Blob> {
  const doc = new jsPDF()
  
  let yPos = 20

  // Cabeçalho
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246) // Azul
  doc.text('Relatório de Simulação', 14, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Projeto: ${projectInfo.name}`, 14, yPos)
  yPos += 7
  doc.text(`Tipo: ${projectInfo.simulatorType}`, 14, yPos)
  yPos += 7
  doc.text(`Executado em: ${new Date(runData.executedAt).toLocaleString('pt-BR')}`, 14, yPos)
  yPos += 15

  // Resumo Executivo
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Resumo Executivo', 14, yPos)
  yPos += 10

  const summaryData = [
    ['Patrimônio Final', formatCurrency(runData.patrimonioFinal)],
    ['Total Pago (Parcelas)', formatCurrency(runData.totalPagoParcelas)],
    ['Total Pago do Bolso', formatCurrency(runData.totalPagoBolso)],
    ['Total Recebido de Vendas', formatCurrency(runData.totalRecebidoVendas)],
    ['Caixa Final Investido', formatCurrency(runData.caixaFinalInvestido)],
    ['Custo do Patrimônio', formatCurrency(runData.custoPatrimonio)],
    ['ROI', formatPercent(runData.roi)],
    ['Multiplicador Patrimonial', `${runData.multiplicadorPatrimonial.toFixed(2)}x`],
    ['Custo por R$1 de Patrimônio', formatCurrency(runData.custoPorReal)],
    ['Contemplações', runData.numContemplacoes.toString()],
    ['Vendas', runData.numVendas.toString()],
    ['Cotas Ativas Finais', runData.cotasAtivasFinal.toString()],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 70, halign: 'right' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Snapshots mensais (primeiros 12 meses)
  if (snapshots.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.text('Evolução Mensal (Primeiros 12 Meses)', 14, yPos)
    yPos += 10

    const snapshotData = snapshots.slice(0, 12).map(s => [
      s.mesLabel,
      s.parcelasPagas.toString(),
      formatCurrency(s.valorParcelas),
      s.contemplacoes.toString(),
      s.vendas.toString(),
      formatCurrency(s.valorVendas),
      formatCurrency(s.patrimonio),
      formatCurrency(s.totalPago),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Mês', 'Parcelas', 'Valor Parcelas', 'Contemplações', 'Vendas', 'Valor Vendas', 'Patrimônio', 'Total Pago']],
      body: snapshotData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Eventos importantes (primeiros 20)
  if (events.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.text('Eventos da Simulação', 14, yPos)
    yPos += 10

    const eventData = events.slice(0, 20).map(e => [
      e.mes.toString(),
      e.tipo,
      e.cotaGrupo && e.cotaNumero ? `${e.cotaGrupo}-${e.cotaNumero}` : '-',
      formatCurrency(e.valor),
      e.descricao.substring(0, 40),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Mês', 'Tipo', 'Cota', 'Valor', 'Descrição']],
      body: eventData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
      },
    })
  }

  // Rodapé
  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
      14,
      doc.internal.pageSize.height - 10
    )
    doc.text(
      'Prospere Consórcios - Simulador Educativo',
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    )
  }

  return doc.output('blob')
}
