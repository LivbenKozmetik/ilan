import { i18n } from '../i18n.js';
export function renderFooter(root){
  root.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'site-footer-inner site-shell';
  inner.innerHTML = `
    <div class="small muted">${i18n.t('footer.note')}</div>
    <div class="small muted">© ${new Date().getFullYear()} İlanPortal</div>
  `;
  root.appendChild(inner);
}