import { createApp } from 'vue';
import ChatJump from './ChatJump.vue';
import './style.less';

const mount = () => {
  const root = document.createElement('div');
  root.id = 'chat-jump-root';
  if (document.body) {
    document.body.appendChild(root);
    const app = createApp(ChatJump);
    app.mount(root);
  } else {
    setTimeout(mount, 100);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}