let treeData = [];
let hasUnsavedChanges = false; 
let currentLang = localStorage.getItem('appLang') || 'uk-UA'; 
let langDict = {}; 

const treeRoot = document.getElementById('treeRoot');
const searchInput = document.getElementById('searchInput');

const inputName = document.getElementById('nodeName');
const inputDesc = document.getElementById('nodeDesc');
const inputBorderColor = document.getElementById('nodeBorderColor');
const inputTextColor = document.getElementById('nodeTextColor');
const inputParentId = document.getElementById('targetParentId');
const editNodeId = document.getElementById('editNodeId');
const targetIndicator = document.getElementById('targetIndicator');
const btnResetTarget = document.getElementById('btnResetTarget');
const btnToggleTheme = document.getElementById('btnToggleTheme');
const langSelect = document.getElementById('langSelect');
const btnAddNode = document.getElementById('btnAddNode');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const syncColors = document.getElementById('syncColors');

async function initApp() {
  await loadLanguage(currentLang);

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    btnToggleTheme.textContent = '☀️';
  }
  renderTree();
}

async function loadLanguage(lang) {
  try {
    const response = await fetch(`${lang}.json`);
    langDict = await response.json();
    currentLang = lang;
    localStorage.setItem('appLang', lang);

    langSelect.value = lang;
    document.documentElement.lang = lang; 
    applyTranslations();
  } catch (error) {
    console.error(error);
  }
}

langSelect.addEventListener('change', (e) => {
  loadLanguage(e.target.value);
});

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (langDict[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = langDict[key];
      } else {
        el.innerHTML = langDict[key];
      }
    }
  });

  if (editNodeId.value) {
    btnAddNode.textContent = langDict["btn-update"];
  } else {
    btnAddNode.textContent = langDict["ui-btn-add"];
  }

  if (targetIndicator.innerHTML.includes('📍') || targetIndicator.innerHTML.includes('✏️')) {
     if (editNodeId.value) {
       const nodeText = inputName.value;
       targetIndicator.innerHTML = `${langDict["target-edit"]} <strong>${nodeText}</strong>`;
     } else if (inputParentId.value === '') {
       targetIndicator.innerHTML = langDict["ui-target-main"];
     } else {
       const strongTag = targetIndicator.querySelector('strong');
       const pName = strongTag ? strongTag.innerText : '';
       targetIndicator.innerHTML = `${langDict["target-prefix"]} <strong>${pName}</strong>`;
     }
  }

  renderTree();
}

inputBorderColor.addEventListener('input', function() {
  if (syncColors.checked) { inputTextColor.value = this.value; }
});

inputTextColor.addEventListener('input', function() { syncColors.checked = false; });

syncColors.addEventListener('change', function() {
  if (this.checked) { inputTextColor.value = inputBorderColor.value; }
});

btnToggleTheme.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark'); btnToggleTheme.textContent = '☀️';
  } else {
    localStorage.setItem('theme', 'light'); btnToggleTheme.textContent = '🌙';
  }
});

function renderTree() {
  treeRoot.innerHTML = '';
  if (treeData.length === 0) {
    const emptyText = langDict["tree-empty"] || "The tree is empty. Add your first branch!";
    treeRoot.innerHTML = `<li style="color: var(--text-muted); padding: 20px;">${emptyText}</li>`;
    return;
  }
  treeData.forEach(node => treeRoot.appendChild(createNodeElement(node)));
}

