
interface TransactionDetails {
    id: string;
    fromCrypto: string;
    toCrypto?: string;
    fromNetwork?: string;
    toNetwork?: string;
    amount: number;
    receivedAmount?: number;
    destinationAddress?: string;
}

const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

export const sendTelegramNotification = async (tx: TransactionDetails) => {
    const text = `
🆕 <b>New Exchange Request</b> 🆕

🆔 <b>Transaction ID:</b> <code>${tx.id}</code>
━━━━━━━━━━━━━━━━━━━━━
📤 <b>Send:</b> ${tx.amount} ${tx.fromCrypto} ${tx.fromNetwork ? `(${tx.fromNetwork})` : ''}
📥 <b>Receive:</b> ${tx.receivedAmount || '0'} ${tx.toCrypto || ''} ${tx.toNetwork ? `(${tx.toNetwork})` : ''}
━━━━━━━━━━━━━━━━━━━━━
🏦 <b>To Address:</b>
<code>${tx.destinationAddress || 'N/A'}</code>

🔗 <b>Domain:</b> xangex.vercel.app
📅 <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
    `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
        });

        if (!response.ok) {
            console.error('Failed to send Telegram notification:', await response.text());
        }
    } catch (error) {
        // In 'no-cors' scenarios or network errors, we might land here
        console.error('Error sending Telegram notification:', error);
    }
};
