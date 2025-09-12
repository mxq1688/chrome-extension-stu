// Service Worker for Voice Recorder Extension
let offscreenDocument = null;

// 确保 offscreen document 存在
async function ensureOffscreenDocument() {
    if (offscreenDocument) return;
    
    try {
        // 检查是否已存在 offscreen document
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (existingContexts.length > 0) {
            offscreenDocument = existingContexts[0].documentId;
            return;
        }
        
        // 创建新的 offscreen document
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Recording audio requires a persistent document context'
        });
        
        // 等待一下让 offscreen document 初始化
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (contexts.length > 0) {
            offscreenDocument = contexts[0].documentId;
        }
        
    } catch (error) {
        console.error('Failed to create offscreen document:', error);
        throw error;
    }
}

// 向 offscreen document 发送消息
async function sendToOffscreen(message) {
    await ensureOffscreenDocument();
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response?.error || 'Unknown error'));
            }
        });
    });
}

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // 保持消息通道开放
});

async function handleMessage(message, sendResponse) {
    try {
        switch (message.action) {
            case 'startRecording':
                await ensureOffscreenDocument();
                const startResult = await sendToOffscreen({
                    action: 'startRecording',
                    settings: message.settings
                });
                sendResponse({ success: true, data: startResult });
                break;
                
            case 'stopRecording':
                const stopResult = await sendToOffscreen({
                    action: 'stopRecording'
                });
                sendResponse({ success: true, data: stopResult });
                break;
                
            case 'pauseRecording':
                await sendToOffscreen({
                    action: 'pauseRecording'
                });
                sendResponse({ success: true });
                break;
                
            case 'resumeRecording':
                await sendToOffscreen({
                    action: 'resumeRecording'
                });
                sendResponse({ success: true });
                break;
                
            case 'getRecordingStatus':
                const status = await sendToOffscreen({
                    action: 'getStatus'
                });
                sendResponse({ success: true, data: status });
                break;
                
            case 'audioLevel':
            case 'recordingStatusChanged':
                // 转发给 popup
                chrome.runtime.sendMessage(message);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Service worker error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Voice Recorder Extension installed');
});

// 扩展启动时的初始化
chrome.runtime.onStartup.addListener(() => {
    console.log('Voice Recorder Extension started');
});
