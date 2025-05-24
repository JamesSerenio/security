import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
} from '@ionic/react';

type Message = {
  id: string;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
};

const ChatPage: React.FC = () => {
  // Simulate logged in user role (true = admin, false = user)
  const [currentUserIsAdmin] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'user',
      message: 'Hello, I need help with my report.',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '2',
      sender: 'admin',
      message: 'Sure! What seems to be the problem?',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: (messages.length + 1).toString(),
      sender: currentUserIsAdmin ? 'admin' : 'user',
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chat</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {messages.map((msg) => {
            const isCurrentUser = currentUserIsAdmin ? msg.sender === 'admin' : msg.sender === 'user';
            const senderName = isCurrentUser ? 'You' : msg.sender === 'admin' ? 'Admin' : 'User';

            return (
              <IonItem
                key={msg.id}
                lines="none"
                style={{
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                }}
              >
                <IonLabel
                  style={{
                    backgroundColor: isCurrentUser ? '#3880ff' : '#dcdcdc',
                    color: isCurrentUser ? 'white' : 'black',
                    borderRadius: '12px',
                    padding: '10px',
                    maxWidth: '70%',
                    textAlign: 'left',
                  }}
                >
                  <strong>{senderName}</strong>
                  <p style={{ margin: '0.3em 0' }}>{msg.message}</p>
                  <small style={{ fontSize: '0.7em', opacity: 0.7 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </IonLabel>
              </IonItem>
            );
          })}
        </div>

        <IonItem>
          <IonTextarea
            value={newMessage}
            placeholder="Type your message..."
            onIonChange={(e) => setNewMessage(e.detail.value!)}
            autoGrow
            rows={2}
          />
        </IonItem>

        <IonButton expand="block" onClick={handleSend} disabled={!newMessage.trim()}>
          Send
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ChatPage;
