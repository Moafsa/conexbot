import asyncio
import os
try:
    from playwright.async_api import async_playwright
except ImportError:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1")
        await page.goto("https://9096bets.com/")
        await page.wait_for_selector('img', timeout=15000)
        
        # Obter o HTML
        html = await page.content()
        with open('9096bets_dom.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
