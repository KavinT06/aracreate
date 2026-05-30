import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { useMessageStore } from '../store/useMessageStore.js';
import { connectSocket, disconnectSocket, bindSocketEvents, getSocket } from '../socket/socketClient.js';
import { ScrollArea } from '../components/ui/scroll-area.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { formatDate } from '../utils/formatDate.js';

const ChatPage = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { rooms, loadRooms, activeRoom, setActiveRoom, createRoom } = useRoomStore((s) => ({
    rooms: s.rooms,
    loadRooms: s.loadRooms,
    activeRoom: s.activeRoom,
    setActiveRoom: s.setActiveRoom,
    createRoom: s.createRoom,
  }));

  const joinRoomById = useRoomStore((s) => s.joinRoomById);

  const { messages, loadMessages, appendMessage } = useMessageStore((s) => ({
    messages: s.messages,
    loadMessages: s.loadMessages,
    appendMessage: s.appendMessage,
  }));

  const [content, setContent] = useState('');
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const bottomRef = useAutoScroll(messages);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    bindSocketEvents(socket);

    return () => disconnectSocket();
  }, [token]);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!activeRoom) {
      return undefined;
    }

    joinRoomById(activeRoom._id);
    loadMessages(activeRoom._id);
    socket?.emit('join_room', activeRoom._id);

    return () => {
      socket?.emit('leave_room', activeRoom._id);
    };
  }, [activeRoom, joinRoomById, loadMessages]);

  const handleCreateRoom = async () => {
    const createdRoom = await createRoom({
      name: roomName,
      description: roomDescription,
    });

    if (!createdRoom) return;

    setRoomName('');
    setRoomDescription('');
    setShowCreateRoomForm(false);
    setActiveRoom(createdRoom);
    loadRooms();
  };

  const handleSend = () => {
    if (!content.trim() || !activeRoom) return;
    const socket = getSocket();
    socket?.emit('send_message', { roomId: activeRoom._id, content: content.trim() });
    setContent('');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-72 h-screen flex flex-col border-r border-border bg-card p-3">
        <div className="p-2 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">ChatApp</h1>
          {user && <p className="text-sm text-muted-foreground">{user.username}</p>}
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          {rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rooms yet</div>
          ) : (
            rooms.map((room) => (
              <button
                key={room._id}
                onClick={() => setActiveRoom(room)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                  activeRoom?._id === room._id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <p className="text-sm font-medium truncate"># {room.name}</p>
                {room.description && <p className="text-xs text-muted-foreground truncate">{room.description}</p>}
              </button>
            ))
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border">
          {showCreateRoomForm ? (
            <div className="space-y-3">
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="bg-muted border-0 focus-visible:ring-1"
              />
              <Input
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Description (optional)"
                className="bg-muted border-0 focus-visible:ring-1"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateRoom} size="sm" disabled={!roomName.trim()} className="flex-1">Save</Button>
                <Button
                  onClick={() => {
                    setShowCreateRoomForm(false);
                    setRoomName('');
                    setRoomDescription('');
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateRoomForm(true)} size="sm">Create Room</Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen">
        <div className="shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{activeRoom ? activeRoom.name : 'Select a room'}</h2>
            {activeRoom && <p className="text-sm text-muted-foreground">{activeRoom.description}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">No messages yet</div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMine = user && msg.sender._id === user._id;

                return (
                  <div key={msg._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">{msg.sender.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-muted-foreground">{msg.sender.username}</span>
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-border bg-background">
          <div className="flex gap-3 items-center">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-muted border-0 focus-visible:ring-1"
            />
            <Button onClick={handleSend} disabled={!content.trim()} size="sm">Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
