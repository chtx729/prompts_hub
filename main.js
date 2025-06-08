// 初始化Supabase客户端
const SUPABASE_URL = 'https://qnqzoxkejxshsxvmprhs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucXpveGtlanhzaHN4dm1wcmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ0NzMsImV4cCI6MjA2NDU4MDQ3M30.ZPBSdEAz-ncPOfAEwwYEJyd3cpF05U-hIQKyOZKCMaw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM元素
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const messageForm = document.getElementById('message-form');
const messagesList = document.getElementById('messages-list');
const usernameSpan = document.getElementById('username');
const userEmailSpan = document.getElementById('user-email');
const contentInput = document.getElementById('content');

// 检查登录状态
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // 用户已登录
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        messageForm.classList.remove('hidden');

        // 显示用户信息
        usernameSpan.textContent = user.email.split('@')[0];
        userEmailSpan.textContent = user.email;
    } else {
        // 用户未登录
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        messageForm.classList.add('hidden');
    }
    // 无论是否登录，都加载留言
    loadMessages();
}

// 登录功能
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert('登录失败: ' + error.message);
    } else {
        await checkAuth();
        alert('登录成功！');
    }
});

// 注册功能
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        alert('注册失败: ' + error.message);
    } else {
        alert('注册成功！请检查你的邮箱进行验证');
    }
});

// 退出登录
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkAuth();
    messagesList.innerHTML = '';
});

// 加载所有留言
async function loadMessages() {
    try {
        // 前端直接从 Supabase 查询留言，联表 profiles 获取 username
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, created_at, user_id, profiles(username)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('加载留言失败:', error);
            messagesList.innerHTML = `<p class="error">加载留言失败，请稍后重试</p>`;
            return;
        }

        messagesList.innerHTML = '';

        data.forEach(msg => {
            const formattedDate = new Date(msg.created_at).toLocaleString();
            const isCurrentUser = supabase.auth.currentUser?.id === msg.user_id;

            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.innerHTML = `
        <div class="message-header">
          <div class="message-author">${msg.profiles?.username || '未知用户'}</div>
          <div class="message-time">${formattedDate}</div>
        </div>
        <div class="message-content">${msg.content}</div>
        ${isCurrentUser ? `<button class="delete-btn" data-id="${msg.id}">删除留言</button>` : ''}
      `;

            messagesList.appendChild(messageEl);
        });

        // 添加删除按钮事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const messageId = e.target.dataset.id;
                await deleteMessage(messageId);
            });
        });

    } catch (error) {
        console.error('加载留言失败:', error);
        messagesList.innerHTML = `<p class="error">加载留言失败，请稍后重试</p>`;
    }
}

// 发布新留言
document.getElementById('post-btn').addEventListener('click', async () => {
    const content = contentInput.value.trim();
    if (!content) return alert('请输入留言内容');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert('获取用户信息失败，请尝试重新登录。');
        console.error('获取用户信息失败:', userError);
        return;
    }
    const userId = user.id;

    try {
        // 前端直接插入留言到 Supabase
        const { error } = await supabase
            .from('messages')
            .insert([{ content, user_id: userId }]);

        if (error) {
            console.error('发布留言失败:', error);
            alert('留言发布失败: ' + error.message);
            return;
        }

        contentInput.value = '';
        loadMessages();
    } catch (error) {
        console.error('发布留言失败:', error);
        alert('留言发布失败，请稍后重试');
    }
});

// 删除留言
async function deleteMessage(messageId) {
    try {
        await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        loadMessages();
    } catch (error) {
        console.error('删除留言失败:', error);
        alert('删除失败，请稍后重试');
    }
}

// 初始化检查登录状态
window.addEventListener('DOMContentLoaded', checkAuth); 