console.log("录音助手 Content Script 已加载");let i=!1,r=null,l=null,n=null;chrome.runtime.onMessage.addListener((e,s,t)=>{switch(console.log("Content script 收到消息:",e),e.type){case"START_RECORDING_FROM_CONTEXT":u(),t({success:!0});break;case"STOP_RECORDING":a(),t({success:!0});break;case"GET_PAGE_INFO":t({title:document.title,url:window.location.href,domain:window.location.hostname});break;case"EXTENSION_STATUS_CHANGED":y(e.active),t({success:!0});break;default:t({error:"Unknown message type"})}});async function u(){if(i){a();return}try{await f()}catch(e){console.error("快速录音失败:",e),c("录音失败",e.message,"error")}}async function f(){try{const e=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}});r=new MediaRecorder(e,{mimeType:"audio/webm;codecs=opus"});const s=[];r.ondataavailable=t=>{t.data.size>0&&s.push(t.data)},r.onstop=()=>{const t=new Blob(s,{type:"audio/webm"}),o=URL.createObjectURL(t);chrome.runtime.sendMessage({type:"QUICK_RECORDING_COMPLETED",recording:{name:`网页录音 - ${document.title}`,blob:t,url:o,duration:Math.floor((Date.now()-l)/1e3),size:t.size,pageTitle:document.title,pageUrl:window.location.href}}),e.getTracks().forEach(p=>p.stop()),d(),i=!1,c("录音完成","录音已保存到录音助手","success")},r.onerror=t=>{console.error("录音错误:",t.error),c("录音错误",t.error.message,"error")},r.start(1e3),l=Date.now(),i=!0,m(),c("开始录音","点击停止按钮结束录音","info")}catch(e){throw new Error(`无法开始录音: ${e.message}`)}}function a(){r&&i&&r.stop()}function m(){d(),n=document.createElement("div"),n.id="voice-recorder-indicator",n.innerHTML=`
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
  `,document.body.appendChild(n);const e=document.getElementById("stop-recording-btn");e&&e.addEventListener("click",a)}function d(){n&&(n.remove(),n=null)}function c(e,s,t="info"){const o=document.createElement("div");o.style.cssText=`
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${g(t)};
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
  `,o.innerHTML=`
    <div style="font-weight: 600; margin-bottom: 4px;">${e}</div>
    <div style="opacity: 0.9;">${s}</div>
    
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
  `,document.body.appendChild(o),setTimeout(()=>{o.style.animation="slideInDown 0.3s ease-out reverse",setTimeout(()=>{o.parentNode&&o.remove()},300)},3e3)}function g(e){switch(e){case"success":return"#28a745";case"error":return"#dc3545";case"warning":return"#ffc107";default:return"#007bff"}}function y(e){console.log("扩展状态变化:",e),!e&&i&&a()}window.addEventListener("beforeunload",()=>{i&&a(),d()});document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.key==="R"&&(e.preventDefault(),i?a():u())});window.addEventListener("error",e=>{e.error&&e.error.message.includes("recorder")&&console.error("录音相关错误:",e.error)});console.log("录音助手 Content Script 初始化完成");
