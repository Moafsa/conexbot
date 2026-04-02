import asyncio
from playwright.async_api import async_playwright

async def get_dom(url, filename):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1")
        print(f"Buscando {url}...")
        await page.goto(url)
        # Espera o app carregar (geralmente existe um .container ou imgs)
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"{filename} salvo.")
        await browser.close()

async def main():
    await get_dom("https://9096bets.com/cassino/", "9096bets_cassino_dom.html")
    await get_dom("https://9096bets.com/slots/", "9096bets_slots_dom.html")

if __name__ == '__main__':
    asyncio.run(main())
