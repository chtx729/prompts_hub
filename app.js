// 初始化Supabase客户端
const SUPABASE_URL = 'https://qnqzoxkejxshsxvmprhs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucXpveGtlanhzaHN4dm1wcmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ0NzMsImV4cCI6MjA2NDU4MDQ3M30.ZPBSdEAz-ncPOfAEwwYEJyd3cpF05U-hIQKyOZKCMaw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM 元素
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app');
const signOutBtn = document.getElementById('sign-out'); // 登录/注册界面的登出按钮
const signOutAppBtn = document.getElementById('sign-out-app'); // 应用界面的登出按钮
const todosList = document.getElementById('todos-list');
const todoForm = document.getElementById('todo-form');

// 文件存储相关的 DOM 元素
const storageSection = document.getElementById('storage-section');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadedFilesDiv = document.getElementById('uploaded-files');

// 检查当前用户
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('当前用户:', user);
    if (user) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        storageSection.classList.remove('hidden'); // 显示文件存储部分
        loadTodos();
        listFiles(); // 加载已上传文件列表
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        storageSection.classList.add('hidden'); // 隐藏文件存储部分
    }
}

// 加载待办事项
async function loadTodos() {
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        todosList.innerHTML = todos.map(todo => `
      <li>
        ${todo.task}
        <button onclick="deleteTodo(${todo.id})">删除</button>
      </li>
    `).join('');
    }
}

// 添加待办事项
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('task-input');
    const task = taskInput.value.trim();

    if (task) {
        // 获取当前登录用户的 ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('获取用户失败:', userError ? userError.message : '用户未登录');
            alert('请先登录才能添加待办事项！');
            return;
        }
        const userId = user.id;

        const { data, error } = await supabase.from('todos').insert([{ task, user_id: userId }]);
        if (error) {
            console.error('添加待办事项失败:', error.message);
            alert('添加待办事项失败: ' + error.message);
        } else {
            console.log('添加待办事项成功:', data);
            taskInput.value = '';
            loadTodos();
        }
    }
});

// 文件上传功能
uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert('请选择一个文件');
        return;
    }

    // 定义存储桶名称和文件路径
    const bucketName = 'uploads'; // 请确保在 Supabase 中创建了这个存储桶
    // 获取文件扩展名
    const fileExtension = file.name.split('.').pop();
    // 生成一个安全的文件路径，只包含时间戳和文件扩展名
    const filePath = `${Date.now()}.${fileExtension}`;

    // 上传文件
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

    if (error) {
        console.error('文件上传失败:', error.message);
        alert('文件上传失败: ' + error.message);
    } else {
        console.log('文件上传成功:', data);
        alert('文件上传成功！');
        fileInput.value = ''; // 清空文件输入框
        listFiles(); // 刷新文件列表
    }
});

// 列出已上传文件
async function listFiles() {
    const bucketName = 'uploads'; // 请确保在 Supabase 中创建了这个存储桶
    const { data, error } = await supabase.storage
        .from(bucketName)
        .list();

    if (error) {
        console.error('列出文件失败:', error.message);
        // alert('列出文件失败: ' + error.message);
        uploadedFilesDiv.innerHTML = '<p>无法加载文件列表。</p>';
    } else {
        console.log('已上传文件列表:', data);
        if (data.length === 0) {
            uploadedFilesDiv.innerHTML = '<p>暂无文件。</p>';
        } else {
            uploadedFilesDiv.innerHTML = '<h3>已上传文件:</h3><ul>' +
                data.map(file => `<li>${file.name}</li>`).join('') +
                '</ul>';
        }
    }
}

// 删除待办事项
window.deleteTodo = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) loadTodos();
};

// 注册
document.getElementById('sign-up').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        console.error('注册失败:', error.message);
        alert('注册失败: ' + error.message);
    } else {
        console.log('注册成功:', data);
        alert('注册成功！请检查邮箱验证');
    }
});

// 登录
document.getElementById('sign-in').addEventListener('click', async () => {
    console.log('登录按钮被点击！');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('邮箱:', email, '密码:', password);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert(error.message);
    } else {
        console.log('登录成功！');
        // 登录成功后才检查用户状态并切换界面
        checkUser();
    }
});

// 登出功能
async function handleSignOut() {
    await supabase.auth.signOut();
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    storageSection.classList.add('hidden'); // 登出后隐藏文件存储部分
}

// 登录/注册界面的登出按钮事件监听
signOutBtn.addEventListener('click', handleSignOut);

// 应用界面的登出按钮事件监听
signOutAppBtn.addEventListener('click', handleSignOut);

// 初始化页面：不再自动检查用户，等待用户手动登录

// 实时监听数据变化
supabase.channel('todos-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        loadTodos();
    })
    .subscribe();