function createNodeElement(node) {
  const li = document.createElement('li');
  
  let descHtml = '';
  let descBtnHtml = '';
  if (node.description) {
    const descText = langDict["btn-desc"] || "Description";
    descBtnHtml = `<button class="btn-icon btn-desc-toggle" title="Toggle Description">🔽</button>`;
    descHtml = `<div class="node-desc" style="display: none;">${node.description}</div>`;
  }

  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'node-wrapper';
  
  const appliedBorderColor = node.borderColor || '#1a73e8';
  const appliedTextColor = node.textColor || appliedBorderColor;
  
  const hasChildren = node.children && node.children.length > 0;
  const toggleHtml = hasChildren ? `<div class="toggle-icon"></div>` : `<div class="toggle-placeholder"></div>`;

  wrapperDiv.innerHTML = `
    <div class="node-card">
      <div class="node-header">
        <div class="title-wrap">
          ${toggleHtml}
          <span class="color-dot" style="background-color: ${appliedBorderColor};"></span>
          <span class="node-text" style="color: ${appliedTextColor};">${node.text}</span>
        </div>
        <div class="node-actions">
          ${descBtnHtml}
          <button class="btn-icon btn-edit" data-id="${node.id}" title="Edit branch">✏️</button>
          <button class="btn-icon btn-add-child" data-id="${node.id}" data-name="${node.text}" title="Add sub-branch">+</button>
          <button class="btn-icon btn-delete" data-id="${node.id}" title="Delete branch">✖</button>
        </div>
      </div>
      ${descHtml}
    </div>
  `;

  if (hasChildren) {
    const details = document.createElement('details');
    details.open = true;
    const summary = document.createElement('summary');
    
    summary.appendChild(wrapperDiv);
    details.appendChild(summary);

    const ul = document.createElement('ul');
    node.children.forEach(child => ul.appendChild(createNodeElement(child)));
    details.appendChild(ul);
    li.appendChild(details);
  } else {
    const spacerWrapper = document.createElement('div');
    spacerWrapper.style.display = 'flex';
    spacerWrapper.style.alignItems = 'flex-start';
    spacerWrapper.style.gap = '8px';
    
    const spacer = document.createElement('div');
    spacer.style.width = '16px'; 
    spacer.style.flexShrink = '0';
    
    spacerWrapper.appendChild(spacer);
    spacerWrapper.appendChild(wrapperDiv);
    
    li.appendChild(spacerWrapper);
  }
  return li;
}

function generateId() { return Date.now().toString(); }

function findNodeById(dataArray, id) {
  for (let node of dataArray) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function deleteNodeById(dataArray, id) {
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i].id === id) { dataArray.splice(i, 1); return true; }
    if (dataArray[i].children && dataArray[i].children.length > 0) {
      const deleted = deleteNodeById(dataArray[i].children, id);
      if (deleted) return true;
    }
  }
  return false;
}

treeRoot.addEventListener('click', function(e) {
  const descToggleBtn = e.target.closest('.btn-desc-toggle');
  if (descToggleBtn) {
    e.preventDefault();
    const card = descToggleBtn.closest('.node-card');
    const descDiv = card.querySelector('.node-desc');
    if (descDiv) {
      if (descDiv.style.display === 'none') {
        descDiv.style.display = 'block';
      } else {
        descDiv.style.display = 'none';
      }
    }
    return;
  }

  if (e.target.closest('.btn-add-child')) {
    e.preventDefault();
    btnCancelEdit.click();
    const btn = e.target.closest('.btn-add-child');
    const parentId = btn.getAttribute('data-id');
    const parentName = btn.getAttribute('data-name');
    
    inputParentId.value = parentId;
    targetIndicator.innerHTML = `${langDict["target-prefix"]} <strong>${parentName}</strong>`;
    btnResetTarget.style.display = 'block';
    inputName.focus();
    return;
  }
  
  if (e.target.closest('.btn-delete')) {
    e.preventDefault();
    const btn = e.target.closest('.btn-delete');
    const idToDelete = btn.getAttribute('data-id');
    const alertMsg = langDict["alert-delete"] || "Are you sure you want to delete this branch?";
    if (confirm(alertMsg)) {
      deleteNodeById(treeData, idToDelete);
      if (inputParentId.value === idToDelete || editNodeId.value === idToDelete) { 
        btnCancelEdit.click(); 
        btnResetTarget.click(); 
      }
      hasUnsavedChanges = true; 
      renderTree();
    }
    return;
  }

  if (e.target.closest('.btn-edit')) {
    e.preventDefault();
    const btn = e.target.closest('.btn-edit');
    const idToEdit = btn.getAttribute('data-id');
    const node = findNodeById(treeData, idToEdit);
    
    if (node) {
      inputName.value = node.text;
      inputDesc.value = node.description || '';
      inputBorderColor.value = node.borderColor || '#1a73e8';
      inputTextColor.value = node.textColor || node.borderColor || '#1a73e8';
      syncColors.checked = (inputBorderColor.value === inputTextColor.value);
      editNodeId.value = node.id;
      inputParentId.value = ''; 
      targetIndicator.innerHTML = `${langDict["target-edit"]} <strong>${node.text}</strong>`;
      btnResetTarget.style.display = 'none';
      btnAddNode.textContent = langDict["btn-update"];
      btnCancelEdit.style.display = 'block';
      inputName.focus();
    }
    return;
  }
});

