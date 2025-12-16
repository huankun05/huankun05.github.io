// 全局状态
let postcards = []; 
let currentIndex = 0;
let isAnimating = false;
let isEditMode = false;

// DOM 元素获取
const getEl = (id) => document.getElementById(id);

const navList = getEl('navList');
const mainImage = getEl('mainImage');
const infoTitle = getEl('infoTitle');
const infoDesc = getEl('infoDesc');
const photoFlipper = getEl('photoFlipper');
const infoCard = getEl('infoCard');
const toolCard = getEl('toolCard');
const editBtn = getEl('editBtn');
const infoBtn = getEl('infoBtn');
const messageInput = getEl('messageInput');
const sizeSelect = getEl('sizeSelect');
const indentCheck = getEl('indentCheck');
const stampSpacer = getEl('stampSpacer');

// --- 初始化 ---
async function init() {
    try {
        const response = await fetch('data/postcards.json');
        if (!response.ok) throw new Error('data/postcards.json 加载失败');
        postcards = await response.json();

        isEditMode = false;
        currentIndex = 0; 
        
        renderNav();
        updateContent(currentIndex, true);
        bindEvents(); 
        
        if(sizeSelect) updateFontSize(sizeSelect.value);

    } catch (error) {
        console.error("初始化错误:", error);
        if(infoTitle) infoTitle.innerText = "数据加载失败";
    }
}

function bindEvents() {
    if(infoBtn) infoBtn.onclick = () => alert("网页版权归 @huankun 所有");
    if(editBtn) editBtn.onclick = toggleEditMode;

    const fontSel = getEl('fontSelect');
    if(fontSel) fontSel.onchange = function() {
        messageInput.style.fontFamily = this.value;
    };

    const colorSel = getEl('colorSelect');
    if(colorSel) colorSel.oninput = function() {
        messageInput.style.color = this.value;
    };

    if(sizeSelect) sizeSelect.oninput = function() {
        updateFontSize(this.value);
    };

    if(indentCheck) indentCheck.onchange = function() {
        if(this.checked) messageInput.classList.add('indented');
        else messageInput.classList.remove('indented');
    };

    // 强制占位块位置
    if(messageInput) {
        messageInput.addEventListener('input', function() {
            if (!this.contains(stampSpacer) || this.firstChild !== stampSpacer) {
                if(this.contains(stampSpacer)) {
                    this.prepend(stampSpacer); 
                } else {
                    const newSpacer = document.createElement('div');
                    newSpacer.id = 'stampSpacer';
                    newSpacer.className = 'stamp-spacer';
                    newSpacer.contentEditable = "false";
                    this.prepend(newSpacer);
                }
            }
        });
    }

    const clearBtn = getEl('clearBtn');
    if(clearBtn) clearBtn.onclick = function() {
        if(confirm("确定清空当前内容？")) {
            messageInput.innerHTML = "";
            if(stampSpacer) messageInput.appendChild(stampSpacer);
        }
    };

    const genBtn = getEl('generateBtn');
    if(genBtn) genBtn.onclick = downloadImages;
}

function updateFontSize(val) {
    if(!messageInput) return;
    const size = parseInt(val);
    const lineHeight = size * 2; 
    
    messageInput.style.fontSize = size + "px";
    document.documentElement.style.setProperty('--line-height', lineHeight + "px");
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    if (isEditMode) {
        editBtn.innerText = "退出";
        editBtn.classList.add('active');
        photoFlipper.classList.add('flipped');
        infoCard.style.display = 'none';
        toolCard.style.display = 'flex';
        updateFontSize(sizeSelect.value);
    } else {
        editBtn.innerText = "编辑";
        editBtn.classList.remove('active');
        photoFlipper.classList.remove('flipped');
        infoCard.style.display = 'flex';
        toolCard.style.display = 'none';
    }
}

function renderNav() {
    if(!navList) return;
    navList.innerHTML = '';
    postcards.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerText = item.title;
        if(index === currentIndex) li.classList.add('active');
        li.onclick = () => { if(currentIndex !== index) changeIndex(index); };
        navList.appendChild(li);
    });
}

function changeIndex(index) {
    if(isAnimating) return;
    isAnimating = true;

    const items = document.querySelectorAll('.nav-item');
    if(items[currentIndex]) items[currentIndex].classList.remove('active');
    if(items[index]) items[index].classList.add('active');
    
    currentIndex = index;
    updateContent(index);

    setTimeout(() => { isAnimating = false; }, 400);
}

function updateContent(index, instant = false) {
    const data = postcards[index];
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = data.img;
    img.onload = () => {
        if(mainImage) mainImage.src = data.img;
        if(infoTitle) infoTitle.innerText = data.title;
        if(infoDesc) infoDesc.innerText = data.desc;
    };
}

// --- 核心：下载修复 ---
function downloadImages() {
    if (typeof html2canvas === 'undefined') {
        alert("html2canvas 未加载");
        return;
    }
    const data = postcards[currentIndex];
    const name = data.title.replace(/\s/g, '');

    // 1. 下载正面
    const link1 = document.createElement('a');
    link1.href = data.img;
    link1.download = name + "_正面.png";
    link1.click();

    // 2. 截图背面
    const originalBack = getEl('cardBack');
    
    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1000px'; 
    tempContainer.style.height = '666px'; 
    document.body.appendChild(tempContainer);

    // 克隆
    const clonedBack = originalBack.cloneNode(true);
    clonedBack.style.transform = 'none';
    clonedBack.style.width = '100%';
    clonedBack.style.height = '100%';
    clonedBack.style.boxShadow = 'none';
    clonedBack.style.margin = '0';
    
    // --- 关键修复：强制设置行高变量 ---
    // 获取当前计算后的行高值
    const computedStyle = getComputedStyle(document.documentElement);
    const currentLineHeight = computedStyle.getPropertyValue('--line-height');
    // 强制写入到克隆节点的 style 属性中
    clonedBack.style.setProperty('--line-height', currentLineHeight);

    tempContainer.appendChild(clonedBack);

    html2canvas(clonedBack, {
        scale: 2, 
        backgroundColor: "#fdfdfd", 
        useCORS: true 
    }).then(canvas => {
        const link2 = document.createElement('a');
        link2.href = canvas.toDataURL("image/png");
        link2.download = name + "_背面.png";
        link2.click();
        
        document.body.removeChild(tempContainer);
    }).catch(err => {
        console.error(err);
        alert("图片生成失败");
        document.body.removeChild(tempContainer);
    });
}

window.addEventListener('wheel', (e) => {
    if(postcards.length === 0 || isAnimating) return;
    if(e.deltaY > 0) {
        let next = currentIndex + 1;
        if(next >= postcards.length) next = 0;
        changeIndex(next);
    } else {
        let prev = currentIndex - 1;
        if(prev < 0) prev = postcards.length - 1;
        changeIndex(prev);
    }
});

init();