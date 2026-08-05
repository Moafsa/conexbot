import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

type ServiceItem = {
    name: string;
    description?: string;
    recurring?: boolean;
    setupPrice?: number | null;
    monthlyPrice?: number | null;
};

type DeliverableGroup = { category: string; items: string[] };
type TimelineStage = { stage: string; days: string; expectedResult: string };
type Diagnosis = { workingWell?: string[]; losingReach?: string[] };

export interface ProposalPdfInput {
    title: string;
    clientName: string;
    agencyName: string;
    createdAt: Date;
    diagnosis: Diagnosis;
    deliverables: DeliverableGroup[];
    services: ServiceItem[];
    timeline: TimelineStage[];
    nextSteps: string[];
}

const PURPLE: [number, number, number] = [88, 28, 135];
const GRAY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [17, 24, 39];

function fmtMoney(v: number | null | undefined) {
    if (v === null || v === undefined) return "A definir";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PURPLE);
    doc.text(title, 20, y);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, y + 2, 190, y + 2);
    return y + 10;
}

function addBulletList(doc: jsPDF, items: string[], y: number, maxWidth = 165): number {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    for (const item of items) {
        const lines = doc.splitTextToSize(`•  ${item}`, maxWidth);
        if (y + lines.length * 5 > 275) {
            doc.addPage();
            y = 20;
        }
        doc.text(lines, 20, y);
        y += lines.length * 5 + 2;
    }
    return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > 275) {
        doc.addPage();
        return 20;
    }
    return y;
}

export function generateProposalPdf(input: ProposalPdfInput): Buffer {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // ─── Capa ───────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...PURPLE);
    doc.text(input.agencyName.toUpperCase(), 105, 90, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("app.conext.click", 105, 98, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...DARK);
    doc.text("PROPOSTA COMERCIAL", 105, 130, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.text(`Para ${input.clientName}`, 105, 140, { align: "center" });

    doc.setFontSize(10);
    doc.text(
        input.createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        105,
        150,
        { align: "center" }
    );

    // ─── Diagnóstico ────────────────────────────────────────────────────
    doc.addPage();
    let y = 20;
    y = addSectionTitle(doc, "1. Diagnóstico", y);

    if (input.diagnosis.workingWell?.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text("O que já funciona bem", 20, y);
        y += 7;
        y = addBulletList(doc, input.diagnosis.workingWell, y);
        y += 4;
    }

    if (input.diagnosis.losingReach?.length) {
        y = ensureSpace(doc, y, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text("Onde você está perdendo alcance e tempo", 20, y);
        y += 7;
        y = addBulletList(doc, input.diagnosis.losingReach, y);
        y += 4;
    }

    // ─── O que vamos entregar ───────────────────────────────────────────
    y = ensureSpace(doc, y, 20);
    y = addSectionTitle(doc, "2. O que vamos entregar para você", y);

    for (const group of input.deliverables) {
        y = ensureSpace(doc, y, 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(group.category, 20, y);
        y += 7;
        y = addBulletList(doc, group.items, y);
        y += 3;
    }

    // ─── Investimento ───────────────────────────────────────────────────
    doc.addPage();
    y = 20;
    y = addSectionTitle(doc, "3. Investimento", y);

    const implantacao = input.services.filter((s) => !s.recurring);
    const mensalidade = input.services.filter((s) => s.recurring);

    if (implantacao.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...DARK);
        doc.text("Implantação (itens únicos)", 20, y);
        y += 4;
        autoTable(doc, {
            startY: y,
            head: [["Item", "Valor"]],
            body: implantacao.map((s) => [s.name, fmtMoney(s.setupPrice)]),
            theme: "striped",
            headStyles: { fillColor: PURPLE },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 }
        });
        y = (doc as any).lastAutoTable.finalY + 4;

        const totalImplantacao = implantacao.reduce((acc, s) => acc + (s.setupPrice || 0), 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Total da implantação: ${fmtMoney(totalImplantacao)}`, 20, y);
        y += 10;
    }

    if (mensalidade.length > 0) {
        y = ensureSpace(doc, y, 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Mensalidade (itens contínuos)", 20, y);
        y += 4;
        autoTable(doc, {
            startY: y,
            head: [["Item", "Valor"]],
            body: mensalidade.map((s) => [s.name, `${fmtMoney(s.monthlyPrice)} /mês`]),
            theme: "striped",
            headStyles: { fillColor: PURPLE },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 }
        });
        y = (doc as any).lastAutoTable.finalY + 4;

        const totalMensal = mensalidade.reduce((acc, s) => acc + (s.monthlyPrice || 0), 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PURPLE);
        doc.text(`Mensalidade total dos serviços: a partir de ${fmtMoney(totalMensal)} /mês`, 20, y);
        doc.setTextColor(...DARK);
        y += 10;
    }

    // ─── Cronograma ─────────────────────────────────────────────────────
    doc.addPage();
    y = 20;
    y = addSectionTitle(doc, "4. Cronograma e Tempo Mínimo para Resultado", y);

    if (input.timeline.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [["Etapa", "Prazo de entrega", "Quando esperar resultado relevante"]],
            body: input.timeline.map((t) => [t.stage, t.days, t.expectedResult]),
            theme: "striped",
            headStyles: { fillColor: PURPLE },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9, cellWidth: "wrap" },
            columnStyles: { 2: { cellWidth: 80 } }
        });
        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // ─── Próximos Passos ────────────────────────────────────────────────
    y = ensureSpace(doc, y, 20);
    y = addSectionTitle(doc, "5. Próximos Passos", y);
    y = addBulletList(doc, input.nextSteps, y);

    y = ensureSpace(doc, y, 20);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text("Ficamos à disposição para tirar qualquer dúvida e começar assim que você aprovar.", 20, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text(input.agencyName, 20, y);

    return Buffer.from(doc.output("arraybuffer"));
}
