import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Mock types since we removed Prisma
interface User { id: string; email: string; name: string; avatar: string; }
interface Group { id: string; name: string; isPrivate: boolean; icon: string; }
interface GroupMember { id: string; userId: string; groupId: string; }
interface Message { id: string; content: string; senderId: string; groupId: string; type: string; timestamp: Date; }
interface Post { id: string; authorId: string; groupId: string; content: string; createdAt: Date; }

// In-memory DB
const db = {
  users: [] as User[],
  groups: [] as Group[],
  groupMembers: [] as GroupMember[],
  messages: [] as Message[],
  posts: [] as Post[]
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json() as any);

// Helpers
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Auth ---
app.post('/api/login', async (req, res) => {
  const { email, name } = req.body;
  let user = db.users.find(u => u.email === email);
  if (!user) {
    user = { 
      id: generateId(), 
      email, 
      name, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` 
    };
    db.users.push(user);
    
    // Add to default group
    const defaultGroup = db.groups.find(g => g.name === 'General');
    if (defaultGroup) {
      db.groupMembers.push({ id: generateId(), userId: user.id, groupId: defaultGroup.id });
    }
  }
  res.json(user);
});

// --- Groups ---
app.get('/api/groups', async (req, res) => {
  // Join logic
  const formatted = db.groups.map(g => {
    const memberIds = db.groupMembers.filter(gm => gm.groupId === g.id).map(gm => gm.userId);
    const members = db.users.filter(u => memberIds.includes(u.id));
    return { ...g, members };
  });
  
  res.json(formatted);
});

app.post('/api/groups', async (req, res) => {
  const { name, isPrivate } = req.body;
  const group = {
    id: generateId(),
    name, 
    isPrivate, 
    icon: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}` 
  };
  db.groups.push(group);
  res.json(group);
});

// --- Messages ---
app.get('/api/groups/:groupId/messages', async (req, res) => {
  const msgs = db.messages
    .filter(m => m.groupId === req.params.groupId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(0, 100);
    
  const withSender = msgs.map(m => ({
    ...m,
    sender: db.users.find(u => u.id === m.senderId)
  }));
  
  res.json(withSender);
});

app.post('/api/messages', async (req, res) => {
  const { content, senderId, groupId, type } = req.body;
  const message = {
    id: generateId(),
    content, 
    senderId, 
    groupId, 
    type,
    timestamp: new Date()
  };
  db.messages.push(message);
  
  const fullMessage = {
    ...message,
    sender: db.users.find(u => u.id === senderId)
  };
  
  io.to(groupId).emit('new_message', fullMessage);
  res.json(fullMessage);
});

// --- Feed ---
app.get('/api/groups/:groupId/posts', async (req, res) => {
  const posts = db.posts
    .filter(p => p.groupId === req.params.groupId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const withAuthor = posts.map(p => ({
    ...p,
    author: db.users.find(u => u.id === p.authorId)
  }));
  
  res.json(withAuthor);
});

// --- Leaderboard Calculation ---
app.get('/api/groups/:groupId/leaderboard', async (req, res) => {
  const { groupId } = req.params;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Helper to calculate stats
  const calculateStats = async (fromDate: Date) => {
    const messages = db.messages.filter(m => m.groupId === groupId && m.timestamp >= fromDate);
    
    // Aggregations
    const userStats: Record<string, any> = {};
    const wordCounts: Record<string, number> = {};
    let totalMessages = messages.length;

    messages.forEach(msg => {
      // User Score
      if (!userStats[msg.senderId]) {
        userStats[msg.senderId] = { messageCount: 0, score: 0, reactionsGiven: 0, voiceMinutes: 0 };
      }
      userStats[msg.senderId].messageCount++;
      userStats[msg.senderId].score += 10; // 10 pts per message

      // Word Frequency
      const words = msg.content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });

    // Determine most used word
    const mostUsedWord = Object.entries(wordCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Format Entries
    const entries = Object.entries(userStats).map(([userId, stats]) => ({
      userId,
      ...stats,
      // Randomize missing fields for demo
      voiceMinutes: Math.floor(Math.random() * 100),
      reactionsGiven: Math.floor(Math.random() * 50)
    }));

    return {
      entries,
      stats: {
        mostUsedWord,
        topGenre: ['Lo-Fi', 'Pop', 'Rock', 'Jazz'][Math.floor(Math.random() * 4)],
        totalFeedPosts: db.posts.filter(p => p.groupId === groupId).length, 
        totalMessages
      }
    };
  };

  const monthly = await calculateStats(firstOfMonth);
  const annual = await calculateStats(new Date(0)); // All time

  res.json({ monthly, annual });
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });
});

// --- Init Data ---
const init = async () => {
  if (db.groups.length === 0) {
    db.groups.push({ 
        id: generateId(), 
        name: 'General', 
        isPrivate: false, 
        icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=General' 
    });
    db.groups.push({ 
        id: generateId(), 
        name: 'Random', 
        isPrivate: false, 
        icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=Random' 
    });
  }
};
init();

httpServer.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});