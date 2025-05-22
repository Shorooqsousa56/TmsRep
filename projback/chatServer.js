const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });

// آلية ping/pong لفحص الاتصال
function heartbeat() {
    this.isAlive = true;
}

// إعداد ping/pong
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.isAlive = true;
    ws.on('pong', heartbeat);

    // استقبال رسالة من client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);

            // إرسال الرسالة لكل clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });

        } catch (err) {
            console.error("Invalid message format:", err.message);
        }
    });

    // عند إغلاق الاتصال
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// فحص كل الاتصالات كل 30 ثانية
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log('Terminating inactive client');
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(); // نرسل ping وننتظر pong
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

console.log('WebSocket server running on ws://localhost:4000');
