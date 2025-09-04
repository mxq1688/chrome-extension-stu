console.log("录音助手 Content Script 已加载");let c=!1,i=null,y=null,s=null,n=null,l=null,p=[],m=null;chrome.runtime.onMessage.addListener((e,o,t)=>{switch(console.log("Content script 收到消息:",e),e.type){case"PING":t({success:!0,message:"Content script 运行正常"});break;case"REQUEST_MICROPHONE_PERMISSION":return x().then(r=>t(r)).catch(r=>t({success:!1,error:r.message})),!0;case"START_EXTENSION_RECORDING":return E(e.options).then(r=>t(r)).catch(r=>t({success:!1,error:r.message})),!0;case"STOP_EXTENSION_RECORDING":return h().then(r=>t(r)).catch(r=>t({success:!1,error:r.message})),!0;case"PAUSE_EXTENSION_RECORDING":return T().then(r=>t(r)).catch(r=>t({success:!1,error:r.message})),!0;case"RESUME_EXTENSION_RECORDING":return S().then(r=>t(r)).catch(r=>t({success:!1,error:r.message})),!0;case"GET_RECORDING_STATE":const a=n?n.state:"inactive";t({success:!0,state:a});break;case"START_RECORDING_FROM_CONTEXT":w(),t({success:!0});break;case"STOP_RECORDING":d(),t({success:!0});break;case"GET_PAGE_INFO":t({title:document.title,url:window.location.href,domain:window.location.hostname});break;case"EXTENSION_STATUS_CHANGED":O(e.active),t({success:!0});break;default:t({error:"Unknown message type"})}});async function x(){try{return console.log("请求麦克风权限..."),(await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0,sampleRate:44100}})).getTracks().forEach(o=>o.stop()),console.log("麦克风权限获取成功"),{success:!0,message:"麦克风权限已获取"}}catch(e){console.error("麦克风权限获取失败:",e);let o="获取麦克风权限失败";switch(e.name){case"NotAllowedError":o="用户拒绝了麦克风权限，请点击地址栏的麦克风图标允许访问";break;case"NotFoundError":o="未检测到麦克风设备，请连接麦克风后重试";break;case"NotReadableError":o="麦克风被其他应用程序占用，请关闭其他录音软件";break;case"OverconstrainedError":o="麦克风不支持请求的配置，请尝试使用其他麦克风";break;case"SecurityError":o="安全限制，请确保在 HTTPS 环境下使用";break}throw new Error(o)}}async function E(e={}){try{console.log("开始扩展录音...",e),n&&await h(),l=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:e.echoCancellation!==!1,noiseSuppression:e.noiseSuppression!==!1,autoGainControl:e.autoGainControl!==!1,sampleRate:44100}});const o=I(e.quality||"high");return n=new MediaRecorder(l,{mimeType:o.type,audioBitsPerSecond:o.bitrate}),p=[],m=Date.now(),n.ondataavailable=t=>{t.data.size>0&&p.push(t.data)},n.onerror=t=>{console.error("扩展录音错误:",t.error)},n.start(1e3),C(),console.log("扩展录音开始成功"),{success:!0,message:"录音已开始"}}catch(o){throw console.error("开始扩展录音失败:",o),o}}async function h(){return new Promise((e,o)=>{try{if(!n||n.state==="inactive")throw new Error("当前没有录音");n.onstop=()=>{try{const t=new Blob(p,{type:n.mimeType}),a=URL.createObjectURL(t),r=Math.floor((Date.now()-m)/1e3),g={blob:t,url:a,duration:r,size:t.size,mimeType:n.mimeType,pageTitle:document.title,pageUrl:window.location.href};R(),console.log("扩展录音停止成功",g),e({success:!0,recordingData:g})}catch(t){o(t)}},n.stop()}catch(t){o(t)}})}async function T(){try{if(!n||n.state!=="recording")throw new Error("当前没有录音或录音未在进行中");return n.pause(),console.log("扩展录音已暂停"),{success:!0,message:"录音已暂停"}}catch(e){throw console.error("暂停扩展录音失败:",e),e}}async function S(){try{if(!n||n.state!=="paused")throw new Error("当前没有暂停的录音");return n.resume(),console.log("扩展录音已恢复"),{success:!0,message:"录音已恢复"}}catch(e){throw console.error("恢复扩展录音失败:",e),e}}function R(){l&&(l.getTracks().forEach(e=>e.stop()),l=null),n=null,p=[],m=null,b()}function C(){b();const e=document.createElement("div");e.id="extension-recording-indicator",e.innerHTML=`
    <div style="
      position: fixed;
      top: 20px;
      left: 20px;
      background: #28a745;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: pulse 1.5s ease-in-out infinite;
    ">
      <span style="font-size: 14px;">🎙️</span>
      <span>录音助手录音中</span>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    </style>
  `,document.body.appendChild(e)}function b(){const e=document.getElementById("extension-recording-indicator");e&&e.remove()}function I(e="high"){const o={high:[{type:"audio/webm;codecs=opus",bitrate:128e3},{type:"audio/ogg;codecs=opus",bitrate:128e3},{type:"audio/mp4",bitrate:128e3},{type:"audio/webm",bitrate:96e3}],medium:[{type:"audio/webm;codecs=opus",bitrate:64e3},{type:"audio/ogg;codecs=opus",bitrate:64e3},{type:"audio/mp4",bitrate:64e3},{type:"audio/webm",bitrate:48e3}],low:[{type:"audio/webm;codecs=opus",bitrate:32e3},{type:"audio/ogg;codecs=opus",bitrate:32e3},{type:"audio/mp4",bitrate:32e3},{type:"audio/webm",bitrate:24e3}]},t=o[e]||o.high;for(const a of t)if(MediaRecorder.isTypeSupported(a.type))return a;return{type:"audio/webm",bitrate:48e3}}async function w(){if(c){d();return}try{await k()}catch(e){console.error("快速录音失败:",e),u("录音失败",e.message,"error")}}async function k(){try{const e=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}});i=new MediaRecorder(e,{mimeType:"audio/webm;codecs=opus"});const o=[];i.ondataavailable=t=>{t.data.size>0&&o.push(t.data)},i.onstop=()=>{const t=new Blob(o,{type:"audio/webm"}),a=URL.createObjectURL(t);chrome.runtime.sendMessage({type:"QUICK_RECORDING_COMPLETED",recording:{name:`网页录音 - ${document.title}`,blob:t,url:a,duration:Math.floor((Date.now()-y)/1e3),size:t.size,pageTitle:document.title,pageUrl:window.location.href}}),e.getTracks().forEach(r=>r.stop()),f(),c=!1,u("录音完成","录音已保存到录音助手","success")},i.onerror=t=>{console.error("录音错误:",t.error),u("录音错误",t.error.message,"error")},i.start(1e3),y=Date.now(),c=!0,N(),u("开始录音","点击停止按钮结束录音","info")}catch(e){throw new Error(`无法开始录音: ${e.message}`)}}function d(){i&&c&&i.stop()}function N(){f(),s=document.createElement("div"),s.id="voice-recorder-indicator",s.innerHTML=`
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: pulse 1.5s ease-in-out infinite;
    ">
      <span style="font-size: 16px;">🔴</span>
      <span>正在录音...</span>
      <button id="stop-recording-btn" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      ">停止</button>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    </style>
  `,document.body.appendChild(s);const e=document.getElementById("stop-recording-btn");e&&e.addEventListener("click",d)}function f(){s&&(s.remove(),s=null)}function u(e,o,t="info"){const a=document.createElement("div");a.style.cssText=`
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${M(t)};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 400px;
    text-align: center;
    animation: slideInDown 0.3s ease-out;
  `,a.innerHTML=`
    <div style="font-weight: 600; margin-bottom: 4px;">${e}</div>
    <div style="opacity: 0.9;">${o}</div>
    
    <style>
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    </style>
  `,document.body.appendChild(a),setTimeout(()=>{a.style.animation="slideInDown 0.3s ease-out reverse",setTimeout(()=>{a.parentNode&&a.remove()},300)},3e3)}function M(e){switch(e){case"success":return"#28a745";case"error":return"#dc3545";case"warning":return"#ffc107";default:return"#007bff"}}function O(e){console.log("扩展状态变化:",e),!e&&c&&d()}window.addEventListener("beforeunload",()=>{c&&d(),f()});document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.key==="R"&&(e.preventDefault(),c?d():w())});window.addEventListener("error",e=>{e.error&&e.error.message.includes("recorder")&&console.error("录音相关错误:",e.error)});console.log("录音助手 Content Script 初始化完成");
