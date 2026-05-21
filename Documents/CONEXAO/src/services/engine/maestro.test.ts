// Teste unitário do roteamento híbrido e gerenciamento de filas
describe('Maestro Hybrid Routing & Balancing Logic', () => {
    const mockCollaborators = [
        { id: '1', name: 'João Entregador', phone: '5551999999991', contactType: 'DRIVER', dispatchKeywords: 'Farroupilha, centro', activeJobs: 2 },
        { id: '2', name: 'Maria Entregas', phone: '5551999999992', contactType: 'DRIVER', dispatchKeywords: 'Farroupilha, bairro x', activeJobs: 0 },
        { id: '3', name: 'Dr. Pedro', phone: '5551999999993', contactType: 'DOCTOR', dispatchKeywords: 'pediatria, Farroupilha', activeJobs: 1 },
        { id: '4', name: 'Ana Entregas', phone: '5551999999994', contactType: 'DRIVER', dispatchKeywords: 'centro, Farroupilha', activeJobs: 1 }
    ];

    it('deve filtrar os colaboradores corretamente por palavras-chave (case-insensitive)', () => {
        const queryLocalidade = 'farroupilha';
        
        const matched = mockCollaborators.filter(c => {
            if (!c.dispatchKeywords) return false;
            const kwList = c.dispatchKeywords.toLowerCase().split(',').map(k => k.trim());
            return kwList.some(kw => kw.includes(queryLocalidade) || queryLocalidade.includes(kw));
        });

        expect(matched).toHaveLength(4);
    });

    it('deve filtrar corretamente por bairro específico e encontrar o colaborador correspondente', () => {
        const queryLocalidade = 'bairro x';
        
        const matched = mockCollaborators.filter(c => {
            if (!c.dispatchKeywords) return false;
            const kwList = c.dispatchKeywords.toLowerCase().split(',').map(k => k.trim());
            return kwList.some(kw => kw.includes(queryLocalidade) || queryLocalidade.includes(kw));
        });

        expect(matched).toHaveLength(1);
        expect(matched[0].name).toBe('Maria Entregas');
    });

    it('deve selecionar o colaborador com menor fila de trabalhos ativos (load balancing)', () => {
        const queryLocalidade = 'centro';
        
        const matched = mockCollaborators.filter(c => {
            if (!c.dispatchKeywords) return false;
            const kwList = c.dispatchKeywords.toLowerCase().split(',').map(k => k.trim());
            return kwList.some(kw => kw.includes(queryLocalidade) || queryLocalidade.includes(kw));
        });

        // Filtrados: João (activeJobs: 2), Ana (activeJobs: 1)
        expect(matched).toHaveLength(2);

        // Ordena por activeJobs (menor fila primeiro)
        matched.sort((a, b) => a.activeJobs - b.activeJobs);

        // O melhor colaborador deve ser a Ana (fila = 1)
        expect(matched[0].name).toBe('Ana Entregas');
        expect(matched[0].activeJobs).toBe(1);
    });

    it('deve decrementar corretamente os trabalhos ativos sem permitir valores negativos', () => {
        const activeJobsColab1 = 2;
        const activeJobsColab2 = 0;

        const newJobs1 = Math.max(0, activeJobsColab1 - 1);
        const newJobs2 = Math.max(0, activeJobsColab2 - 1);

        expect(newJobs1).toBe(1);
        expect(newJobs2).toBe(0);
    });
});
