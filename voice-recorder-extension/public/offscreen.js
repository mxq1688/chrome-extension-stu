// Offscreen 录音控制器
class OffscreenRecorder {
    constructor() {
        this.recorder = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.micStream = null;
        this.tabStream = null;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.audioChunks = [];
        
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sendResponse);
            return true; // 保持消息通道开放
        });
    }

    async handleMessage(message, sendResponse) {
        try {
            switch (message.action) {
                case 'startRecording':
                    await this.startRecording(message.settings);
                    sendResponse({ success: true });
                    break;
                case 'stopRecording':
                    const result = await this.stopRecording();
                    sendResponse({ success: true, data: result });
                    break;
                case 'pauseRecording':
                    this.pauseRecording();
                    sendResponse({ success: true });
                    break;
                case 'resumeRecording':
                    this.resumeRecording();
                    sendResponse({ success: true });
                    break;
                case 'getStatus':
                    sendResponse({ 
                        success: true, 
                        data: {
                            isRecording: this.isRecording,
                            recordingTime: this.getRecordingTime()
                        }
                    });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Offscreen recorder error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async startRecording(settings) {
        if (this.isRecording) {
            throw new Error('Already recording');
        }

        try {
            // 获取音频流
            const { micStream, tabStream } = await this.getAudioStreams(settings);
            
            // 创建音频上下文
            this.audioContext = new AudioContext();
            
            // 设置增益控制
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = settings.gain || 1.0;
            
            // 创建分析器用于音频级别检测
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            // 连接音频节点
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // 根据输入源选择音频流
            let audioStream;
            if (settings.inputSource === 'mic') {
                audioStream = micStream;
            } else if (settings.inputSource === 'tab') {
                audioStream = tabStream;
            } else if (settings.inputSource === 'mix') {
                audioStream = this.mixAudioStreams(micStream, tabStream);
            }
            
            // 创建 MediaRecorder
            this.mediaRecorder = new MediaRecorder(audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.isRecording = false;
                this.notifyStatusChange();
            };
            
            // 开始录音
            this.mediaRecorder.start(100); // 每100ms收集一次数据
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // 开始音频级别检测
            this.startLevelDetection();
            
            this.notifyStatusChange();
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    async getAudioStreams(settings) {
        const constraints = {
            audio: {
                echoCancellation: settings.echoCancellation !== false,
                noiseSuppression: settings.noiseSuppression !== false,
                autoGainControl: settings.autoGainControl !== false
            }
        };

        let micStream = null;
        let tabStream = null;

        // 获取麦克风流
        if (settings.inputSource === 'mic' || settings.inputSource === 'mix') {
            try {
                micStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    error._dismissed = true;
                }
                throw error;
            }
        }

        // 获取标签页音频流
        if (settings.inputSource === 'tab' || settings.inputSource === 'mix') {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0]) {
                    tabStream = await chrome.tabCapture.capture({ audio: true });
                }
            } catch (error) {
                console.warn('Failed to capture tab audio:', error);
                if (settings.inputSource === 'tab') {
                    throw new Error('无法录制标签页音频，请确保标签页正在播放音频');
                }
            }
        }

        return { micStream, tabStream };
    }

    mixAudioStreams(micStream, tabStream) {
        const destination = this.audioContext.createMediaStreamDestination();
        
        if (micStream) {
            const micSource = this.audioContext.createMediaStreamSource(micStream);
            micSource.connect(this.gainNode);
            this.gainNode.connect(destination);
        }
        
        if (tabStream) {
            const tabSource = this.audioContext.createMediaStreamSource(tabStream);
            tabSource.connect(destination);
        }
        
        return destination.stream;
    }

    startLevelDetection() {
        const checkLevel = () => {
            if (!this.isRecording || !this.analyser) return;
            
            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);
            
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = average / 255;
            
            // 发送音频级别到 popup
            chrome.runtime.sendMessage({
                action: 'audioLevel',
                level: level
            });
            
            requestAnimationFrame(checkLevel);
        };
        
        checkLevel();
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.pause();
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.resume();
        }
    }

    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            return null;
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const recordingTime = this.getRecordingTime();
                
                this.cleanup();
                
                resolve({
                    audioBlob,
                    recordingTime,
                    timestamp: Date.now()
                });
            };
            
            this.mediaRecorder.stop();
        });
    }

    getRecordingTime() {
        if (!this.isRecording || !this.recordingStartTime) return 0;
        return Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }

    cleanup() {
        this.isRecording = false;
        this.recordingStartTime = null;
        
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        
        if (this.tabStream) {
            this.tabStream.getTracks().forEach(track => track.stop());
            this.tabStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
        this.gainNode = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    notifyStatusChange() {
        chrome.runtime.sendMessage({
            action: 'recordingStatusChanged',
            isRecording: this.isRecording,
            recordingTime: this.getRecordingTime()
        });
    }
}

// 初始化录音器
const offscreenRecorder = new OffscreenRecorder();
