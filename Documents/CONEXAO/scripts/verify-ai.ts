
const AI_ENDPOINT = 'http://localhost:3000/api/ai/architect';

async function testAIEndpoint() {
    console.log('Testing AI Architect Endpoint...');

    const payload = {
        message: "Meu negócio chama Pizzaria do Luigi, vendemos pizza de calabresa por 40 reais.",
        history: [],
        extractedTexts: ["===== CONTEÚDO EXTRAÍDO DO ARQUIVO 1 =====\nCardápio:\nPizza Mussarela: R$ 35,00\nRefrigerante: R$ 8,00\n"]
    };

    try {
        const res = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ Server Error Response:', JSON.stringify(errorData, null, 2));
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('AI Response:', JSON.stringify(data, null, 2));

        if (data.extractedData && data.extractedData.name === 'Pizzaria do Luigi') {
            console.log('✅ Name extracted correctly');
        } else {
            console.error('❌ Name extraction failed');
        }

        if (data.extractedData && data.extractedData.productsServices.includes('Mussarela')) {
            console.log('✅ OCR data (Mussarela) extracted correctly');
        } else {
            console.error('❌ OCR data extraction failed');
        }

    } catch (error) {
        console.error('❌ AI Endpoint Test failed:', error);
    }
}

testAIEndpoint();
