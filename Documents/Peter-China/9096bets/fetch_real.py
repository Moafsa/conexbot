import asyncio
from playwright.async_api import async_playwright
import time

async def fetch_real_pages():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Modo Desktop
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        print("Go Home...")
        await page.goto("https://9096bets.com/")
        await page.wait_for_timeout(5000)

        # Clica Menu Cassino (Geralmente no Sidebar ou Feature Nav)
        # Vamos usar evaluate pra clicar pela URL do app vue/react router
        print("Indo Cassino...")
        await page.evaluate("""() => {
            let links = document.querySelectorAll('a, .feature-item, .menu-item');
            for(let l of links) {
                if(l.href && l.href.includes('/cassino')) { l.click(); return; }
                if(l.innerText && l.innerText.toLowerCase().includes('cassino')) { l.click(); return; }
            }
            window.location.href = '/cassino/';
        }""")
        
        await page.wait_for_timeout(5000)
        html_cassino = await page.content()
        with open("9096bets_cassino_real.html", "w", encoding="utf-8") as f:
            f.write(html_cassino)
        print("Cassino Salvo.")

        # Clica Slots
        print("Indo Slots...")
        await page.goto("https://9096bets.com/")
        await page.wait_for_timeout(3000)
        await page.evaluate("""() => {
            let links = document.querySelectorAll('a, .feature-item, .menu-item');
            for(let l of links) {
                if(l.href && l.href.includes('/slots')) { l.click(); return; }
                if(l.innerText && l.innerText.toLowerCase().includes('populares')) { l.click(); return; }
                if(l.innerText && l.innerText.toLowerCase().includes('slots')) { l.click(); return; }
            }
            window.location.href = '/slots/';
        }""")
        
        await page.wait_for_timeout(5000)
        html_slots = await page.content()
        with open("9096bets_slots_real.html", "w", encoding="utf-8") as f:
            f.write(html_slots)
        print("Slots Salvo.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(fetch_real_pages())
