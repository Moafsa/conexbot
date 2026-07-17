const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', exception => {
    console.log(`[Uncaught Exception] ${exception}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Console Error] ${msg.text()}`);
    }
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/auth/login');
    
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'contato@r3comunicacao.com.br');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/agency**', { timeout: 10000 });
    console.log('Logged in successfully!');

    console.log('Navigating to new client page...');
    await page.goto('http://localhost:3000/dashboard/agency/clients/new');
    
    // Step 1
    console.log('Step 1...');
    await page.fill('input[placeholder*="Nome do negócio"]', 'Test Client');
    await page.fill('input[placeholder*="Endereço"]', 'Rua Teste 123');
    await page.fill('textarea', 'Test Description');
    await page.click('text="Avançar"');

    // Step 2
    console.log('Step 2...');
    await page.fill('textarea[placeholder*="Ex: Jovens"]', 'Jovens');
    await page.fill('input[placeholder*="Ex: Jovem, dinâmico"]', 'Formal');
    await page.fill('textarea[placeholder*="Ex: Maria tem"]', 'Maria');
    await page.click('text="Avançar"');

    // Step 3
    console.log('Step 3...');
    await page.click('text="Ignorar extração por IA"');
    
    await page.fill('textarea[placeholder*="Descreva os produtos"]', 'Produto 1');
    await page.fill('textarea[placeholder*="Por que seus clientes"]', 'Qualidade');
    await page.fill('input[placeholder*="Ex: Produto A"]', 'Produto A');
    await page.click('text="Avançar"');

    // Step 4
    console.log('Step 4...');
    await page.click('text="Avançar"');

    // Step 5
    console.log('Step 5...');
    await page.click('text="Avançar"');

    // Step 6
    console.log('Step 6...');
    await page.click('text="Avançar"');

    // Step 7
    console.log('Step 7...');
    await page.fill('input[type="email"]', `test${Date.now()}@test.com`);
    await page.fill('input[placeholder*="Nome do responsável"]', 'Test');
    await page.fill('input[placeholder*="Telefone"]', '11999999999');
    
    console.log('Submitting...');
    await page.click('button:has-text("Criar Cliente")');

    console.log('Waiting for success or error...');
    await page.waitForTimeout(5000);
    
    console.log('Test completed.');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
