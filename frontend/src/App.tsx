import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Activity, ArrowUp, BarChart3,
  ChevronDown, ChevronsRight, Code2, File,
  FileText, Globe2, Menu, MessageSquare, Moon,
  MoreHorizontal, Paperclip, Pencil, Plus, Search, Send,
  Sparkles, Sun, Trash2, WandSparkles, X
} from 'lucide-react'
import { motion } from 'framer-motion'
import './App.css'

type Message = {
  id: number
  role: 'user' | 'assistant'
  text: string
  file?: string
}
type Conversation = {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}
const suggestions = [
  { icon: Code2, title: 'توسعه و برنامه‌نویسی', description: 'در نوشتن و بررسی کدها کمکت می‌کنم.', prompt: 'برای شروع یک پروژه React راهنمایی‌ام کن.' },
  { icon: FileText, title: 'نوشتن و تولید محتوا', description: 'ایده‌هایت را به محتوای حرفه‌ای تبدیل کن.', prompt: 'برای معرفی یک محصول متن حرفه‌ای بنویس.' },
  { icon: BarChart3, title: 'تحلیل داده', description: 'داده‌ها را بررسی و تحلیل کن.', prompt: 'روش تحلیل داده‌های فروش را توضیح بده.' },
  { icon: WandSparkles, title: 'ایده‌پردازی', description: 'ایده‌های تازه را کشف و توسعه بده.', prompt: 'چند ایده خلاقانه برای یک استارتاپ بده.' },
]

