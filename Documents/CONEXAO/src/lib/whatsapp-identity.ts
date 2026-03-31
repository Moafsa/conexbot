import { PhoneUtils } from '@/lib/phone-utils';

/**
 * WuzAPI / WhatsApp podem enviar IsFromMe, FromMe ou fromMe (JSON).
 */
export function resolveMessageFromMe(info: Record<string, unknown>): boolean {
    const i = info as Record<string, unknown>;
    if (i.IsFromMe === true) return true;
    if (i.FromMe === true) return true;
    if (i.fromMe === true) return true;
    return false;
}

function isPnJid(jid: string): boolean {
    return jid.includes('@s.whatsapp.net') && !jid.includes('@lid');
}

function isLidJid(jid: string): boolean {
    return jid.includes('@lid');
}

function isNoiseChat(jid: string): boolean {
    return (
        !jid ||
        jid.includes('status@broadcast') ||
        jid.includes('@newsletter')
    );
}

/**
 * Escolhe o JID do **cliente** (interlocutor) para remoteId + envio.
 *
 * - Mensagem **sua** (fromMe): o remetente é o negócio; o cliente está em **Chat**
 *   (ou RecipientAlt), nunca em Sender sozinho.
 * - Mensagem **recebida**: prioriza número real (@s.whatsapp.net) quando Sender é @lid
 *   e SenderAlt traz o PN.
 */
export function resolveWhatsAppCustomerKeys(params: {
    info: Record<string, unknown>;
    fromMe: boolean;
    isGroup: boolean;
}): { remoteId: string; chatJid: string } {
    const { info, fromMe, isGroup } = params;
    const i = info as Record<string, unknown>;
    const chat = String(i.Chat || i.chat || '').trim();
    const sender = String(i.Sender || i.sender || '').trim();
    const senderAlt = String(i.SenderAlt || i.senderAlt || '').trim();
    const recipientAlt = String(i.RecipientAlt || i.recipientAlt || '').trim();

    if (isGroup) {
        let peer = sender;
        if (isLidJid(sender) && senderAlt) peer = senderAlt;
        return {
            remoteId: PhoneUtils.normalize(peer),
            chatJid: chat || peer,
        };
    }

    if (fromMe) {
        const peer = pickPeerOutgoing(chat, recipientAlt, senderAlt);
        return {
            remoteId: PhoneUtils.normalize(peer),
            chatJid: chat || peer,
        };
    }

    const peer = pickPeerIncoming(sender, senderAlt, chat, recipientAlt);
    return {
        remoteId: PhoneUtils.normalize(peer),
        chatJid: chat || peer,
    };
}

function pickPeerOutgoing(chat: string, recipientAlt: string, senderAlt: string): string {
    if (chat && !isNoiseChat(chat)) return chat;
    if (recipientAlt) return recipientAlt;
    if (senderAlt) return senderAlt;
    return chat;
}

function pickPeerIncoming(
    sender: string,
    senderAlt: string,
    chat: string,
    recipientAlt: string
): string {
    if (sender && isPnJid(sender)) return sender;

    if (sender && isLidJid(sender)) {
        if (senderAlt && isPnJid(senderAlt)) return senderAlt;
        if (recipientAlt && isPnJid(recipientAlt)) return recipientAlt;
        if (chat && isPnJid(chat)) return chat;
        if (senderAlt) return senderAlt;
        if (chat && isLidJid(chat) && chat !== sender) return chat;
        return sender || chat;
    }

    if (sender) return sender;
    if (senderAlt) return senderAlt;
    return chat;
}
