import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonTextarea, IonButton, IonItem, IonLabel,
  IonText, IonSelect, IonSelectOption, IonList
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

const INCIDENT_TYPES = [
  'Phishing',
  'Malware',
  'Social Engineering',
  'Data Breach',
  'Online Scam',
  'Cyberbullying',
  'Facebook Hack',
  'Other'
];

type Report = {
  id: string;
  title: string;
  description: string;
  type: string;
  barangay: string;
  status: string;
  date_reported: string;
};

type Message = {
  id: string;
  report_id: string;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
};

const formatPHTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const ReportIncident: React.FC = () => {
  // Incident report form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | undefined>(undefined);
  const [barangay, setBarangay] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User's reports and selected report for chat
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Messages for selected report & new message input
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // To keep track of realtime subscription
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's reports on mount and after submit
  useEffect(() => {
    const fetchUserReports = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('You must be logged in to view reports.');
        return;
      }

      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date_reported', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setUserReports(data as Report[]);
      }
    };

    fetchUserReports();
  }, []);

  // Fetch messages when selectedReport changes and subscribe to realtime updates
  useEffect(() => {
    if (!selectedReport) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('report_id', selectedReport.id)
        .order('created_at', { ascending: true });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    // Remove old subscription if any
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Real-time subscription to new messages for this report
    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `report_id=eq.${selectedReport.id}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [selectedReport]);

  // Auto scroll chat to bottom on messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Submit new incident report
  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!title || !description || !type || !barangay) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg('You must be logged in to submit.');
      return;
    }

    const { error } = await supabase.from('incident_reports').insert([{
      user_id: user.id,
      title,
      description,
      type,
      barangay,
    }]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Incident reported successfully!');
      setTitle('');
      setDescription('');
      setType(undefined);
      setBarangay('');

      // Refresh user reports to show new report
      const { data } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date_reported', { ascending: false });
      setUserReports(data as Report[]);
    }
  };

  // Send new chat message (user to admin)
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedReport) return;

    const { data, error } = await supabase.from('messages').insert([
      {
        report_id: selectedReport.id,
        sender: 'user',
        message: newMessage.trim(),
      },
    ]).select().single();

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessages(prev => [...prev, data]);
    setNewMessage('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Report Incident</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Incident report form */}
        <IonItem>
          <IonLabel position="floating">Title</IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Description</IonLabel>
          <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={6} />
        </IonItem>
        <IonItem>
          <IonLabel>Type</IonLabel>
          <IonSelect
            value={type}
            placeholder="Select type"
            onIonChange={e => setType(e.detail.value)}
          >
            {INCIDENT_TYPES.map(t => (
              <IonSelectOption key={t} value={t}>{t}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Barangay</IonLabel>
          <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} />
        </IonItem>

        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
        {successMsg && <IonText color="success">{successMsg}</IonText>}

        <IonButton expand="block" onClick={handleSubmit} className="ion-margin-top">
          Submit
        </IonButton>

        {/* Divider */}
        <hr style={{ margin: '20px 0' }} />

        {/* User's Reports List */}
        <h2>Your Reports</h2>
        {userReports.length === 0 ? (
          <IonText>You have no reports yet.</IonText>
        ) : (
          <IonList>
            {userReports.map(report => (
              <IonItem
                button
                key={report.id}
                onClick={() => {
                  if (selectedReport?.id === report.id) {
                    setSelectedReport(null);  // Close chat if tapping the same report again
                  } else {
                    setSelectedReport(report); // Open chat for new report
                  }
                }}
                color={selectedReport?.id === report.id ? 'light' : undefined}
              >
                <IonLabel>
                  <h3>{report.title}</h3>
                  <p>Status: {report.status}</p>
                </IonLabel>
              </IonItem>

            ))}
          </IonList>
        )}

        {/* Chat messages for selected report */}
        {selectedReport && (
          <>
            <hr style={{ margin: '20px 0' }} />
            <h3>Chat for: {selectedReport.title}</h3>
            <p><strong>Status:</strong> {selectedReport.status}</p>

            <IonList style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <IonText>No messages yet.</IonText>
              ) : (
                messages.map((msg) => (
                  <IonItem
                    key={msg.id}
                    lines="none"
                    style={{ justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}
                  >
                    <IonLabel
                      style={{
                        textAlign: msg.sender === 'user' ? 'right' : 'left',
                        maxWidth: '75%',
                      }}
                    >
                      <p
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          display: 'inline-block',
                          wordBreak: 'break-word',
                          backgroundColor: 'transparent',
                          border: '1px solid #ccc',
                        }}
                      >
                        {msg.message}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {msg.sender === 'user' ? 'You' : 'admin'}
                        </span>{' '}
                        &middot; {formatPHTime(msg.created_at)}
                      </div>
                    </IonLabel>
                  </IonItem>
                ))
              )}
              <div ref={messagesEndRef} />
            </IonList>

            {/* Disable input and button if report is resolved */}
            {selectedReport.status.toLowerCase() === 'resolved' ? (
              <IonText color="medium" className="ion-padding-top">
                This report has been resolved. Messaging is disabled.
              </IonText>
            ) : (
              <>
                <IonTextarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onIonChange={e => setNewMessage(e.detail.value!)}
                  rows={3}
                  className="ion-margin-top"
                />

                <IonButton onClick={sendMessage} expand="block" disabled={!newMessage.trim()}>
                  Send Message
                </IonButton>
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReportIncident;
