require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// 配置Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

//const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 提供静态文件，包括 index.html



// 获取所有留言
app.get('/messages', async (req, res) => {
    const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, user_id, profiles(username)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase query error:', error.message, error.details, error.hint, error.code);
        return res.status(500).json({ error });
    }

    // 重构数据格式
    const messages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        username: msg.profiles.username,
        user_id: msg.user_id
    }));

    res.json(messages);
});

// 添加新留言
app.post('/messages', async (req, res) => {
    const { content, userId } = req.body;

    // 打印接收到的请求体和 userId，用于调试
    console.log('Received message content:', content);
    console.log('Received userId:', userId);

    const { error } = await supabase
        .from('messages')
        .insert([{
            user_id: userId,
            content: content
        }]);

    if (error) {
        console.error('Supabase query error:', error.message, error.details, error.hint, error.code);
        return res.status(500).json({ error });
    }
    res.json({ success: true });
});

// 删除留言
app.delete('/messages/:id', async (req, res) => {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        console.error('Supabase query error:', error.message, error.details, error.hint, error.code);
        return res.status(500).json({ error });
    }
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`服务器运行中: http://localhost:${PORT}`);
});