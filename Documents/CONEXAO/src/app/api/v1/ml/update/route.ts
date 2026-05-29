import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        let body: any = {};
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else {
            // Parse as url-encoded or form-data
            const formData = await req.formData();
            formData.forEach((value, key) => {
                body[key] = value;
            });
        }
        
        const action = body.action || '';
        const plugin = body.plugin || '';
        const clientVersion = body.version || '1.0.0';
        const siteUrl = body.site_url || '';
        
        const allowedPlugins: Record<string, { folder: string, file: string, name: string, zip: string, desc: string }> = {
            'ts-ml-integration': {
                folder: 'ts-ml-integration',
                file: 'ts-ml-integration.php',
                name: 'ToySport Mercado Livre Integration',
                zip: 'ts-ml-integration.zip',
                desc: 'Integração completa entre WooCommerce e Mercado Livre com sincronização bidirecional, gestão de pedidos, mensagens, envios e muito mais.'
            },
            'conexbot-wp': {
                folder: 'conexbot-wp',
                file: 'conexbot-wp.php',
                name: 'Conexbot Automação & CRM (WhatsApp)',
                zip: 'conexbot-wp.zip',
                desc: 'Integre perfeitamente a Inteligência Artificial Conexão ao seu WooCommerce. O Bot mapeia seu estoque e interage com clientes via Chat e WhatsApp.'
            },
            'conext-writer': {
                folder: 'conext-writer',
                file: 'conext-writer.php',
                name: 'Conext Writer',
                zip: 'conext-writer.zip',
                desc: 'Multi-Agent AI Writer com fallbacks de OpenAI e Gemini para geração automatizada de conteúdo e otimização SEO.'
            }
        };
        
        if (!allowedPlugins[plugin]) {
            return NextResponse.json({ error: 'Invalid plugin' }, { status: 400 });
        }
        
        const pluginConfig = allowedPlugins[plugin];
        const pluginPath = path.join(process.cwd(), pluginConfig.folder, pluginConfig.file);
        let latestVersion = '1.0.0';
        
        if (fs.existsSync(pluginPath)) {
            const content = fs.readFileSync(pluginPath, 'utf8');
            const match = content.match(/\*\s*Version:\s*([0-9.]+)/i);
            if (match && match[1]) {
                latestVersion = match[1];
            }
        }
        
        if (action === 'version_check') {
            const hasUpdate = compareVersions(clientVersion, latestVersion) < 0;
            
            if (!hasUpdate) {
                return NextResponse.json({
                    version: latestVersion,
                    update_available: false
                });
            }
            
            return NextResponse.json({
                version: latestVersion,
                update_available: true,
                homepage: 'https://app.conext.click',
                download_url: `https://app.conext.click/${pluginConfig.zip}`,
                requires: '6.0',
                tested: '6.8',
                requires_php: '7.4',
                last_updated: new Date().toISOString().split('T')[0],
                sections: {
                    description: `<p>${pluginConfig.desc}</p>`,
                    changelog: `
                        <h4>Versão ${latestVersion}</h4>
                        <ul>
                            <li><strong>Melhoria:</strong> Atualizações de desempenho e segurança automáticas.</li>
                            <li><strong>Novo:</strong> Integração com servidor Conextbot.</li>
                        </ul>
                    `,
                    installation: '<p>Instale via WordPress Admin > Plugins > Adicionar Novo > Enviar Plugin</p>'
                }
            });
        } else if (action === 'update_success') {
            console.log(`[Plugin Update Success] Plugin ${plugin} updated to version ${clientVersion} on site ${siteUrl}`);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (err: any) {
        console.error('[Plugin Update API Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function compareVersions(v1: string, v2: string) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 < num2) return -1;
        if (num1 > num2) return 1;
    }
    return 0;
}
