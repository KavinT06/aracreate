# UI / UX Rules

## Layout Philosophy

- Desktop UI only. No mobile responsiveness required.
- The application uses a **two-panel layout**: a fixed sidebar on the left, and a full-height chat panel on the right.
- The entire viewport is used. No page scroll — scrolling happens inside the message list only.
- Clean, modern aesthetic. No heavy shadows, no gradients unless intentional, no decorative clutter.

---

## Top-Level Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  Sidebar (w-72, fixed)      │  Chat Panel (flex-1)       │
│                             │                             │
│  [App Logo / Title]         │  [Room Header]             │
│                             │  ─────────────────────────  │
│  [Room List]                │  [Message List]            │
│    - RoomItem               │    - MessageBubble         │
│    - RoomItem               │    - MessageBubble         │
│    - ...                    │    - ...                   │
│                             │  ─────────────────────────  │
│  [Create Room Button]       │  [Message Input]           │
│                             │                             │
└──────────────────────────────────────────────────────────┘
```

### Implementation
```jsx
// pages/ChatPage.jsx
const ChatPage = () => (
  <div className="flex h-screen bg-background text-foreground overflow-hidden">
    <Sidebar />
    <ChatPanel />
  </div>
);
```

---

## Sidebar

- Fixed width: `w-72`
- Full height: `h-screen`
- Background: `bg-card` or `bg-muted/40`
- Separated from chat panel with a right border: `border-r border-border`
- Contains: app header, room list (scrollable), create room button (pinned to bottom)

```jsx
// components/rooms/Sidebar.jsx
const Sidebar = () => {
  const { rooms, fetchRooms, setActiveRoom, activeRoom, isLoading } = useRoomStore();

  useEffect(() => { fetchRooms(); }, []);

  return (
    <aside className="w-72 h-screen flex flex-col border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">ChatApp</h1>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <Spinner />
        ) : rooms.length === 0 ? (
          <EmptyState icon="💬" title="No rooms yet" description="Create one to get started" />
        ) : (
          rooms.map((room) => (
            <RoomItem
              key={room._id}
              room={room}
              isActive={activeRoom?._id === room._id}
              onClick={() => setActiveRoom(room)}
            />
          ))
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <CreateRoomButton />
      </div>
    </aside>
  );
};
```

---

## Room Item

- Rounded: `rounded-lg`
- Padding: `px-3 py-2`
- Active state: `bg-primary/10 text-primary font-medium`
- Hover state: `hover:bg-muted/60`
- Transition: `transition-colors duration-150`

```jsx
// components/rooms/RoomItem.jsx
const RoomItem = ({ room, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150',
      isActive
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    )}
  >
    <p className="text-sm font-medium truncate"># {room.name}</p>
    {room.description && (
      <p className="text-xs text-muted-foreground truncate">{room.description}</p>
    )}
  </button>
);
```

---

## Chat Panel

- Takes the remaining width: `flex-1`
- Three vertical sections: header (`shrink-0`), message list (`flex-1 overflow-y-auto`), input (`shrink-0`)

```jsx
// components/chat/ChatPanel.jsx
const ChatPanel = () => {
  const activeRoom = useRoomStore((state) => state.activeRoom);

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon="👈" title="Select a room" description="Choose a room from the sidebar to start chatting" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <ChatHeader room={activeRoom} />
      <MessageList />
      <MessageInput roomId={activeRoom._id} />
    </div>
  );
};
```

---

## Message List

- Scrollable: `overflow-y-auto`
- Fills available space: `flex-1`
- Padding: `px-6 py-4`
- Gap between messages: `space-y-3`

```jsx
// components/chat/MessageList.jsx
const MessageList = () => {
  const { messages, isLoading } = useMessageStore();
  const bottomRef = useAutoScroll(messages);

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.length === 0 ? (
        <EmptyState icon="👋" title="No messages yet" description="Be the first to say something!" />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
```

---

## Message Bubble

```jsx
// components/chat/MessageBubble.jsx
import useAuthStore from '../../store/useAuthStore.js';
import { formatDate } from '../../utils/formatDate.js';

const MessageBubble = ({ message }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isMine = message.sender._id === currentUser.id;

  return (
    <div className={cn('flex gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {message.sender.username[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex flex-col gap-1 max-w-[65%]', isMine ? 'items-end' : 'items-start')}>
        <span className="text-xs text-muted-foreground">{message.sender.username}</span>
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed',
          isMine
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}>
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(message.createdAt)}</span>
      </div>
    </div>
  );
};
```

---

## Message Input

- Pinned to bottom: `shrink-0`
- Contains a text input and send button
- Send on Enter (not Shift+Enter)
- Disable send button when input is empty or trimmed content is empty

```jsx
// components/chat/MessageInput.jsx
const MessageInput = ({ roomId }) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(roomId, content.trim());
    setContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 px-6 py-4 border-t border-border bg-background">
      <div className="flex gap-3 items-center">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-muted border-0 focus-visible:ring-1"
        />
        <Button onClick={handleSend} disabled={!content.trim()} size="sm">
          Send
        </Button>
      </div>
    </div>
  );
};
```

---

## Loading Spinner Patterns

- Full-area spinner: centered with `flex items-center justify-center h-full`
- Inline small spinner: `h-4 w-4` next to a button label
- Never block the entire page with a spinner — confine it to the loading area

---

## Form Styling (Auth Pages)

- Centered card layout: `min-h-screen flex items-center justify-center bg-muted/30`
- Card: `bg-card rounded-xl shadow-sm border border-border p-8 w-full max-w-md`
- Input spacing: `space-y-4`
- Error text: `text-sm text-destructive mt-1`
- Button: full width `w-full`

---

## Consistent Spacing

| Context | Value |
|---|---|
| Page padding | `px-6 py-4` |
| Card padding | `p-6` to `p-8` |
| Between list items | `space-y-2` or `space-y-3` |
| Icon + label gap | `gap-2` |
| Section separation | `gap-4` to `gap-6` |

---

## Design Principles Summary

1. Use shadcn/ui color tokens — never hard-code hex values.
2. Keep the interface calm and neutral — primary color for actions only.
3. Always show state: loading, empty, or content. Never a blank area.
4. Rounded corners on cards and bubbles (`rounded-lg`, `rounded-2xl`).
5. Subtle borders for separation — not heavy dividers.
6. Typography hierarchy: heading → body → caption. Avoid more than 3 text sizes per view.