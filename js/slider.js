/*
  滑动项目卡片组件（纯静态实现，适用于 GitHub Pages）
  使用方法：
  1. 在 projects/cards/ 下新增 {name}.html 片段（根元素建议 <article class="proj-card">）。
  2. 在下方 cardFiles 数组中追加该文件名。
  3. 片段中可用 <details open> 与 <summary> 形成可折叠块。
  4. 页面 index.html 放置结构：
     <div id="slider" class="proj-slider">...（参见本次改动示例）
  5. 不依赖任何框架；触摸/键盘/按钮/指示点均可导航。
*/

const cardFiles = [
  'mobilenet.html',
  'vit.html',
  'yolo.html',
  'detr.html',
  'face_pose.html',
  'sr.html',
  'colorization.html',
  'style_transfer.html'
];

(async function initSlider(){
  const slider = document.getElementById('proj-slider');
  if(!slider) return;
  const track = slider.querySelector('.proj-track');
  const dots = slider.querySelector('.proj-dots');
  const btnPrev = slider.querySelector('.proj-prev');
  const btnNext = slider.querySelector('.proj-next');
  const counter = slider.querySelector('.proj-counter');

  // 如果是 file:// 协议，浏览器会阻止 fetch 本地片段 => 提供回退方案
  if(location.protocol === 'file:') {
    slider.classList.add('proj-fallback');
    const list = document.createElement('div');
    list.className = 'proj-fallback-list';
    list.innerHTML = `<p style="color:#a00;font-weight:600;">当前以 file:// 打开，出于浏览器安全策略无法使用 fetch 载入卡片。可选：</p>
      <ol style="margin:10px 0 16px 22px;line-height:1.5;">
        <li>推荐：在项目根目录启动本地服务器（见下方命令）。</li>
        <li>或直接访问 <code>projects/project*.html</code> 的完整页面。</li>
      </ol>
      <div class="proj-fallback-links"></div>
      <details open><summary>如何启动本地预览</summary>
        <pre style="background:#f5f5f5;padding:10px 14px;border-radius:6px;overflow:auto;"># PowerShell (Python)
python -m http.server 8000

# Node (安装 http-server 后)
npx http-server -p 8000
        </pre>
      </details>`;
    const linkWrap = list.querySelector('.proj-fallback-links');
    cardFiles.forEach(f=>{
      const base = f.replace('.html','');
      // 给出独立详情页的猜测链接或片段名提示
      const guess = base.includes('mobilenet')? 'projects/project1.html' :
                    base.includes('vit')? 'projects/project2_vit_classification.html' :
                    base.includes('yolo')? 'projects/project3_yolov5.html' :
                    base.includes('detr')? 'projects/project4_detr.html' :
                    base.includes('face_pose')? 'projects/project5_face_pose.html' :
                    base.includes('sr')? 'projects/project6_sr.html' :
                    base.includes('colorization')? 'projects/project7_colorization.html' :
                    base.includes('style_transfer')? 'projects/project8_style_transfer.html' : '';
      const a = document.createElement('a');
      a.href = guess || '#';
      a.textContent = base + (guess? ' （详情页）':'');
      a.style.display = 'inline-block';
      a.style.margin = '4px 12px 4px 0';
      if(!guess) a.style.opacity = '.6';
      linkWrap.appendChild(a);
    });
    // 清空原结构并插入回退信息
    track.replaceWith(list);
    btnPrev.remove(); btnNext.remove(); counter.remove(); dots.remove();
    return; // 不再继续 fetch 逻辑
  }

  const slides = [];
  for(const file of cardFiles){
    try {
      const res = await fetch(`projects/cards/${file}`);
      if(!res.ok) continue;
      const html = await res.text();
      const wrap = document.createElement('div');
      wrap.className = 'proj-slide';
      wrap.innerHTML = html;
      track.appendChild(wrap);
      slides.push(wrap);
    } catch(e){
      console.warn('加载失败', file, e);
    }
  }
  if(!slides.length) return;

  // 生成指示点
  slides.forEach((_,i)=>{
    const b = document.createElement('button');
    b.setAttribute('aria-label', '跳转第 '+(i+1)+' 项');
    b.addEventListener('click', ()=>{ index = i; update(); });
    dots.appendChild(b);
  });

  let index = 0;
  function update(){
    track.style.transform = `translateX(${-index*100}%)`;
    dots.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active', i===index));
    counter.textContent = `${index+1} / ${slides.length}`;
    btnPrev.disabled = index===0;
    btnNext.disabled = index===slides.length-1;
  }

  btnPrev.addEventListener('click', ()=>{ if(index>0){ index--; update(); }});
  btnNext.addEventListener('click', ()=>{ if(index<slides.length-1){ index++; update(); }});

  // 键盘
  document.addEventListener('keydown', e=>{
    if(e.key==='ArrowRight'){ if(index<slides.length-1){ index++; update(); }}
    else if(e.key==='ArrowLeft'){ if(index>0){ index--; update(); }}
  });

  // 触摸
  let startX=0, dx=0, touching=false;
  track.addEventListener('touchstart', e=>{ touching=true; startX=e.touches[0].clientX; dx=0; }, {passive:true});
  track.addEventListener('touchmove', e=>{
    if(!touching) return; dx = e.touches[0].clientX - startX; track.style.transition='none';
    const percent = dx / track.clientWidth * 100; track.style.transform = `translateX(${ -index*100 + percent }%)`;
  }, {passive:true});
  track.addEventListener('touchend', ()=>{
    track.style.transition='';
    if(Math.abs(dx)>50){ if(dx<0 && index<slides.length-1) index++; else if(dx>0 && index>0) index--; }
    update(); touching=false;
  });

  // 全部展开 / 折叠
  const toggleAllBtn = slider.querySelector('.proj-toggle');
  if(toggleAllBtn){
    let expanded = true;
    toggleAllBtn.addEventListener('click', ()=>{
      expanded = !expanded;
      slides.forEach(s=>s.querySelectorAll('details').forEach(d=> expanded ? d.setAttribute('open','') : d.removeAttribute('open')));
      toggleAllBtn.textContent = expanded ? '全部折叠' : '全部展开';
    });
  }

  update();
})();