function App() {
  const [dark, setDark] = useState(true)
  const [english, setEnglish] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeChat, setActiveChat] = useState('گفت‌وگوی جدید')
  const [activeChatId, setActiveChatId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const t = (fa: string, en: string) => english ? en : fa

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vayra-conversations')
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed)
          setMessages(parsed[0].messages)
          setActiveChat(parsed[0].title)
          setActiveChatId(parsed[0].id)
        }
      }
    } catch {
      console.error('Could not load VAYRA conversation history.')
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || messages.length === 0 || !activeChatId) return

    const conversation: Conversation = {
      id: activeChatId,
      title: activeChat,
      messages,
      updatedAt: Date.now(),
    }

    setConversations(previous => {
      const updated = [
        conversation,
        ...previous.filter(item => item.id !== activeChatId),
      ].sort((a, b) => b.updatedAt - a.updatedAt)

      localStorage.setItem('vayra-conversations', JSON.stringify(updated))
      return updated
    })
  }, [messages, activeChat, activeChatId, hydrated])

  function newChat() {
    setMessages([])
    setInput('')
    setFile(null)
    setActiveChat(t('گفت‌وگوی جدید', 'New conversation'))
    setActiveChatId(String(Date.now()))
  }

  function openConversation(conversation: Conversation) {
    setMessages(conversation.messages)
    setActiveChat(conversation.title)
    setActiveChatId(conversation.id)
    setInput('')
    setFile(null)
  }

  function deleteConversation(id: string) {
    const confirmed = window.confirm(
      t('آیا از حذف این گفتگو مطمئنی؟', 'Are you sure you want to delete this conversation?')
    )

    if (!confirmed) return

    const updated = conversations.filter(item => item.id !== id)
    setConversations(updated)
    localStorage.setItem('vayra-conversations', JSON.stringify(updated))

    if (activeChatId === id) {
      setMessages([])
      setActiveChat(t('گفت‌وگوی جدید', 'New conversation'))
      setActiveChatId('')
      setInput('')
      setFile(null)
    }
  }
  function renameConversation(conversation: Conversation) {
    const newTitle = window.prompt(
      t('نام جدید گفتگو را وارد کن:', 'Enter a new conversation title:'),
      conversation.title
    )?.trim()

    if (!newTitle || newTitle === conversation.title) return

    const updated = conversations.map(item =>
      item.id === conversation.id
        ? { ...item, title: newTitle, updatedAt: Date.now() }
        : item
    ).sort((a, b) => b.updatedAt - a.updatedAt)

    setConversations(updated)
    localStorage.setItem('vayra-conversations', JSON.stringify(updated))

    if (activeChatId === conversation.id) {
      setActiveChat(newTitle)
    }
  }

  function deleteAllConversations() {
    if (conversations.length === 0) return

    const firstConfirm = window.confirm(
      t(
        'آیا مطمئنی می‌خواهی تمام گفتگوها را حذف کنی؟',
        'Are you sure you want to delete all conversations?'
      )
    )

    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      t(
        'این عملیات قابل بازگشت نیست. تمام تاریخچه حذف شود؟',
        'This action cannot be undone. Delete the entire history?'
      )
    )

    if (!secondConfirm) return

    setConversations([])
    setMessages([])
    setActiveChat(t('گفت‌وگوی جدید', 'New conversation'))
    setActiveChatId('')
    setInput('')
    setFile(null)

    localStorage.removeItem('vayra-conversations')
  }
  function sendMessage(event?: FormEvent) {
    event?.preventDefault()
    if (!input.trim() && !file) return

    const text = input.trim() || t('لطفاً این فایل را بررسی کن.', 'Please review this file.')
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      text,
      file: file?.name,
    }

    if (!activeChatId) setActiveChatId(String(Date.now()))
    setMessages(previous => [...previous, userMessage])
    setActiveChat(text.slice(0, 28))
    setInput('')
    setFile(null)

    window.setTimeout(() => {
      setMessages(previous => [...previous, {
        id: Date.now() + 1,
        role: 'assistant',
        text: t(
          'پیامت دریافت شد! این یک پاسخ آزمایشی از رابط VAYRA AI است. پس از اتصال بک‌اند، پاسخ‌های واقعی هوش مصنوعی در این قسمت نمایش داده می‌شوند.',
          'Your message has been received! This is a demo response from the VAYRA AI interface. Real AI responses will appear here after backend integration.'
        ),
      }])
    }, 650)
  }
  return (
    <div className={`app-shell ${dark ? 'dark' : 'light'}`} dir={english ? 'ltr' : 'rtl'}>
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark"><img src="/assets/vayra-mark.jpg" alt="VAYRA" /></div>
            <div className="brand-name">
              <strong>VAYRA</strong>
              <span>INTELLIGENCE</span>
            </div>
            <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <ChevronsRight size={18} />
            </button>
          </div>

          <button className="new-chat-button" onClick={newChat}>
            <Plus size={18} />
            <span>{t('گفت‌وگوی جدید', 'New chat')}</span>
            <span className="shortcut">⌘ K</span>
          </button>

          <div className="sidebar-search">
            <Search size={16} />
            <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={t('جست‌وجوی گفتگوها...','Search chats...')} />
          </div>

          <div className="sidebar-section">
            <span className="section-label">{t('فضای کاری', 'WORKSPACE')}</span>
            <button className="nav-item active"><MessageSquare size={17} /><span>{t('گفت‌وگوها', 'Conversations')}</span></button>
            <button className="nav-item"><BarChart3 size={17} /><span>{t('تحلیل‌ها', 'Analytics')}</span></button>
            <button className="nav-item"><FileText size={17} /><span>{t('فایل‌های من', 'My files')}</span></button>
          </div>

          <div className="sidebar-section recent-section">
            <div className="history-heading">
              <span className="section-label">{t('اخیر', 'RECENT')}</span>
              {conversations.length > 0 && (
                <button
                  type="button"
                  className="history-clear-all"
                  onClick={deleteAllConversations}
                >
                  {t('حذف همه', 'Clear all')}
                </button>
              )}
            </div>
            {conversations.filter(conversation =>
              conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              conversations
                .filter(conversation =>
                  conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(conversation => (
                  <div key={conversation.id} className="history-item">
                    <button
                      className={`nav-item recent-chat ${activeChatId === conversation.id ? 'active' : ''}`}
                      onClick={() => openConversation(conversation)}
                    >
                      <MessageSquare size={16} />
                      <span>{conversation.title}</span>
                    </button>
                    <button
                      type="button"
                      className="history-rename"
                      onClick={() => renameConversation(conversation)}
                      aria-label={t('تغییر نام گفتگو', 'Rename conversation')}
                      title={t('تغییر نام گفتگو', 'Rename conversation')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="history-delete"
                      onClick={() => deleteConversation(conversation.id)}
                      aria-label={t('حذف گفتگو', 'Delete conversation')}
                      title={t('حذف گفتگو', 'Delete conversation')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
            ) : (
              <p className="empty-history">
                {t('گفت‌وگویی پیدا نشد.', 'No conversations found.')}
              </p>
            )}
          </div>

          <div className="sidebar-bottom">
            <div className="plan-card">
              <div className="plan-icon"><Sparkles size={17} /></div>
              <div><strong>{t('VAYRA Pro', 'VAYRA Pro')}</strong><span>{t('فضای هوشمند شما', 'Your AI workspace')}</span></div>
              <ChevronDown size={15} />
            </div>
            <button className="profile-button">
              <div className="avatar">V</div>
              <div className="profile-info"><strong>{t('کاربر VAYRA', 'VAYRA User')}</strong><span>{t('حساب شخصی', 'Personal account')}</span></div>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </aside>
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>}
            <div className="breadcrumb">{t('فضای کاری', 'Workspace')} <span>/</span> <strong>{activeChat}</strong></div>
          </div>
          <div className="topbar-actions">
            <button className="top-action" onClick={() => setEnglish(!english)}><Globe2 size={16} /><span>{english ? 'EN' : 'FA'}</span></button>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="upgrade-button"><Sparkles size={15} /> {t('ارتقا حساب', 'Upgrade')}</button>
          </div>
        </header>

        <section className="chat-area">
          {messages.length === 0 ? (
            <motion.div className="welcome-screen" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="welcome-brand-banner">
                <img src="/assets/vayra-banner.png" alt="VAYRA - Learn, Build, Grow" />
              </div>
              <div className="welcome-orb">
                <div className="orb-inner">
                  <img src="/assets/vayra-mark.jpg" alt="VAYRA AI" />
                </div>
                <span className="orb-ring ring-one" /><span className="orb-ring ring-two" />
              </div>
              <div className="eyebrow"><span className="status-dot" /> {t('نسل جدید هوش مصنوعی', 'NEXT GENERATION INTELLIGENCE')}</div>
              <h1>{t('سلام، چطور می‌تونم', 'Hello, how can I')}<br /><span>{t('بهت کمک کنم؟', 'help you today?')}</span></h1>
              <p className="welcome-description">{t('ایده‌هایت را مطرح کن، سؤال بپرس و با قدرت هوش مصنوعی VAYRA خلق کن.', 'Ask questions, explore ideas and create with the power of VAYRA AI.')}</p>

              <div className="suggestion-grid">
                {suggestions.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.button key={item.title} className="suggestion-card" onClick={() => setInput(t(item.prompt, ['Help me start a React project.', 'Write professional product introduction copy.', 'Explain how to analyze sales data.', 'Give me creative startup ideas.'][index]))} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                      <div className="suggestion-icon"><Icon size={19} /></div>
                      <strong>{t(item.title, ['Development & coding', 'Writing & content', 'Data analysis', 'Creative thinking'][index])}</strong>
                      <span>{t(item.description, ['Build and review your code.', 'Turn ideas into polished content.', 'Explore and understand your data.', 'Discover and develop new ideas.'][index])}</span>
                      <ArrowUp className="suggestion-arrow" size={16} />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <div className="messages-list">
              {messages.map(message => (
                <motion.div key={message.id} className={`message-row ${message.role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`message-avatar ${message.role}`}>
                    {message.role === 'assistant' ? <Sparkles size={17} /> : 'V'}
                  </div>
                  <div className="message-content">
                    <span className="message-author">{message.role === 'assistant' ? 'VAYRA AI' : t('شما', 'You')}</span>
                    <p>{message.text}</p>
                    {message.file && <div className="attached-file"><File size={16} />{message.file}</div>}
                  </div>
                </motion.div>
              ))}
              <div className="demo-note"><Activity size={14} /> {t('نسخه نمایشی رابط کاربری', 'UI demo version')}</div>
            </div>
          )}
        </section>

        <footer className="composer-section">
          <form className="composer" onSubmit={sendMessage}>
            {file && <div className="file-preview"><FileText size={15} /><span>{file.name}</span><button type="button" onClick={() => setFile(null)}><X size={14} /></button></div>}
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={t('هر چیزی که در ذهنته از VAYRA بپرس...', 'Ask VAYRA anything...')}
              rows={2}
            />
            <div className="composer-toolbar">
              <div className="composer-tools">
                <input ref={fileRef} type="file" hidden onChange={event => setFile(event.target.files?.[0] ?? null)} />
                <button type="button" className="tool-button" onClick={() => fileRef.current?.click()}><Paperclip size={17} /><span>{t('پیوست فایل', 'Attach file')}</span></button>
                <button type="button" className="tool-button" onClick={() => setInput(t('یک نمودار از داده‌های زیر بساز: ', 'Create a chart from this data: '))}><BarChart3 size={17} /><span>{t('نمودار', 'Chart')}</span></button>
              </div>
              <button type="submit" className="send-button" disabled={!input.trim() && !file}><Send size={17} /></button>
            </div>
          </form>
          <p className="disclaimer">{t('VAYRA ممکن است اشتباه کند. پاسخ‌های مهم را بررسی کنید.', 'VAYRA can make mistakes. Verify important information.')}</p>
        </footer>
      </main>
    </div>
  )
}

export default App








