import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonTextarea, IonButton, IonItem, IonLabel,
  IonText, IonSelect, IonSelectOption, IonList, IonIcon
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { addCircleOutline } from 'ionicons/icons';

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
  is_image?: boolean;
  image_url?: string;
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | undefined>(undefined);
  const [barangay, setBarangay] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (error) setErrorMsg(error.message);
      else setUserReports(data as Report[]);
    };

    fetchUserReports();
  }, []);

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

      if (error) setErrorMsg(error.message);
      else setMessages(data as Message[]);
    };

    fetchMessages();

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    if (error) setErrorMsg(error.message);
    else {
      setSuccessMsg('Incident reported successfully!');
      setTitle('');
      setDescription('');
      setType(undefined);
      setBarangay('');

      const { data } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date_reported', { ascending: false });

      setUserReports(data as Report[]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedReport) return;

    const { data, error } = await supabase.from('messages').insert([
      {
        report_id: selectedReport.id,
        sender: 'user',
        message: newMessage.trim(),
        is_image: false,
      },
    ]).select().single();

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessages(prev => [...prev, data]);
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !selectedReport) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedReport.id}_${Date.now()}.${fileExt}`;
    const filePath = `${selectedReport.id}/${fileName}`;

    const uploadResponse = await supabase.storage
      .from('chat-images')
      .upload(filePath, file);

    if (uploadResponse.error) {
      setErrorMsg('Image upload failed: ' + uploadResponse.error.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      setErrorMsg('Failed to get image URL');
      return;
    }

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          report_id: selectedReport.id,
          sender: 'user',
          message: '',
          is_image: true,
          image_url: publicUrl,
        },
      ])
      .select()
      .single();

    if (messageError) {
      setErrorMsg('Failed to insert message: ' + messageError.message);
      return;
    }

    setMessages(prev => [...prev, messageData]);
    e.target.value = '';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Report Incident</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem><IonLabel position="floating">Title</IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} /></IonItem>
        <IonItem><IonLabel position="floating">Description</IonLabel>
          <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={6} /></IonItem>
        <IonItem><IonLabel>Type</IonLabel>
          <IonSelect value={type} placeholder="Select type" onIonChange={e => setType(e.detail.value)}>
            {INCIDENT_TYPES.map(t => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
          </IonSelect></IonItem>
        <IonItem><IonLabel position="floating">Barangay</IonLabel>
          <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} /></IonItem>

        {errorMsg && <IonText color="danger"><p>{errorMsg}</p></IonText>}
        {successMsg && <IonText color="success"><p>{successMsg}</p></IonText>}

        <IonButton expand="block" onClick={handleSubmit} className="ion-margin-top">Submit</IonButton>

        <hr style={{ margin: '20px 0' }} />
        <h2>Your Reports</h2>
        {userReports.length === 0 ? (
          <IonText>You have no reports yet.</IonText>
        ) : (
          <IonList>
            {userReports.map(report => (
              <IonItem
                button key={report.id}
                onClick={() => setSelectedReport(prev => prev?.id === report.id ? null : report)}
                color={selectedReport?.id === report.id ? 'light' : undefined}
              >
                <IonLabel><h3>{report.title}</h3><p>Status: {report.status}</p></IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        {selectedReport && (
          <>
            <hr style={{ margin: '20px 0' }} />
            <h3>Chat for: {selectedReport.title}</h3>
            <p><strong>Status:</strong> {selectedReport.status}</p>

            <IonList style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <IonText>No messages yet.</IonText>
              ) : (
                messages.map(msg => (
                  <IonItem key={msg.id} lines="none"
                    style={{ justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                    <IonLabel style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                      {msg.is_image && msg.image_url ? (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={msg.image_url}
                                  alt="image"
                                  style={{ maxWidth: '200px', borderRadius: '10px', cursor: 'pointer' }}
                                />
                              </a>
                            ) : (
                              <p style={{
                                padding: '8px',
                                borderRadius: '10px',
                                display: 'inline-block',
                                wordBreak: 'break-word',
                                backgroundColor: 'transparent',
                                border: '1px solid #ccc'
                              }}>{msg.message}</p>
                            )}

                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                        <b>{msg.sender === 'user' ? 'You' : 'admin'}</b> · {formatPHTime(msg.created_at)}
                      </div>
                    </IonLabel>
                  </IonItem>
                ))
              )}
              <div ref={messagesEndRef} />
            </IonList>

            {selectedReport.status.toLowerCase() === 'resolved' ? (
              <IonText color="medium" className="ion-padding-top">
                This report has been resolved. Messaging is disabled.
              </IonText>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                  <IonButton
                    fill="clear"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ minWidth: '40px', height: '40px', padding: '0', marginRight: '8px' }}
                  >
                    <IonIcon icon={addCircleOutline} style={{ fontSize: '28px', color: '#3880ff' }} />
                  </IonButton>
                  <IonTextarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onIonChange={e => setNewMessage(e.detail.value!)}
                    rows={2}
                    style={{ flex: 1, resize: 'none' }}
                  />
                  <IonButton onClick={sendMessage} style={{ marginLeft: '8px' }}>Send</IonButton>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReportIncident;
