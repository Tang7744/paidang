(() => {
  'use strict';
  const M = window.PADANG_MEDIA;
  const resolveMarkup = html => html.replace(/(?:src|poster)="(assets\/[^\"]+)"/g,(match,path)=>window.PADANG_ASSETS?.[path]?match.replace(path,window.PADANG_ASSETS[path]):match);
  const screen = document.querySelector('#screen');
  const routes = new Set(['invite','plans','detail','camera','recording','captured','sealed','viewer','unlocked','processing','templates','combined','publish','request','feed']);
  const state = { page:'invite', card:0, video:0, submitted:false, revealed:false, requestSent:false, approved:false, published:false, recordingSeconds:0, description:'', modal:false, toast:'', epoch:0, combinedOrigin:'viewer', composition:'split' };
  let timer = null;
  let approvalTimer = null;
  let toastTimer = null;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const paths = {
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    check:'<path d="m5 12 4.5 5L19 7"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    wifi:'<path d="M3 8a14 14 0 0 1 18 0M6.5 11.5a9 9 0 0 1 11 0M10 15a3.5 3.5 0 0 1 4 0"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>',
    camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/>',
    timer:'<circle cx="12" cy="13" r="9"/><path d="M12 7v6l4 2M9 1h6"/>',
    flash:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7ZM3 3l18 18"/>',
    layout:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M11 3v18m0-10h10"/>',
    beauty:'<circle cx="11" cy="8" r="3"/><path d="M4 21v-3a7 7 0 0 1 14 0v3m1-18v6m-3-3h6"/>',
    caption:'<rect x="3" y="6" width="18" height="15" rx="3"/><path d="M7 11h8m-8 5h6m6-14v4m3-2v4"/>',
    delete:'<path d="M8 5h13v14H8L2 12Z" fill="currentColor" stroke="none"/><path d="m11 9 6 6m0-6-6 6" stroke="#000" stroke-width="1.6"/>',
    heart:'<path d="M12 21C9 18 2 13 2 7.5 2 1 9 1 12 6c3-5 10-5 10 1.5C22 13 15 18 12 21Z" fill="currentColor" stroke="none"/>',
    comment:'<path d="M12 2C6 2 1 6 1 11s4 9 10 9v3l6-4c4-2 6-4 6-8S18 2 12 2Z" fill="currentColor" stroke="none"/><g fill="#b7b7b7" stroke="none"><circle cx="7" cy="11" r="1.5"/><circle cx="12" cy="11" r="1.5"/><circle cx="17" cy="11" r="1.5"/></g>',
    bookmark:'<path d="M5 2h14v21l-7-5-7 5Z" fill="currentColor" stroke="none"/>',
    shareFill:'<path d="m14 1 10 9-10 10v-6C7 14 3 16 0 20c0-9 5-13 14-13Z" fill="currentColor" stroke="none"/>',
    search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',
    play:'<path d="M7 3c-1-1-3 0-3 2v14c0 2 2 3 3 2l14-8c1-1 1-2 0-3Z" fill="currentColor" stroke="none"/>',
    playOutline:'<path d="m7 3 13 8c1 1 1 2 0 3L7 21c-1 1-3 0-3-2V5c0-2 2-3 3-2Z"/>',
    upload:'<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="m8 11 4-4 4 4m-4-4v10" stroke="#ff2c54"/>',
    draft:'<path d="M4 8h16v12H4ZM4 8l3-5h10l3 5m-11 5h6"/>',
    none:'<circle cx="12" cy="12" r="10"/><path d="m5 5 14 14"/>',
    flame:'<path d="M12 1c1 5-5 6-5 12-2-1-2-3-2-4-8 13 14 21 17 6 0-4-4-8-4-8 1 7-5 6-6 4 3-3 3-7 0-10Z" fill="currentColor" stroke="none"/>',
    pin:'<circle cx="12" cy="6" r="3"/><path d="M12 10v8m-4-5c-6 1-6 7 4 8 10-1 10-7 4-8"/>',
    auto:'<rect x="3" y="5" width="13" height="15" rx="3" fill="#ff2c54" stroke="none" transform="rotate(-12 9 12)"/><path d="m8 8 5 4-5 3Z" fill="white" stroke="none"/><path d="m16 3 6 2-3 13" stroke="#ff2c54"/>',
  };
  function svg(name,size=24,cls='') {return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.close}</svg>`;}
  function icon(name,cls='black') {return `<img class="icon ${cls}" src="assets/icons/${name}.svg" alt="" draggable="false">`;}
  function button(label,action,content,cls='',disabled=false) {return `<button class="${cls}" aria-label="${label}" ${action?`data-action="${action}"`:''} ${disabled?'disabled':''}>${content}</button>`;}
  const back = action => button('返回',action,icon('chevron-left-24'),'icon-button back');
  const avatar = (who,cls='') => `<img class="avatar ${cls}" src="${who==='sienna'?M.avatarSienna:M.avatarYou}" alt="${who==='sienna'?'Sienna':'你的头像'}">`;
  function status() {return `<div class="status" aria-hidden="true"><span class="clock">9:41</span><div class="status-icons"><span class="signal"><i></i><i></i><i></i><i></i></span>${svg('wifi',17)}<span class="battery"><i></i></span></div></div>`;}
  function nav(title,action='back') {return `<header class="nav">${back(action)}<h1>${title}</h1></header>`;}
  function shell(content,cls='') {return `<section class="page ${cls}" data-page="${state.page}">${status()}${content}<div class="home-indicator" aria-hidden="true"></div></section>`;}
  const formatTime = seconds => {
    const hundredths=Math.round(Math.max(0,seconds)*100);
    return `${String(Math.floor(hundredths/6000)).padStart(2,'0')}:${String(Math.floor(hundredths/100)%60).padStart(2,'0')}.${String(hundredths%100).padStart(2,'0')}`;
  };
  function media(who,cls='',loop=true) {
    const item=M[who];
    return `<video class="photo-video ${cls}" data-person="${who}" aria-label="${who==='sienna'?'Sienna 的视频':'你的视频'}" poster="${item.poster}" src="${item.src}" muted ${loop?'loop':''} playsinline preload="auto"></video>`;
  }
  const sequencePlayback = new WeakMap();
  let activeVideo=null, playbackRequest=0, playbackSuppressed=false;
  let playbackChannel=null;
  try {playbackChannel=new BroadcastChannel('padang-playback-owner');} catch {}
  function claimPlayback() {
    playbackSuppressed=false;
    playbackChannel?.postMessage('claim');
  }
  if(playbackChannel)playbackChannel.onmessage=event=>{
    if(event.data!=='claim')return;
    playbackSuppressed=true;
    stopAllMedia();
    const page=screen.querySelector('.page');
    if(!page?.querySelector('video')||page.querySelector('.page-resume'))return;
    const resume=document.createElement('button');
    resume.className='media-retry page-resume';resume.textContent='点击继续播放';
    resume.onclick=event=>{event.stopPropagation();claimPlayback();syncPlayback();};
    page.append(resume);
  };
  const canPlay = video => !playbackSuppressed && !document.hidden && video.isConnected && video.dataset.playbackActive==='true' &&
    video.closest('.page')===screen.querySelector('.page') && !video.closest('[inert]');
  function stopVideo(video) {
    // Mute synchronously, before pause or any pending play promise can settle.
    video.muted=true;
    video.pause();
    if(activeVideo===video)activeVideo=null;
  }
  function stopAllMedia() {
    playbackRequest++;
    if(activeVideo)stopVideo(activeVideo);
    screen.querySelectorAll('video').forEach(video=>{
      video.dataset.playbackActive='false';
      stopVideo(video);
    });
  }
  function playWithSound(video) {
    if(!canPlay(video)){stopVideo(video);return;}
    const request=++playbackRequest;
    if(activeVideo&&activeVideo!==video)stopVideo(activeVideo);
    screen.querySelectorAll('video').forEach(other=>{if(other!==video)stopVideo(other);});
    activeVideo=video;
    video.muted=false;
    video.volume=1;
    video.play().then(()=>{
      // An older request may resolve after a rapid switch away and back.
      if(request!==playbackRequest){if(activeVideo!==video)stopVideo(video);return;}
      if(activeVideo!==video||!canPlay(video)){stopVideo(video);return;}
      video.parentElement.querySelector('.media-retry')?.remove();
    }).catch(error=>{
      if(request!==playbackRequest)return;
      stopVideo(video);
      if(error.name==='AbortError'||!canPlay(video))return;
      const host=video.parentElement;
      if(host.querySelector('.media-retry'))return;
      const retry=document.createElement('button');
      retry.className='media-retry';
      retry.textContent=error.name==='NotAllowedError'?'点击播放原声':'重新播放';
      retry.onclick=event=>{event.preventDefault();event.stopPropagation();retry.remove();playWithSound(video);};
      host.append(retry);
    });
  }
  // Media events also enforce ownership when a delayed browser event arrives.
  screen.addEventListener('playing',event=>{
    const video=event.target;if(video.tagName!=='VIDEO')return;
    if(video!==activeVideo||!canPlay(video)){stopVideo(video);return;}
    video.muted=false;
  },true);
  screen.addEventListener('pause',event=>{
    const video=event.target;
    if(video.tagName==='VIDEO'&&video.paused)video.muted=true;
  },true);
  screen.addEventListener('ended',event=>{
    if(event.target.tagName==='VIDEO')event.target.muted=true;
  },true);
  screen.addEventListener('waiting',event=>{
    if(event.target.tagName==='VIDEO')event.target.muted=true;
  },true);
  function syncPlayback() {
    const page=screen.querySelector('.page');
    if(!page)return;
    if(!playbackSuppressed)page.querySelector('.page-resume')?.remove();
    // Stop every inactive clip before starting another, so original audio never overlaps.
    stopAllMedia();
    page.querySelectorAll('video').forEach(video=>{
      video.parentElement.querySelector('.media-retry')?.remove();
    });
    page.querySelectorAll('.split-preview,.sequence-preview').forEach(group=>{
      const single=group.classList.contains('sequence-preview');
      const show=index=>{
        if(!single)return;
        group.querySelectorAll('.sequence-clip').forEach((clip,i)=>{
          clip.classList.toggle('active',i===index);
          clip.setAttribute('aria-hidden',String(i!==index));
        });
      };
      const clips=[...group.querySelectorAll('video')];
      let sequence=sequencePlayback.get(group);
      if(!sequence){
        sequence={index:0};sequencePlayback.set(group,sequence);
        clips.forEach((video,index)=>{
          video.loop=false;
          video.addEventListener('ended',()=>{
            if(!canPlay(video)||sequence.index!==index)return;
            video.dataset.playbackActive='false';stopVideo(video);
            sequence.index=(index+1)%clips.length;
            // Hold the upper clip's last frame while the lower one plays.
            // Once both finish, reset together and repeat from the top.
            if(!single&&sequence.index===0)clips.forEach(clip=>{clip.currentTime=0;});
            const next=clips[sequence.index];
            if(single)next.currentTime=0;
            show(sequence.index);
            next.dataset.playbackActive='true';
            playWithSound(next);
          });
        });
      }
      show(sequence.index);
      const active=clips[sequence.index];
      if(active){active.dataset.playbackActive='true';playWithSound(active);}
    });
    page.querySelectorAll('video').forEach(video=>{
      if(video.closest('.split-preview,.sequence-preview'))return;
      const pane=video.closest('.media-pane,.detail-card');
      const index=video.dataset.person==='sienna'?0:1;
      const selected=state.page==='viewer'||state.page==='processing'?state.video:state.card;
      if(pane&&index!==selected)return;
      video.dataset.playbackActive='true';
      playWithSound(video);
    });
  }
  function split() {return `<div class="split-preview"><div class="split-half">${media('sienna','',false)}</div><div class="split-half">${media('you','',false)}</div></div>`;}
  function singleSequence(cls='') {
    return `<div class="sequence-preview ${cls}">${['sienna','you'].map((who,i)=>`<div class="sequence-clip ${i===0?'active':''}" aria-hidden="${i!==0}">${media(who,'',false)}</div>`).join('')}</div>`;
  }
  function compositionPreview(){return state.composition==='sequence'?singleSequence():split();}
  function compositionCover() {
    const poster=who=>`<img class="photo-video" src="${M[who].poster}" alt="${who==='sienna'?'视频 1':'视频 2'}封面">`;
    return state.composition==='sequence'?poster('sienna'):`<div class="split-preview"><div class="split-half">${poster('sienna')}</div><div class="split-half">${poster('you')}</div></div>`;
  }
  function chatNav() {return `<header class="nav chat-nav">${back('chat-back')}${avatar('sienna')}<span class="name">Sienna</span>${button('通话',null,icon('phone-24'),'icon-button call',true)}${button('更多',null,icon('more-horizontal-24'),'icon-button more',true)}</header>`;}
  function composer() {return `<div class="composer" aria-label="消息工具栏，仅展示">${icon('camera-24')}<div class="composer-field"><span class="composer-placeholder">消息…</span>${icon('microphone-24')}${icon('album-24')}${icon('emoji-24')}${icon('add-circle-24')}</div></div>`;}
  function inviteCover() {return `<div class="invite-cover" aria-hidden="true"><svg class="cover-arrow" viewBox="0 0 185 119"><path d="M151 62c34 15 26 25 15 30" fill="none" stroke="#080808" stroke-width="4" stroke-linecap="round"/></svg><div class="mini-portrait you"><span>@you</span><img src="${M.avatarYou}" alt=""></div><div class="mini-portrait sienna"><span>@Sienna</span><img src="${M.avatarSienna}" alt=""></div><svg class="cover-arrow front" viewBox="0 0 185 119"><path d="M41 51C-9 59 37 98 96 94m-18-11 19 12-23 10" fill="none" stroke="#080808" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;}
  function inviteCard() {return `<article class="invite-card">${inviteCover()}<div class="invite-copy"><h3>模仿对方平时的一个小动作</h3><p>@Sienna 邀请你一起合拍</p></div>${button('查看详情','detail','查看详情','card-view')}${button('加入拍摄计划','plans','加入拍摄计划','card-plan')}</article>`;}
  function invitePage() {return shell(`${chatNav()}<div class="profile">${avatar('sienna')}<h2>Sienna</h2><p>237个关注账号 · 724个粉丝</p></div><div class="chat-time">今天 下午5:13</div><div class="message-line">${avatar('sienna')}<div class="chat-bubble">我们来拍这个吧！</div></div>${inviteCard()}${composer()}`,'invite');}
  function plansPage() {const plans=[['模仿对方平时的一个小动作','和 Sienna 一起完成',M.sienna.poster],['交换彼此的招牌表情','换个视角，发现彼此',M.you.poster],['用三个动作介绍对方','把默契拍成小片段',M.avatarYou]];return shell(`${nav('拍摄计划')}<div class="plans-tabs"><span class="active">全部计划</span><span>待拍摄</span><span>已完成</span></div><div class="plan-list">${plans.map(([title,subtitle,cover],i)=>`<article class="plan-row"><img class="plan-cover" src="${cover}" alt=""><div class="plan-copy"><h2>${title}</h2><p>${subtitle}</p></div>${button('开始拍摄',i===0?'detail':null,'开始拍摄','plan-button',i!==0)}</article>`).join('')}</div>`,'plans');}
  function participants(selected) {return `<div class="participants">${[0,1].map(i=>button(i===0?'查看 Sienna 的视频':'查看我的视频',`select-${i}`,avatar(i===0?'sienna':'you'),`participant ${selected===i?'active':''}`)).join('')}</div>`;}
  function detailPage(mode='detail') {
    const ready=mode==='sealed'||mode==='unlocked';const unlocked=mode==='unlocked';
    function card(i) {if(unlocked)return `<div class="detail-card">${media(i===0?'sienna':'you')}</div>`;
      if(i===1&&!ready)return `<div class="detail-card"><div class="empty-content">${icon('camera-24')}<span>快来拍摄你的部分吧！</span></div></div>`;
      return `<div class="detail-card sealed"><img class="poster" src="assets/sealed-source.png" alt=""><div class="seal-content">${icon('lock-24')}<span>${i===0?'@Sienna 选择了双方拍摄完成后揭晓':'你的视频已封存'}</span></div></div>`;}
    let cta=ready?(unlocked?'查看合拍视频':'揭晓视频'):`${svg('camera',18)}开始拍摄`;
    return shell(`${nav('一起拍','detail-back')}${participants(state.card)}<div class="detail-carousel" data-swipe="detail" aria-label="左右滑动查看双方拍摄卡片" tabindex="0"><div class="detail-track" style="transform:translateX(${-313*state.card}px)">${card(0)}${card(1)}</div></div><div class="submitted">${ready?'2':'1'}/2人已提交</div><h2 class="topic">模仿对方平时的一个小动作</h2>${button(unlocked?'查看合拍视频':ready?'揭晓视频':'开始拍摄',unlocked?'view-again':ready?'reveal':'camera',cta,'btn primary detail-cta')}${ready?button('重新拍摄','retake','重新拍摄','retake-link'):''}`,`detail ${ready?'detail-ready':''}`);
  }
  function cameraTools(edit=false) {const tools=edit?['settings','share','frame','video-cards','text','sticker','effects','filters','voice','expand']:['switch','flash','timer','layout','beauty','caption','expand'];return `<aside class="tools ${edit?'edit-tools':'camera-tools'}" aria-label="拍摄工具，仅展示">${tools.map(name=>`<span class="tool">${edit?icon('edit-'+name,''):`<img class="camera-tool-icon" src="assets/icons/camera-${name}.png" alt="">`}</span>`).join('')}<span class="divider"></span></aside>`;}
  function cameraPage(mode) {const recording=mode==='recording',captured=mode==='captured';
    const top=`<div class="camera-top">${button(captured?'返回拍摄':'退出拍摄',captured?'camera':'cancel-camera',captured||recording?icon('chevron-left-24'):svg('close'),'icon-button back')}${!recording&&!captured?`<div class="music-pill">${icon('music-note-24','') }添加音乐</div>`:''}</div>`;
    const preview=`<div class="camera-preview">${mode==='camera'?`<img class="photo-video" src="${M.you.poster}" alt="拍摄预览">`:media('you','recording-video',captured)}</div>`;
    if(captured)return shell(`${preview}${top}${cameraTools(true)}<div class="bottom-actions">${button('重新拍摄','retake','重新拍摄','btn light')}${button('确定','submit-take','确定','btn primary')}</div>`,'dark camera captured');
    if(recording)return shell(`${preview}${top}${cameraTools()}<div class="record-time" aria-live="off">${formatTime(state.recordingSeconds)} / ${formatTime(M.you.duration)}</div><div class="record-gallery"><img src="assets/filter-preview.jpg" alt="" class="photo-video"></div>${button('停止拍摄','stop-record',`<svg class="record-ring" viewBox="0 0 96 96"><circle cx="48" cy="48" r="45" style="stroke-dashoffset:${283*(1-state.recordingSeconds/M.you.duration)}"/></svg>`,'record-button')}${button('删除片段','clear-record',svg('delete'),'record-delete',state.recordingSeconds===0)}${button('完成拍摄','stop-record',svg('check',24),'record-check')}`,'dark camera recording');
    return shell(`${preview}${top}${cameraTools()}<div class="camera-tabs"><span>10 分钟</span><span>60 秒</span><span class="selected">${M.you.duration.toFixed(2)} 秒</span><span>照片</span><span>文字</span></div>${button('开始录制','start-record','','record-button')}<img class="filter-thumb one" src="assets/filter-preview.jpg" alt="滤镜预览"><img class="filter-thumb two" src="${M.avatarYou}" alt="滤镜预览"><div class="camera-bottom"><span class="ai"><span class="gallery"><img class="photo-video" src="assets/template-1.jpg" alt=""></span><em>AI</em> SELF</span><span class="selected">相机</span><span>创作</span><span>直播</span></div>`,'dark camera');
  }
  function viewerPage() {return shell(`${nav('一起拍','viewer-back')}${participants(state.video)}<div class="viewer-media" data-swipe="video" aria-label="左右滑动查看双方视频" tabindex="0"><div class="viewer-track" style="transform:translateX(${-393*state.video}px)"><div class="media-pane">${media('sienna')}</div><div class="media-pane">${media('you')}</div></div></div><div class="viewer-dots">${[0,1].map(i=>button('查看第'+(i+1)+'个视频','select-'+i,'',state.video===i?'active':'')).join('')}</div><div class="bottom-actions">${button('一键成片','auto',`${svg('auto',20)}一键成片`,'btn light')}${button('下一步(2)','combined','下一步(2)','btn primary')}</div>`,'dark viewer');}
  function storyButton() {return button('你的限时动态',null,`<span class="story-avatar">${avatar('you')}</span>你的限时动态`,'btn light',true);}
  function combinedPage() {return shell(`${compositionPreview()}<div class="camera-top">${back('combined-back')}<div class="music-pill">${icon('music-note-24','')}原声 ${svg('close',16)}</div></div>${cameraTools(true)}<div class="bottom-actions">${storyButton()}${button('下一步','publish','下一步','btn primary')}</div>`,'dark combined');}
  function templatesPage(){return shell(`${singleSequence('template-preview')}<div class="camera-top"><div class="music-pill">${icon('music-note-24','')}原声 ${svg('close',20)}</div></div>`,'dark templates');}
  function publishPage() {return shell(`${nav('','publish-back')}<textarea class="publish-input" aria-label="添加描述" placeholder="添加描述…" maxlength="200">${esc(state.description)}</textarea><div class="publish-cover">${compositionCover()}<span class="cover-label">预览</span><div class="edit-cover">编辑封面</div></div><div class="publish-tags"><span class="tag"># 话题标签</span><span class="tag">@ 提及</span></div><div class="publish-options"><div class="option">${svg('pin',20)}<span>位置</span><span class="info">i</span>${svg('chevron',16,'chevron')}</div><div class="location-tags"><span>TOKYO TOWER</span><span>新宿マルイ メン 屋…</span><span>东京城市景观</span></div><div class="option">${icon('globe-24')}<span>所有人可见</span>${svg('chevron',16,'chevron')}</div><div class="option">${icon('settings-24')}<span>更多选项</span>${svg('chevron',16,'chevron')}</div><div class="option">${icon('edit-share','black')}<span>分享到</span><span class="trailing">下载 ×</span></div></div><div class="bottom-actions">${button('草稿',null,`${svg('draft',18)}草稿`,'btn grey',true)}${button('发布','open-confirm',`${svg('upload',18)}发布`,'btn primary')}</div>`,'publish');}
  function requestPage() {return shell(`${chatNav()}<div class="chat-scroll">${inviteCard()}<div class="chat-time">今天 下午5:13</div>${button('查看合拍视频','request-preview',`${compositionCover()}<span class="play-overlay">${svg('play',30)}</span>`,'request-video')}${button('发布',state.approved?'final-publish':null,'发布',`request-publish ${state.approved?'approved':''}`,!state.approved)}<span class="screen-reader-only" role="status">${state.approved?'Sienna 已同意，可以发布':'正在等待 Sienna 同意发布'}</span></div>${composer()}`,'request-chat');}
  function processingSheet() {return `<div class="sheet-shade"></div><section class="sheet processing-sheet" role="dialog" aria-modal="true" aria-label="正在处理"><div class="processing-cover"><img src="${M.sienna.poster}" alt=""><svg class="processing-ring" viewBox="0 0 56 56"><circle cx="28" cy="28" r="25" style="stroke-dashoffset:157"/></svg><span class="progress-number">0%</span></div><h2>正在处理…</h2><p>处理完成前，请勿离开</p></section>`;}
  function templatesSheet() {const names=['Ishq Hai Slow','trend','Trend','try this template','Bleeding'];return `<section class="sheet templates-sheet" role="dialog" aria-modal="false" aria-label="选择模板"><header class="templates-heading"><span class="none">${svg('none',23)}</span>选择模板${button('关闭模板','close-templates',svg('close',24),'icon-button')}</header><div class="templates-list" aria-label="模板展示，不可切换">${names.map((name,i)=>`<div class="template-item ${i===0?'selected':''}" aria-disabled="true"><img src="assets/template-${i}.jpg" alt="${name}"><span>${name}</span></div>`).join('')}</div><div class="bottom-actions">${storyButton()}${button('下一步','template-next','下一步','btn primary')}</div></section>`;}
  function confirmDialog() {return `<div class="confirm-shade"><section class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">发布合拍视频</h2><p>发布前需要获得 Sienna 的同意，是否向对方发送请求？</p><div class="confirm-actions">${button('取消','cancel-confirm','取消')}${button('发送请求','send-request','发送请求')}</div></section></div>`;}
  function feedPage() {return shell(`<div class="feed-media">${compositionPreview()}</div>${button('返回聊天','feed-back',icon('chevron-left-24'),'icon-button feed-back')}<div class="feed-search">${svg('search',19)}<span class="search-label">查找相关内容</span><span class="search-word">搜索</span></div><aside class="feed-actions" aria-label="视频操作，仅展示">${avatar('you','feed-author-avatar')}<span class="feed-action">${svg('heart',32)}<span>0</span></span><span class="feed-action">${svg('comment',32)}<span>抢首评</span></span><span class="feed-action">${svg('bookmark',32)}<span>0</span></span><span class="feed-action">${svg('shareFill',32)}<span>分享</span></span><img class="feed-disc" src="${M.avatarYou}" alt="音乐封面"></aside><div class="feed-author">你<span class="feed-time">· 刚刚</span><div class="feed-caption">${esc(state.description||'模仿对方平时的一个小动作')} @Sienna</div></div><div class="feed-promotion">${svg('flame',17)}<span>您的内容可能会爆火——立即行动!</span>${svg('chevron',18,'chevron')}</div><div class="feed-bottom">${svg('playOutline',21)}<span>0 次观看</span><span class="privacy">隐私设置</span></div>`,'dark feed');}

  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let outgoingPage = null;
  function render() {
    stopAllMedia();
    outgoingPage?.remove();
    outgoingPage = null;
    const previous = screen.querySelector('.page');
    clearInterval(timer); timer=null;
    const page=state.page;
    let markup=page==='invite'?invitePage():page==='plans'?plansPage():['detail','sealed','unlocked'].includes(page)?detailPage(page):['camera','recording','captured'].includes(page)?cameraPage(page):page==='viewer'||page==='processing'?viewerPage():page==='combined'?combinedPage():page==='templates'?templatesPage():page==='publish'?publishPage():page==='request'?requestPage():feedPage();
    screen.innerHTML=resolveMarkup(markup);
    if(page==='processing')screen.querySelector('.page').insertAdjacentHTML('beforeend',resolveMarkup(processingSheet()));
    if(page==='templates')screen.querySelector('.page').insertAdjacentHTML('beforeend',resolveMarkup(templatesSheet()));
    if(state.modal)screen.querySelector('.page').insertAdjacentHTML('beforeend',confirmDialog());
    if(state.modal||page==='processing'){
      for(const child of screen.querySelector('.page').children){
        if(!child.matches('.sheet,.confirm-shade,.home-indicator'))child.inert=true;
      }
    }
    if(state.toast)screen.querySelector('.page').insertAdjacentHTML('beforeend',`<div class="toast" role="status">${esc(state.toast)}</div>`);
    document.body.classList.toggle('dark-mobile',!!screen.querySelector('.page.dark'));
    document.title='拍档 · '+({invite:'一起拍',plans:'拍摄计划',detail:'查看详情',camera:'开始拍摄',recording:'拍摄中',captured:'拍摄完成',sealed:'等待揭晓',unlocked:'一起拍',viewer:'查看视频',processing:'正在处理',templates:'选择模板',combined:'合拍视频',publish:'发布',request:'发布请求',feed:'合拍作品'}[page]);
    if(state.modal)screen.querySelector('[data-action="cancel-confirm"]').focus({preventScroll:true});
    if(page==='recording'){
      const video=screen.querySelector('.recording-video');
      const update=()=>{
        if(state.page!=='recording'||screen.querySelector('.recording-video')!==video)return;
        const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:M.you.duration;
        state.recordingSeconds=Math.min(video.currentTime,duration);
        screen.querySelector('.record-time').textContent=`${formatTime(state.recordingSeconds)} / ${formatTime(duration)}`;
        screen.querySelector('.record-ring circle').style.strokeDashoffset=283*(1-state.recordingSeconds/duration);
        screen.querySelector('.record-delete').disabled=state.recordingSeconds===0;
      };
      video.addEventListener('loadedmetadata',update);
      video.addEventListener('ended',()=>{
        if(state.page==='recording'&&video.isConnected)navigate('captured');
      },{once:true});
      timer=setInterval(update,50);
    }
    if(page==='processing'){
      const start=performance.now();const epoch=state.epoch;
      timer=setInterval(()=>{if(epoch!==state.epoch)return;const progress=Math.min(100,Math.round((performance.now()-start)/20));
        screen.querySelector('.progress-number').textContent=progress+'%';screen.querySelector('.processing-ring circle').style.strokeDashoffset=157*(1-progress/100);
        if(progress>=100)navigate('templates',true);
      },50);
    }
    bindSwipe();
    syncPlayback();
    if(previous && previous.dataset.page !== page && !reducedMotion()) {
      // Keep the outgoing pixels until the incoming page has faded in.
      previous.inert = true;
      previous.setAttribute('aria-hidden','true');
      previous.style.zIndex = '60';
      screen.append(previous);
      outgoingPage = previous;
      const animation = previous.animate([{opacity:1},{opacity:0}], {
        duration:240, easing:'cubic-bezier(.22,.61,.36,1)', fill:'forwards'
      });
      animation.finished.then(()=>{
        previous.remove();
        if(outgoingPage===previous)outgoingPage=null;
      }).catch(()=>{});
    }
  }
  function navigate(page,replace=false) {
    if(!routes.has(page))return;
    state.epoch++;state.modal=false;state.toast='';state.page=page;
    if(replace)history.replaceState({page,composition:state.composition},'',`#${page}`);else if(location.hash!==`#${page}`)history.pushState({page,composition:state.composition},'',`#${page}`);
    render();
  }
  function toast(text){state.toast=text;render();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{state.toast='';screen.querySelector('.toast')?.remove();},1500);}
  function select(index){
    index=Math.max(0,Math.min(1,index));
    const viewer=state.page==='viewer';
    if(viewer)state.video=index;else state.card=index;
    const page=screen.querySelector('.page');
    const track=page.querySelector(viewer?'.viewer-track':'.detail-track');
    if(!track)return;
    track.style.transition='';
    track.style.transform=`translateX(${-index*(viewer?393:313)}px)`;
    page.querySelectorAll('.participant,.viewer-dots button').forEach(button=>{
      const selected=button.dataset.action===`select-${index}`;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    syncPlayback();
  }
  function startApproval(){clearTimeout(approvalTimer);approvalTimer=setTimeout(()=>{state.approved=true;if(state.page==='request')render();},3000);}
  function reset(){clearTimeout(approvalTimer);clearTimeout(toastTimer);Object.assign(state,{card:0,video:0,submitted:false,revealed:false,requestSent:false,approved:false,published:false,recordingSeconds:0,description:'',modal:false,toast:'',composition:'split'});navigate('invite',true);}
  const actions={
    'detail':()=>{state.card=state.submitted?1:0;navigate(state.revealed?'unlocked':state.submitted?'sealed':'detail');},
    'plans':()=>navigate('plans'),
    'back':()=>navigate('invite'),
    'chat-back':()=>state.page==='request'?navigate('publish'):null,
    'detail-back':()=>navigate(state.requestSent?'request':'invite'),
    'camera':()=>{state.recordingSeconds=0;navigate('camera');},
    'retake':()=>{state.recordingSeconds=0;navigate('camera');},
    'cancel-camera':()=>navigate(state.revealed?'unlocked':state.submitted?'sealed':'detail'),
    'start-record':()=>{state.recordingSeconds=0;navigate('recording');},
    'stop-record':()=>navigate('captured'),
    'clear-record':()=>{state.recordingSeconds=0;navigate('camera');},
    'submit-take':()=>{state.submitted=true;state.revealed=false;state.card=1;navigate('sealed');},
    'reveal':()=>{state.revealed=true;state.video=0;navigate('viewer');},
    'view-again':()=>{state.composition='split';state.combinedOrigin='unlocked';navigate('combined');},
    'viewer-back':()=>{state.card=state.video;navigate('unlocked');},
    'select-0':()=>select(0),'select-1':()=>select(1),
    'auto':()=>{state.composition='sequence';navigate('processing');},
    'close-templates':()=>navigate('viewer'),
    'template-next':()=>{state.composition='sequence';state.combinedOrigin='templates';navigate('combined');},
    'combined':()=>{state.composition='split';state.combinedOrigin='viewer';navigate('combined');},
    'combined-back':()=>navigate(state.combinedOrigin),
    'publish':()=>navigate('publish'),
    'publish-back':()=>navigate('combined'),
    'open-confirm':()=>{state.modal=true;render();},
    'cancel-confirm':()=>{state.modal=false;render();},
    'send-request':()=>{state.requestSent=true;state.approved=false;navigate('request');startApproval();},
    'request-preview':()=>{state.combinedOrigin='request';navigate('combined');},
    'final-publish':()=>{if(!state.approved)return;state.published=true;navigate('feed');},
    'feed-back':()=>navigate('request')
  };
  screen.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button||button.disabled||button.closest('[inert]'))return;actions[button.dataset.action]?.();});
  screen.addEventListener('input',event=>{if(event.target.matches('.publish-input'))state.description=event.target.value;});
  screen.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.modal){state.modal=false;render();}});
  function bindSwipe(){
    const target=screen.querySelector('[data-swipe]');if(!target)return;
    const kind=target.dataset.swipe, step=kind==='video'?393:313;
    const track=target.firstElementChild;
    const current=()=>kind==='video'?state.video:state.card;
    let gesture=null, wheelLocked=false;
    target.addEventListener('pointerdown',event=>{
      if(event.button!==0||gesture)return;
      const scale=screen.getBoundingClientRect().width/393;
      const offset=new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,scale,offset,index:current(),time:performance.now(),horizontal:false};
      track.style.transition='none';
      track.style.transform=`translateX(${offset}px)`;
      target.setPointerCapture(event.pointerId);
    });
    target.addEventListener('pointermove',event=>{
      const g=gesture;if(!g||g.id!==event.pointerId)return;
      const dx=(event.clientX-g.x)/g.scale,dy=(event.clientY-g.y)/g.scale;
      if(!g.horizontal&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy))g.horizontal=true;
      if(!g.horizontal)return;
      let offset=g.offset+dx;
      if(offset>0)offset*=.22;
      if(offset< -step)offset=-step+(offset+step)*.22;
      track.style.transform=`translateX(${offset}px)`;
    });
    const finish=(event,cancelled=false)=>{
      const g=gesture;if(!g||g.id!==event.pointerId)return;gesture=null;
      const dx=(event.clientX-g.x)/g.scale;
      const velocity=dx/Math.max(1,performance.now()-g.time);
      let index=g.index;
      if(!cancelled&&g.horizontal&&(Math.abs(dx)>step*.18||(Math.abs(dx)>12&&Math.abs(velocity)>.45)))index+=dx<0?1:-1;
      // Commit the dragged position before enabling the snap transition.
      void track.offsetWidth;
      select(index);
      if(target.hasPointerCapture(event.pointerId))target.releasePointerCapture(event.pointerId);
    };
    target.addEventListener('pointerup',event=>finish(event));
    target.addEventListener('pointercancel',event=>finish(event,true));
    target.addEventListener('lostpointercapture',event=>finish(event,true));
    target.addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight'].includes(event.key)){
        event.preventDefault();select(current()+(event.key==='ArrowRight'?1:-1));
      }
    });
    target.addEventListener('wheel',event=>{
      if(Math.abs(event.deltaX)>Math.abs(event.deltaY)&&Math.abs(event.deltaX)>15){
        event.preventDefault();if(wheelLocked)return;
        wheelLocked=true;select(current()+(event.deltaX>0?1:-1));
        setTimeout(()=>wheelLocked=false,380);
      }
    },{passive:false});
  }
  function fit(){const mobile=innerWidth<=600;const scale=mobile?Math.min(innerWidth/393,innerHeight/852):Math.min(1,(innerHeight-101)/852,(innerWidth-64)/393);const s=Math.max(.3,scale);screen.style.transform=`scale(${s})`;const device=document.querySelector('#device');device.style.width=`${393*s}px`;device.style.height=`${852*s}px`;document.querySelector('.desktop-footer').style.width=`${393*s}px`;}
  document.querySelector('#restart').addEventListener('click',reset);
  window.addEventListener('resize',fit);
  window.addEventListener('popstate',event=>{state.composition=event.state?.composition==='sequence'?'sequence':'split';const next=location.hash.slice(1);state.page=routes.has(next)?next:'invite';state.epoch++;state.modal=false;render();});
  window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(approvalTimer);stopAllMedia();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAllMedia();else {claimPlayback();syncPlayback();}});
  window.addEventListener('focus',()=>{if(!document.hidden){claimPlayback();syncPlayback();}});
  screen.addEventListener('click',claimPlayback,true);
  let route=location.hash.slice(1);state.page=routes.has(route)?route:'invite';
  state.composition=['processing','templates'].includes(state.page)||history.state?.composition==='sequence'?'sequence':'split';
  if(state.page==='combined'&&state.composition==='sequence')state.combinedOrigin='templates';
  if(['sealed','viewer','unlocked','combined','processing','templates','publish','request','feed'].includes(state.page))state.submitted=true;
  if(['viewer','unlocked','combined','processing','templates','publish','request','feed'].includes(state.page))state.revealed=true;
  if(['sealed','unlocked'].includes(state.page))state.card=1;
  if(state.page==='request'){state.requestSent=true;startApproval();}
  if(state.page==='feed'){state.requestSent=true;state.approved=true;state.published=true;}
  claimPlayback();fit();render();
})();