btnResetTarget.addEventListener('click', function() {
  inputParentId.value = '';
  targetIndicator.innerHTML = langDict["ui-target-main"];
  this.style.display = 'none';
});

btnCancelEdit.addEventListener('click', function() {
  editNodeId.value = '';
  inputName.value = '';
  inputDesc.value = '';
  btnAddNode.textContent = langDict["ui-btn-add"];
  this.style.display = 'none';
  targetIndicator.innerHTML = langDict["ui-target-main"];
});

btnAddNode.addEventListener('click', function() {
  const text = inputName.value.trim();
  const desc = inputDesc.value.trim();
  const borderColor = inputBorderColor.value;
  const textColor = inputTextColor.value;
  const parentId = inputParentId.value;
  const editingId = editNodeId.value;

  if (!text) { 
    alert(langDict["alert-name"] || "Please enter a branch name!"); 
    return; 
  }

  if (editingId) {
    const node = findNodeById(treeData, editingId);
    if (node) {
      node.text = text; node.description = desc; node.borderColor = borderColor; node.textColor = textColor;
    }
    btnCancelEdit.click();
  } else {
    const newNode = { id: generateId(), text: text, description: desc, borderColor: borderColor, textColor: textColor, children: [] };
    if (parentId === '') { treeData.push(newNode); } 
    else {
      const parentNode = findNodeById(treeData, parentId);
      if (parentNode) parentNode.children.push(newNode);
    }
    inputName.value = ''; inputDesc.value = '';
  }
  hasUnsavedChanges = true; 
  renderTree();
});

document.getElementById('btnSaveJson').addEventListener('click', function() {
  if (treeData.length === 0) { 
    alert(langDict["alert-empty"] || "The tree is empty, nothing to save."); 
    return; 
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treeData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "my_tree.json");
  document.body.appendChild(downloadAnchorNode); 
  downloadAnchorNode.click(); 
  downloadAnchorNode.remove();
  hasUnsavedChanges = false; 
});

document.getElementById('btnLoadJson').addEventListener('click', function() { document.getElementById('inputFile').click(); });

document.getElementById('inputFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const loadedData = JSON.parse(event.target.result);
      if (Array.isArray(loadedData)) { 
        treeData = loadedData; hasUnsavedChanges = false; renderTree(); btnCancelEdit.click(); 
      } else { 
        alert(langDict["alert-format"] || "Invalid file format. Expected a JSON array."); 
      }
    } catch (error) { 
      alert(langDict["alert-error"] || "Error reading JSON file."); 
    }
  };
  reader.readAsText(file); this.value = '';
});

searchInput.addEventListener('input', function() {
  const filter = this.value.toLowerCase().trim();
  const allItems = treeRoot.querySelectorAll('li');
  if (!filter) { allItems.forEach(li => li.style.display = ''); return; }

  allItems.forEach(li => li.style.display = 'none');
  allItems.forEach(li => {
    const textSpan = li.querySelector('.node-text');
    const descDiv = li.querySelector('.node-desc');
    
    const textContent = textSpan ? textSpan.innerText.toLowerCase() : '';
    const descContent = descDiv ? descDiv.innerText.toLowerCase() : '';

    if (textContent.includes(filter) || descContent.includes(filter)) {
      li.style.display = '';
      
      if (descContent.includes(filter) && filter !== "") {
        if (descDiv && descDiv.style.display === 'none') {
          descDiv.style.display = 'block';
        }
      }

      let parent = li.parentElement;
      while (parent && parent.id !== 'treeRoot') {
        if (parent.tagName === 'LI') parent.style.display = '';
        if (parent.tagName === 'DETAILS') parent.open = true;
        parent = parent.parentElement;
      }
    }
  });
});

window.addEventListener('beforeunload', function (e) {
  if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
});

initApp();
