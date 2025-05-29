import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonButton,
  IonTextarea,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonMenu,
  IonMenuButton,
  IonSplitPane,

} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { closeOutline, addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

type IncidentReport = {
  id: number;
  title: string;
  user_id: string;
  description: string;
  type: string;
  barangay: string;
  status: string;
  date_reported: string;
};

type Message = {
  id: number;
  report_id: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
  is_image?: boolean;
  image_url?: string;
};

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  useEffect(() => {
    fetchAllReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      fetchMessages(selectedReport.id);
    } else {
      setMessages([]);
    }
  }, [selectedReport]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAllReports = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('date_reported', { ascending: false });
    if (error) setErrorMsg(error.message);
    else setReports(data as IncidentReport[]);
    setLoading(false);
  };

  const fetchMessages = async (reportId: number) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) setErrorMsg(error.message);
    else setMessages(data as Message[]);
  };

  const formatPHTime = (dateString: string) => {
    const utcDate = new Date(dateString);
    if (isNaN(utcDate.getTime())) return 'Invalid date';
    const phDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    return phDate.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleMessageChange = (value: string) => setMessage(value);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedReport) return;
    if (selectedReport.status === 'Resolved') {
      setErrorMsg('Cannot send message: Report is resolved.');
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from('messages').insert([
      {
        report_id: selectedReport.id,
        sender: 'admin',
        message: message.trim(),
      },
    ]);

    if (insertError) {
      setErrorMsg(insertError.message);
      setLoading(false);
      return;
    }

    if (selectedReport.status === 'Pending') {
      const { error: updateError } = await supabase
        .from('incident_reports')
        .update({ status: 'In Progress' })
        .eq('id', selectedReport.id);
      if (updateError) {
        setErrorMsg(updateError.message);
        setLoading(false);
        return;
      }
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: 'In Progress' } : r
        )
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: 'In Progress' } : null
      );
    }

    await fetchMessages(selectedReport.id);
    setMessage('');
    setLoading(false);
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    setLoading(true);

    const { error } = await supabase
      .from('incident_reports')
      .update({ status: 'Resolved' })
      .eq('id', selectedReport.id);

    if (error) setErrorMsg(error.message);
    else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: 'Resolved' } : r
        )
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: 'Resolved' } : null
      );
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedReport) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedReport.status === 'Resolved') {
      setErrorMsg('Cannot send image: Report is resolved.');
      return;
    }

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedReport.id}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(filePath, file);

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    const { error: insertError } = await supabase.from('messages').insert([
      {
        report_id: selectedReport.id,
        sender: 'admin',
        is_image: true,
        image_url: publicUrl,
        message: '',
      },
    ]);

    if (insertError) {
      setErrorMsg(insertError.message);
      setLoading(false);
      return;
    }

    if (selectedReport.status === 'Pending') {
      const { error: updateError } = await supabase
        .from('incident_reports')
        .update({ status: 'In Progress' })
        .eq('id', selectedReport.id);

      if (!updateError) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id ? { ...r, status: 'In Progress' } : r
          )
        );
        setSelectedReport((prev) =>
          prev ? { ...prev, status: 'In Progress' } : null
        );
      }
    }

    await fetchMessages(selectedReport.id);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

 const handleLogout = async () => {
  setLoading(true);
  setErrorMsg('');

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('Failed to get user:', userError.message);
    setLoading(false);
    return;
  }

  const userEmail = user?.email ?? 'unknown';

  // Insert a logout record into user_logs table
  const { error: logError } = await supabase.from('user_logs').insert([
    {
      user_email: userEmail,
      action: 'logout',
      details: null,
    },
  ]);
  if (logError) {
    console.error('Failed to log logout:', logError.message);
  }

  // Proceed with logout
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    setErrorMsg(signOutError.message);
    setLoading(false);
    return;
  }

  setLoading(false);
  history.push('/login')
};


  return (
    <IonSplitPane contentId="main-content">
      <IonMenu contentId="main-content" side="start" menuId="main-menu">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem button routerLink="/logs" routerDirection="none">
              <IonLabel>Logs</IonLabel>
            </IonItem>
            <IonItem button onClick={handleLogout}>
              <IonLabel>Logout</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton menu="main-menu" />
            </IonButtons>
            <IonTitle>Admin Dashboard</IonTitle>
            {selectedReport && (
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedReport(null)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            )}
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
          {loading && <IonSpinner name="dots" />}

          {!selectedReport ? (
            <IonList>
              {reports.length === 0 ? (
                <IonText>No reports found.</IonText>
              ) : (
                reports.map((report) => (
                  <IonItem
                    key={report.id}
                    button
                    onClick={() => setSelectedReport(report)}
                  >
                    <IonLabel>
                      <h2>{report.title}</h2>
                      <p>
                        <strong>Type:</strong> {report.type} |{' '}
                        <strong>Barangay:</strong> {report.barangay}
                      </p>
                      <p>{report.description}</p>
                      <p>
                        <small>
                          <strong>Date Reported:</strong>{' '}
                          {formatPHTime(report.date_reported)}
                        </small>
                      </p>
                    </IonLabel>
                    <IonBadge
                      color={
                        report.status === 'Pending'
                          ? 'warning'
                          : report.status === 'In Progress'
                          ? 'primary'
                          : 'success'
                      }
                    >
                      {report.status}
                    </IonBadge>
                  </IonItem>
                ))
              )}
            </IonList>
          ) : (
            <>
              <IonText>
                <h2>{selectedReport.title}</h2>
                <p>
                  <strong>Type:</strong> {selectedReport.type} |{' '}
                  <strong>Barangay:</strong> {selectedReport.barangay}
                </p>
                <p>{selectedReport.description}</p>
                <p>
                  <small>
                    <strong>Status:</strong>{' '}
                    <IonBadge
                      color={
                        selectedReport.status === 'Pending'
                          ? 'warning'
                          : selectedReport.status === 'In Progress'
                          ? 'primary'
                          : 'success'
                      }
                    >
                      {selectedReport.status}
                    </IonBadge>
                  </small>
                </p>
              </IonText>

              <IonList style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {messages.map((msg) => (
                  <IonItem
                    key={msg.id}
                    lines="none"
                    style={{
                      justifyContent:
                        msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <IonLabel
                      style={{
                        textAlign: msg.sender === 'admin' ? 'right' : 'left',
                        maxWidth: '100%',
                      }}
                    >
                      {msg.is_image && msg.image_url ? (
                        <img
                          src={msg.image_url}
                          alt="uploaded"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      ) : (
                        <p
                          style={{
                            backgroundColor:
                              msg.sender === 'admin' ? '#3880ff' : '#e0e0e0',
                            color: msg.sender === 'admin' ? 'white' : 'black',
                            borderRadius: '12px',
                            padding: '8px 12px',
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.message}
                        </p>
                      )}
                      <br />
                      <small style={{ fontSize: '0.7em', color: '#666' }}>
                        {formatPHTime(msg.created_at)}
                      </small>
                    </IonLabel>
                  </IonItem>
                ))}
                <div ref={messagesEndRef} />
              </IonList>

              {selectedReport.status !== 'Resolved' && (
                <>
                  <IonTextarea
                    value={message}
                    placeholder="Type your message"
                    onIonChange={(e) => handleMessageChange(e.detail.value!)}
                    rows={3}
                    disabled={loading}
                    className="ion-margin-top"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonButton
                      onClick={handleSendMessage}
                      disabled={loading || !message.trim()}
                    >
                      Send
                    </IonButton>
                    <IonButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      color="tertiary"
                    >
                      <IonIcon icon={addOutline} />
                      Upload Image
                    </IonButton>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                  </div>
                </>
              )}

              {selectedReport.status !== 'Resolved' && (
                <IonButton
                  color="success"
                  expand="block"
                  onClick={handleResolveReport}
                  disabled={loading}
                  className="ion-margin-top"
                >
                  Mark as Resolved
                </IonButton>
              )}
            </>
          )}
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default AdminDashboard;
