
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mirror of the new normalize function
function digitsOnlyBrazil(raw) {
    if (!raw) return '';
    let s = String(raw).trim();
    s = s.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@g.us', '');
    s = s.split(':')[0];
    return s.replace(/\D/g, '');
}

function normalizeBrazilWhatsAppE164(raw) {
    let d = digitsOnlyBrazil(raw);
    if (!d) return d;
    while (d.startsWith('0')) d = d.slice(1);
    while (d.length > 13 && d.startsWith('5555')) {
        d = '55' + d.slice(4);
    }
    if (d.startsWith('55')) {
        const rest = d.slice(2);
        if (d.length === 14 && rest.length === 12) {
            const ddd = rest.slice(0, 2);
            const sub = rest.slice(2);
            if (sub.length === 10 && sub[0] === '9' && sub[1] === '9') {
                d = `55${ddd}9${sub.slice(1)}`;
            }
        }
        else if (d.length === 12 && rest.length === 10) {
            const ddd = rest.slice(0, 2);
            const afterDdd = rest.slice(2);
            if (afterDdd.length === 8) {
                d = `55${ddd}9${afterDdd}`;
            }
        }
        return d;
    }
    if (d.length === 11) return `55${d}`;
    if (d.length === 10) return `55${d.slice(0, 2)}9${d.slice(2)}`;
    return d;
}

async function main() {
    const contacts = await prisma.contact.findMany();
    console.log(`Migrating ${contacts.length} contacts...`);
    for (const c of contacts) {
        const newPhone = normalizeBrazilWhatsAppE164(c.phone);
        if (newPhone !== c.phone) {
            console.log(`Updating ${c.phone} -> ${newPhone}`);
            await prisma.contact.update({
                where: { id: c.id },
                data: { phone: newPhone }
            });
            
            // Also update conversations if any
            await prisma.conversation.updateMany({
                where: { remoteId: c.phone, botId: c.botId },
                data: { remoteId: newPhone }
            });
        }
    }
    console.log('Migration finished.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
