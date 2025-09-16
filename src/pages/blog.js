import { t } from '../i18n.js';
export async function blogPage(container){
  container.innerHTML = '';
  const left = document.createElement('aside');
  left.className = 'card';
  left.innerHTML = `<h3>${t('blog.title')}</h3><p class="muted">${t('blog.hint')}</p>`;

  const main = document.createElement('section');
  main.innerHTML = `<div class="card"><h2>${t('blog.header')}</h2></div>
    <div style="margin-top:12px" id="blog-grid" class="grid"></div>`;

  container.appendChild(left);
  container.appendChild(main);

  const grid = main.querySelector('#blog-grid');
  for(let i=1;i<=6;i++){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h4>${t('blog.post')} ${i}</h4><p class="muted">${t('blog.excerpt')}</p>`;
    grid.appendChild(card);
  }
}